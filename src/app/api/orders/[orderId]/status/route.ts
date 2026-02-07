
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const updateStatusSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

type Context = {
    params: Promise<{ orderId: string }>
}

export async function PUT(req: NextRequest, context: Context) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await context.params;
        const { orderId } = params;

        const body = await req.json();
        const result = updateStatusSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }
        const newStatus = result.data.status;

        // Fetch order with store info to check commission settings
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: true,
                commission: true // check if commission already exists
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Commission Logic
        let commissionTriggered = false;

        // Transaction to update order and potential commission
        await prisma.$transaction(async (tx: any) => {
            const updateData: any = { status: newStatus };

            // If delivering COD order
            if (newStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
                updateData.codConfirmedByOwnerAt = new Date(); // NOW

                // Check if affiliate exists and commission enabled and not already created
                if (order.affiliateId && order.store.affiliateEnabled && !order.commission) {
                    // Calculate commission
                    // order.total is Decimal
                    // commissionRate is Decimal
                    // Need to handle Decimal/BigInt precision if strict, but here roughly:
                    const commissionAmount = Number(order.total) * Number(order.store.commissionRate);

                    // Get affiliate details (to link to Affiliate record, wait. Order.affiliateId is UserID or AffiliateID?
                    // Schema: 
                    // model Order { ... affiliateId String? ... affiliate User? ... }
                    // It seems affiliateId points to User? 
                    // Let's re-read schema.
                    // `affiliate User? @relation("AffiliateOrders", ...)`
                    // So affiliateId is a User ID.
                    // But Commission links to `Affiliate` model.
                    // `model Commission { ... affiliate Affiliate ... }`
                    // So we need to find the `Affiliate` record for this `User` and `Store`.

                    const affiliateRecord = await tx.affiliate.findUnique({
                        where: {
                            userId_storeId: {
                                userId: order.affiliateId,
                                storeId: order.storeId
                            }
                        }
                    });

                    if (affiliateRecord) {
                        await tx.commission.create({
                            data: {
                                affiliateId: affiliateRecord.id,
                                orderId: order.id,
                                amount: commissionAmount,
                                status: 'PENDING'
                            }
                        });
                        commissionTriggered = true;
                        // Trigger email notification (TODO)
                    }
                }
            }

            await tx.order.update({
                where: { id: orderId },
                data: updateData
            });
        });

        return NextResponse.json({
            order: { ...order, status: newStatus },
            commissionTriggered
        }, { status: 200 });

    } catch (error) {
        console.error('Update order status error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
