
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['STORE_OWNER', 'AFFILIATE']),
    language: z.enum(['FR', 'AR']).optional().default('FR'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = signupSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const { email, password, role, language } = result.data;

        // Check if user exists
        try {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return NextResponse.json({ error: 'User already exists' }, { status: 409 });
            }
        } catch (dbError) {
            console.error('Database query error:', dbError);
            throw dbError;
        }

        const hashedPassword = await hashPassword(password);

        let user;
        try {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role,
                    language: language as 'FR' | 'AR', // Cast to fit Prisma enum
                },
            });
        } catch (createError) {
            console.error('User creation error:', createError);
            throw createError;
        }

        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // TODO: Send verification email here (mocked for now)
        console.log(`[Email Mock] Verification email sent to ${email}`);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                language: user.language,
            },
            token,
            message: 'Verification email sent',
        }, { status: 201 });

    } catch (error) {
        console.error('Signup error:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
