
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const payoutRequestSchema = z.object({
    amount: z.number().min(150),
    payoutMethod: z.enum(['FLOUCI', 'PAYPAL']),
});

export async function POST(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user || user.role !== 'AFFILIATE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = payoutRequestSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const { amount, payoutMethod } = result.data;

        // Get Affiliate Profile
        const affiliate = await prisma.affiliate.findUnique({
            where: { userId: user.id },
            include: { store: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
        }

        // Check Balance
        const pendingAgg = await prisma.commission.aggregate({
            where: {
                affiliateId: affiliate.id,
                status: 'PENDING'
            },
            _sum: { amount: true }
        });

        // Use Big/Decimal handling if strict, here using Number for MVP
        const totalPending = Number(pendingAgg._sum.amount || 0);

        if (totalPending < amount) {
            return NextResponse.json({ error: 'Insufficient pending balance' }, { status: 400 });
        }

        // Create Payout Request
        const payoutRequest = await prisma.payoutRequest.create({
            data: {
                affiliateId: affiliate.id,
                storeId: affiliate.storeId,
                amount: amount,
                payoutMethod: payoutMethod as 'FLOUCI' | 'PAYPAL',
                status: 'PENDING_APPROVAL'
            }
        });

        // Mark Commissions as PENDING_PAYOUT
        // Strategy: We need to mark strictly `amount` worth of commissions? 
        // Or just all PENDING ones up to that amount? 
        // Usually, you request "all available" or a specific amount. If specific amount, we need to pick which commissions to lock.
        // Simplifying: User usually requests a payout, and we lock the oldest commissions summing up to that amount.
        // OR simpler: Update ALL 'PENDING' commissions to 'PENDING_PAYOUT'
        // But the request allows specific amount. 
        // If I request 150 but have 200 pending, I should only lock 150.

        // For this MVP, let's assume we lock ALL 'PENDING' commissions if the user requests ~total, or 
        // we find commissions that sum >= amount.

        // Let's implement logic: Fetch PENDING commissions by date asc. Sum them until >= amount.
        const commissions = await prisma.commission.findMany({
            where: { affiliateId: affiliate.id, status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        });

        let currentSum = 0;
        const commissionsToLock: string[] = [];

        for (const comm of commissions) {
            if (currentSum >= amount) break;
            currentSum += Number(comm.amount);
            commissionsToLock.push(comm.id);
        }

        // Update status
        await prisma.commission.updateMany({
            where: { id: { in: commissionsToLock } },
            data: { status: 'PENDING_PAYOUT' } // We need to add this enum value if not exists. I added it in step 214.
        });

        // Notify Store Owner (TODO: Dashboard/Email)

        return NextResponse.json({
            payoutRequest,
            message: 'Payout request sent to store owner'
        }, { status: 201 });

    } catch (error) {
        console.error('Payout request error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
