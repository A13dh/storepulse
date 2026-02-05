
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        // Check store ownership
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        if (store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const whereClause: any = { storeId };
        if (status) {
            whereClause.status = status;
        }

        const [orders, total] = await prisma.$transaction([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    affiliate: {
                        select: {
                            // Affiliate is a User relation
                            // Wait, schema says affiliate is User?
                            // model Order { ... affiliate User? ... }
                            // Yes.
                            email: true,
                            // But wait, name is not on User directly in schema shown in prompt?
                            // User has email, password, etc. No "name".
                            // The response example says: { "affiliate": { "name": "string", "email": "string" } }
                            // I'll return email for now, or check if specific profile exists.
                        }
                    }
                },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where: whereClause })
        ]);

        return NextResponse.json({
            orders: orders.map((o: any) => ({
                id: o.id,
                customerEmail: o.customerEmail,
                total: o.total,
                status: o.status,
                paymentMethod: o.paymentMethod,
                affiliate: o.affiliate ? { email: o.affiliate.email } : null,
                createdAt: o.createdAt
            })),
            pagination: {
                page,
                limit,
                total
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
