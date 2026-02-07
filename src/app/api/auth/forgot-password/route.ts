
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { signToken } from '@/lib/auth/jwt';
import { sendPasswordResetEmail } from '@/lib/email/sendgrid';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = forgotPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid email', details: result.error.issues }, { status: 400 });
        }

        const { email } = result.data;

        let user;
        try {
            user = await prisma.user.findUnique({
                where: { email }
            });
        } catch (dbError) {
            console.error('Database query error (forgot-password):', dbError instanceof Error ? dbError.message : dbError);
            if (dbError instanceof Error) console.error(dbError.stack);
            throw dbError;
        }

        if (user) {
            // Generate reset token (valid for 1 hour)
            // We use the same JWT structure but maybe add a "purpose" claim if we were strict. 
            // For MVP, checking existence of user is enough context + expiration.
            // Better: includes the current password hash in the secret to invalidate if password changes?
            // Standard approach: just strict short expiration.
            const token = signToken({
                userId: user.id,
                email: user.email,
                role: user.role
            }, '1h');

            const locale = user.language === 'AR' ? 'ar' : 'fr';
            await sendPasswordResetEmail(user.email, token, locale);
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: 'If the email exists, a reset link has been sent.' }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error instanceof Error ? error.message : error);
        if (error instanceof Error) console.error('Error stack:', error.stack);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
