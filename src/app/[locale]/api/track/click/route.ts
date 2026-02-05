
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
// import { ipAddress } from '@vercel/functions';
import { hashIP } from '@/lib/utils/ipHash';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ref = searchParams.get('ref');

        if (!ref) {
            return NextResponse.json({ error: 'Missing ref code' }, { status: 400 });
            // Or redirect to generic home
        }

        const affiliate = await prisma.affiliate.findUnique({
            where: { referralCode: ref },
            include: { store: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
        }

        // Track Click
        // Get IP
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const hashedIp = hashIP(ip);
        const userAgent = req.headers.get('user-agent');

        // Async logging (fire and forget vs await?)
        // In serverless, better to await or use a queue. We await for safety.
        await prisma.click.create({
            data: {
                affiliateId: affiliate.id,
                ipHash: hashedIp,
                userAgent: userAgent || null,
            }
        });

        // Create response with redirect and cookie
        // Redirect to store homepage. 
        // Usually: `https://${affiliate.store.subdomain}.storepulse.tn`
        // For dev/local, might be different. 
        // We assume the stored previewUrl format or construct it.
        // The prompt says "Redirect to store homepage".
        // Let's assume absolute URL construction based on env or basic relative if same domain (unlikely for subdomain app).
        // I'll construct a URL.

        // In dev: localhost:3000/fr/store/preview/subdomain (from store create response)
        // In prod: subdomain.storepulse.tn

        const targetUrl = process.env.NODE_ENV === 'development'
            ? new URL(`/fr/store/preview/${affiliate.store.subdomain}`, req.url)
            : `https://${affiliate.store.subdomain}.storepulse.tn`;

        const response = NextResponse.redirect(targetUrl);

        // Set cookie
        // Name: `affiliate_ref`
        // Value: ref
        // MaxAge: 30 days * 24 * 60 * 60
        response.cookies.set('affiliate_ref', ref, {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
            // domain: '.storepulse.tn', // valid for main domain and subdomains in prod
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return response;

    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
