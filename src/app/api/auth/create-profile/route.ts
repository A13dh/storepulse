import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// Create user profile in our database when Supabase signup completes
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { supabaseUserId, email, role = 'STORE_OWNER' } = body;

        if (!supabaseUserId || !email) {
            return NextResponse.json({ error: 'Supabase user ID and email are required' }, { status: 400 });
        }

        // Check if user already exists by ID
        let user = await prisma.user.findUnique({
            where: { id: supabaseUserId },
        });

        if (user) {
            return NextResponse.json({ user }, { status: 200 });
        }

        // Check if user exists by email (maybe from old auth system)
        const userByEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (userByEmail) {
            // Update the existing user with the Supabase ID
            user = await prisma.user.update({
                where: { email },
                data: { id: supabaseUserId },
            });
            return NextResponse.json({ user }, { status: 200 });
        }

        // Create new user with Supabase ID as our ID
        user = await prisma.user.create({
            data: {
                id: supabaseUserId,
                email: email,
                passwordHash: '', // Not used with Supabase Auth
                role: role as 'STORE_OWNER' | 'AFFILIATE' | 'CUSTOMER' | 'ADMIN',
                language: 'FR',
            },
            select: {
                id: true,
                email: true,
                role: true,
                language: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });

    } catch (error) {
        console.error('Create profile error:', error instanceof Error ? error.message : error);
        if (error instanceof Error) console.error('Error stack:', error.stack);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
