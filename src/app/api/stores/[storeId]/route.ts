
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const updateStoreSchema = z.object({
    name: z.string().optional(),
    commissionRate: z.number().min(0.00).max(0.50).optional(),
    affiliateEnabled: z.boolean().optional(),
    governorate: z.enum([
        'TUNIS', 'SFAX', 'SOUSSE', 'KAIROUAN', 'BIZERTE', 'GABES', 'MONASTIR',
        'MAHDIA', 'TOZEUR', 'KEF', 'JENDOUBA', 'NABEUL', 'ZAGHOUAN', 'BEN_AROUS',
        'MANOUBA', 'SILIANA', 'KASSERINE', 'SIDI_BOUZID', 'GAFSA', 'MEDENINE', 'TATAOUINE'
    ]).optional(),
});

type Context = {
    params: Promise<{ storeId: string }>
}

export async function PUT(req: NextRequest, context: Context) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await context.params;
        const { storeId } = params;

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const result = updateStoreSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: result.data,
        });

        return NextResponse.json({ store: updatedStore }, { status: 200 });

    } catch (error) {
        console.error('Update store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: Context) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await context.params;
        const { storeId } = params;

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.store.delete({
            where: { id: storeId }
        });

        return NextResponse.json({ message: 'Store deleted' }, { status: 200 });

    } catch (error) {
        console.error('Delete store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
