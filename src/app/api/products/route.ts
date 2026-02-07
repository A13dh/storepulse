
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

// Helper to validate product input (simplified for FormData parsing)
const productSchema = z.object({
    storeId: z.string().uuid(),
    name: z.string().min(1),
    price: z.number().min(0),
    description: z.string().optional(),
    stock: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const storeId = formData.get('storeId') as string;
        const name = formData.get('name') as string;
        const price = parseFloat(formData.get('price') as string);
        const description = formData.get('description') as string;
        const stock = parseInt(formData.get('stock') as string) || 0;
        const images = formData.getAll('images'); // File[]

        // Validate ownership
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }
        if (store.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validation
        const validation = productSchema.safeParse({ storeId, name, price, description, stock });
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
        }

        // Mock Image Upload (TODO: Implement actual S3 upload)
        const imageUrls: string[] = [];
        for (const img of images) {
            if (img instanceof File) {
                // In a real app, upload `img` to S3 here and push the URL
                // For now, we just fake it or use a placeholder
                // unique name = `${storeId}/${Date.now()}-${img.name}`
                imageUrls.push(`https://mock-s3.storepulse.tn/${storeId}/${img.name}`);
            }
        }

        const product = await prisma.product.create({
            data: {
                storeId,
                name,
                price: validation.data.price, // Prisma Decimal needs special handling? Actually Prisma client handles JS number to Decimal usually, or string.
                description,
                stock,
                images: imageUrls
            }
        });

        return NextResponse.json({ product }, { status: 201 });

    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        // Public access allowed for fetching products? Yes, for storefronts.
        // But maybe we check if store exists first.

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where: { storeId },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where: { storeId } })
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
