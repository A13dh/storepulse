
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const rejectSchema = z.object({
    reason: z.string().min(1),
});

type Context = {
    params: Promise<{ payoutId: string }>
}

export async function PUT(req: NextRequest, context: Context) {
    try {
        const user = await authenticate(req);
        if (!user || user.role !== 'STORE_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await context.params;
        const { payoutId } = params;

        const body = await req.json();
        const result = rejectSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: 'Reason required', details: result.error.issues }, { status: 400 });

        const payoutRequest = await prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: { store: true }
        });

        if (!payoutRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        if (payoutRequest.store.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (payoutRequest.status !== 'PENDING_APPROVAL') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

        await prisma.$transaction(async (tx: any) => {
            // Reject Request
            await tx.payoutRequest.update({
                where: { id: payoutId },
                data: {
                    status: 'REJECTED',
                    notes: result.data.reason
                }
            });

            // Revert commissions to PENDING
            await tx.commission.updateMany({
                where: {
                    affiliateId: payoutRequest.affiliateId,
                    status: 'PENDING_PAYOUT'
                },
                data: { status: 'PENDING' }
            });
        });

        return NextResponse.json({
            message: 'Payout rejected',
            payoutRequest: { id: payoutId, status: 'REJECTED' }
        }, { status: 200 });

    } catch (error) {
        console.error('Reject payout error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
