import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// Fetch user profile by Supabase user ID
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { supabaseUserId } = body;

        if (!supabaseUserId) {
            return NextResponse.json({ error: 'Supabase user ID is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: supabaseUserId },
            select: {
                id: true,
                email: true,
                role: true,
                language: true,
                phone: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.error('Profile fetch error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
