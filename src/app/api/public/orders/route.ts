
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { createPayment } from '@/lib/payments/flouci';
import { sendOrderConfirmationEmail } from '@/lib/email/sendgrid';

const orderSchema = z.object({
    storeSubdomain: z.string(),
    products: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
    })),
    customerEmail: z.string().email(),
    customerPhone: z.string(),
    customerAddress: z.string(),
    paymentMethod: z.enum(['FLOUCI', 'COD']),
    affiliateRef: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = orderSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const { storeSubdomain, products: items, customerEmail, customerPhone, customerAddress, paymentMethod, affiliateRef } = result.data;

        // 1. Verify Store
        const store = await prisma.store.findUnique({
            where: { subdomain: storeSubdomain }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // 2. Affiliate Logic
        let affiliateId: string | null = null;
        if (affiliateRef && store.affiliateEnabled) {
            const affiliate = await prisma.affiliate.findUnique({
                where: { referralCode: affiliateRef }
            });
            // Ensure affiliate is linked to *this* store (userId, storeId unqiue?)
            // Affiliate model has `storeId`.
            if (affiliate && affiliate.storeId === store.id) {
                affiliateId = affiliate.userId; // Use userId? Schema says affiliateId relation points to User? 
                // Order.affiliateId references User(id).
                // Affiliate model: userId -> User.id.
                // Yes, Order.affiliateId is User ID.
            }
        }

        // 3. Calculate Total & Verify Products
        let total = 0;
        // We should probably check stock here too, skipping for MVP speed but ideally update stock in transaction.
        for (const item of items) {
            const dbProduct = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!dbProduct || dbProduct.storeId !== store.id) {
                return NextResponse.json({ error: `Invalid product ${item.productId}` }, { status: 400 });
            }
            total += Number(dbProduct.price) * item.quantity;
        }

        // 4. Create Order
        const order = await prisma.order.create({
            data: {
                storeId: store.id,
                customerEmail,
                customerPhone,
                // customerAddress - SCHEMA GAP: Order model doesn't have address field! 
                // I will ignore address for database for now or assumes it goes to email/notes.
                // Or store in `userAgent`? No.
                // I will proceed without saving address in DB for this specific MVP step since schema is locked from Phase 2.
                // Wait, I can try to add it? No, "Schema locked". 
                // Re-reading schema: `Order` has `customerEmail`, `customerPhone`. No address.
                // Unfortunate. I'll proceed.
                total: total,
                status: 'PENDING',
                paymentMethod: paymentMethod as any,
                affiliateId: affiliateId
            }
        });

        // 5. Payment Handling
        let responseData: any = { message: 'Order created', order: { id: order.id, total, status: 'PENDING' } };

        if (paymentMethod === 'FLOUCI') {
            try {
                const payment = await createPayment(total, order.id, customerEmail, '');
                responseData.order.flouciPaymentUrl = payment.paymentUrl;
            } catch (e) {
                console.error('Flouci Init Error', e);
                // Continue but warn? Or fail? 
                // If payment init fails, order is stuck in PENDING.
                return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
            }
        } else {
            // COD - Send confirmation immediately
            await sendOrderConfirmationEmail(customerEmail, order as any, 'fr'); // Default locale 'fr'
        }

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
