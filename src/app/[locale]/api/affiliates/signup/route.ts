
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { z } from 'zod';

const affiliateSignupSchema = z.object({
    storeSubdomain: z.string(),
    userEmail: z.string().email(),
    userPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = affiliateSignupSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }
        const { storeSubdomain, userEmail, userPassword } = result.data;

        // Find Store
        // Subdomain might be full "sub.domain.tn" or just "sub". Assuming "sub" or checking both logic?
        // Store `subdomain` field usually stores the slug.
        // If input is "bijouterie-ali.storepulse.tn", extract "bijouterie-ali".
        // Or assume user passes the slug. Prompt example: "bijouterie-ali.storepulse.tn".
        // I'll try to extract the slug.
        const slug = storeSubdomain.includes('.') ? storeSubdomain.split('.')[0] : storeSubdomain;

        const store = await prisma.store.findUnique({ where: { subdomain: slug } });
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (!store.affiliateEnabled) {
            return NextResponse.json({ error: 'Affiliate program disabled for this store' }, { status: 403 });
        }

        // Find or Create User
        let user = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!user) {
            const hashedPassword = await hashPassword(userPassword);
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash: hashedPassword,
                    role: 'AFFILIATE',
                    language: 'FR'
                }
            });
        }

        // Check if already affiliate for this store
        const existingAffiliate = await prisma.affiliate.findUnique({
            where: {
                userId_storeId: {
                    userId: user.id,
                    storeId: store.id
                }
            }
        });

        if (existingAffiliate) {
            return NextResponse.json({ error: 'Already an affiliate for this store' }, { status: 409 });
        }

        // Create Affiliate Profile
        // generate referral code: userEmailName + random
        const baseName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const referralCode = `${baseName}_${Math.floor(Math.random() * 10000)}`;

        const affiliate = await prisma.affiliate.create({
            data: {
                userId: user.id,
                storeId: store.id,
                referralCode,
                status: 'ACTIVE'
            }
        });

        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        const referralLink = process.env.NODE_ENV === 'development'
            ? `http://localhost:3000/api/track/click?ref=${referralCode}`
            : `https://storepulse.tn/api/track/click?ref=${referralCode}`;

        return NextResponse.json({
            affiliate: {
                id: affiliate.id,
                referralCode: affiliate.referralCode,
                referralLink
            },
            token
        }, { status: 201 });

    } catch (error) {
        console.error('Affiliate signup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
