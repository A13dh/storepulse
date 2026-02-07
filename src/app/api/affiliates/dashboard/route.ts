
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user || user.role !== 'AFFILIATE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const affiliate = await prisma.affiliate.findFirst({ // Should be unique per store? User might have multiple affiliate profiles?
            // Schema says: userId is unique in Affiliate model? 
            // `model Affiliate { ... userId String @unique ... }`
            // Yes, meaning one user can only be affiliate for ONE store? 
            // "userId String @unique" -> Yes, strict 1:1 relation between User and Affiliate profile.
            // This might be restrictive for a platform where a user affiliates for multiple stores,
            // but for this specified schema, it's 1:1.
            where: { userId: user.id },
            include: { store: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
        }

        // Summary Stats
        // 1. Clicks (Last 30 days usually, but lets do total for now or query param)
        const totalClicks = await prisma.click.count({
            where: { affiliateId: affiliate.id }
        });

        // 2. Conversions (Clicks with orderId)
        // Wait, conversions are tracked on Click model: `converted Boolean`.
        // Or check `commissions` count?
        // Prompt says: "Count conversions (clicks with orderId NOT NULL)"
        const conversions = await prisma.click.count({
            where: {
                affiliateId: affiliate.id,
                orderId: { not: null }
            }
        });

        const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

        // 3. Earnings
        // Pending
        const pendingAgg = await prisma.commission.aggregate({
            where: { affiliateId: affiliate.id, status: 'PENDING' },
            _sum: { amount: true }
        });
        const pendingEarnings = Number(pendingAgg._sum.amount || 0);

        // Paid
        const paidAgg = await prisma.commission.aggregate({
            where: { affiliateId: affiliate.id, status: 'PAID' },
            _sum: { amount: true }
        });
        const paidEarnings = Number(paidAgg._sum.amount || 0);

        // 4. Payout Logic
        const payoutThreshold = 150.0;
        const remainingToPayout = Math.max(0, payoutThreshold - pendingEarnings);

        // Recent Activity
        const recentClicks = await prisma.click.findMany({
            where: { affiliateId: affiliate.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, createdAt: true, ipHash: true, converted: true }
        });

        const recentCommissions = await prisma.commission.findMany({
            where: { affiliateId: affiliate.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, orderId: true, amount: true, status: true, createdAt: true }
        });

        // Referral Link
        // Construct standard link
        const referralLink = process.env.NODE_ENV === 'development'
            ? `http://localhost:3000/api/track/click?ref=${affiliate.referralCode}`
            : `https://${affiliate.store.subdomain}.storepulse.tn?ref=${affiliate.referralCode}`; // Or the track endpoint

        return NextResponse.json({
            summary: {
                totalClicks,
                conversions,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                pendingEarnings,
                paidEarnings,
                payoutThreshold,
                remainingToPayout
            },
            recentClicks: recentClicks.map((c: any) => ({
                id: c.id,
                timestamp: c.createdAt,
                ipHash: c.ipHash,
                converted: c.converted
            })),
            recentCommissions,
            referralLink,
            referralCode: affiliate.referralCode
        }, { status: 200 });

    } catch (error) {
        console.error('Affiliate dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
