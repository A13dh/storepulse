
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendOrderConfirmationEmail } from '@/lib/email/sendgrid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transaction_id, order_id, status, amount } = body;

        // TODO: Verify signature if Flouci provides secret

        if (status === 'PAID') {
            const order = await prisma.order.findUnique({
                where: { id: order_id }
            });

            if (order && order.status !== 'PAID') {
                // Update Order
                await prisma.order.update({
                    where: { id: order_id },
                    data: {
                        status: 'PAID',
                        flouciTransactionId: String(transaction_id)
                    }
                });

                // Calculate Commissions if affiliate attached
                if (order.affiliateId) {
                    const store = await prisma.store.findUnique({ where: { id: order.storeId } });
                    if (store && store.affiliateEnabled) {
                        const commissionAmount = Number(order.total) * Number(store.commissionRate);

                        await prisma.commission.create({
                            data: {
                                affiliateId: (await prisma.affiliate.findUnique({ where: { userId: order.affiliateId } }))!.id,
                                orderId: order.id,
                                amount: commissionAmount,
                                status: 'PENDING'
                            }
                        });
                    }
                }

                // Send Email
                await sendOrderConfirmationEmail(order.customerEmail, order as any, 'fr');
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
