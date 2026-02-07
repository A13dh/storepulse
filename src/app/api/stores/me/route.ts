
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stores = await prisma.store.findMany({
            where: {
                ownerId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ stores }, { status: 200 });

    } catch (error) {
        console.error('Get stores error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
