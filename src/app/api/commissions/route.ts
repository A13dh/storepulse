
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
        const status = searchParams.get('status'); // PENDING | PAID | ALL
        const storeId = searchParams.get('storeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const whereClause: any = {};

        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        // Role Filter
        if (user.role === 'AFFILIATE') {
            // Find affiliate profile
            const affiliate = await prisma.affiliate.findUnique({
                where: { userId: user.id }
            });
            if (!affiliate) {
                return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
            }
            whereClause.affiliateId = affiliate.id;
        } else if (user.role === 'STORE_OWNER') {
            // Store Owners can see commissions for their stores
            if (storeId) {
                // Check ownership
                const store = await prisma.store.findUnique({ where: { id: storeId } });
                if (!store || store.ownerId !== user.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                // Filter commissions by orders in this store
                // Commission -> Order -> Store
                // Prisma doesn't support deep relation filtering in `where` easily for all DBs, but Postgres is fine.
                // `where: { order: { storeId: storeId } }`
                whereClause.order = { storeId: storeId };
            } else {
                // All stores owned by user
                whereClause.order = { store: { ownerId: user.id } };
            }
        } else {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const [commissions, total] = await prisma.$transaction([
            prisma.commission.findMany({
                where: whereClause,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    order: {
                        select: {
                            id: true,
                            customerEmail: true,
                            total: true,
                            status: true,
                            createdAt: true
                        }
                    }
                }
            }),
            prisma.commission.count({ where: whereClause })
        ]);

        // Summaries
        // We need total Pending vs Paid for the current filtered scope (or user scope?)
        // Usually summary matches the user context, not the page filter.
        // I will calculate global stats for this user context.
        const summaryWhere = user.role === 'AFFILIATE'
            ? { affiliateId: whereClause.affiliateId }
            : whereClause.order; // reuse the owner filter logic

        // Note: Summary calculation might be expensive if many records.
        const pendingAgg = await prisma.commission.aggregate({
            where: { ...summaryWhere, status: 'PENDING' },
            _sum: { amount: true }
        });
        const paidAgg = await prisma.commission.aggregate({
            where: { ...summaryWhere, status: 'PAID' },
            _sum: { amount: true }
        });

        return NextResponse.json({
            commissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary: {
                totalPending: Number(pendingAgg._sum.amount || 0),
                totalPaid: Number(paidAgg._sum.amount || 0)
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Commissions list error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
