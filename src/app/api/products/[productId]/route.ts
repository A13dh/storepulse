
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const updateProductSchema = z.object({
    name: z.string().optional(),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional(),
});

type Context = {
    params: Promise<{ productId: string }>
}

export async function PUT(req: NextRequest, context: Context) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const params = await context.params;
        const { productId } = params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const result = updateProductSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: result.data
        });

        return NextResponse.json({ product: updatedProduct }, { status: 200 });

    } catch (error) {
        console.error('Update product error:', error);
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
        const { productId } = params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.product.delete({
            where: { id: productId }
        });

        return NextResponse.json({ message: 'Product deleted' }, { status: 200 });

    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
