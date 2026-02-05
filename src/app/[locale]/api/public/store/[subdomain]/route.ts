
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> } // Next.js 16/15 promise params
) {
    try {
        const { subdomain } = await params;

        // Find store by subdomain
        const store = await prisma.store.findUnique({
            where: { subdomain },
            include: {
                products: true // simplified, we might want to filter active? Product model doesn't have status yet, assumes all active.
            }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Public response shape
        return NextResponse.json({
            store: {
                id: store.id,
                name: store.name,
                template: store.template,
                governorate: store.governorate,
                affiliateEnabled: store.affiliateEnabled
            },
            products: store.products.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                images: p.images,
                stock: p.stock,
                description: p.description
            }))
        });
    } catch (error) {
        console.error('Public Store Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
