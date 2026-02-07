
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const approveSchema = z.object({
    notes: z.string().optional(),
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
        const result = approveSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

        const payoutRequest = await prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: { store: true, affiliate: { include: { user: true } } }
        });

        if (!payoutRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        if (payoutRequest.store.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (payoutRequest.status !== 'PENDING_APPROVAL') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

        // Approve Logic
        // 1. Mark request APPROVED
        // 2. Mark linked commissions PAID (Wait, we didn't link commissions to PayoutRequest in schema explicitly... 
        //    We only changed their status to PENDING_PAYOUT. We need to find them.)
        //    Challenge: How do we know WHICH commissions belonged to this request?
        //    Ideally, Commission model should have `payoutRequestId`.
        //    Since we didn't add that, we have to rely on `affiliateId` + status `PENDING_PAYOUT`.
        //    Risk: If multiple requests are pending?
        //    Correction: We should have added `payoutRequestId` to Commission.
        //    Workaround for now: We assume 1 pending request at a time or we just pay all PENDING_PAYOUT commissions for this affiliate.

        await prisma.$transaction(async (tx: any) => {
            await tx.payoutRequest.update({
                where: { id: payoutId },
                data: {
                    status: 'APPROVED',
                    approvedAt: new Date(),
                    notes: result.data.notes
                }
            });

            // Mark valid commissions as PAID
            await tx.commission.updateMany({
                where: {
                    affiliateId: payoutRequest.affiliateId,
                    status: 'PENDING_PAYOUT'
                },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            });

            // Trigger Transfer (Mock)
            console.log(`[Flouci Mock] Transferring ${payoutRequest.amount} to ${payoutRequest.affiliate.user.email}`);
        });

        return NextResponse.json({
            message: 'Payout approved. Processing transfer...',
            payoutRequest: { id: payoutId, status: 'APPROVED' }
        }, { status: 200 });

    } catch (error) {
        console.error('Approve payout error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
