
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const { token, newPassword } = result.data;

        // Verify token
        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update user
        await prisma.user.update({
            where: { id: payload.userId },
            data: { passwordHash }
        });

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
