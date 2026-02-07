
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ subdomain: string }> }
) {
    try {
        const { subdomain } = await params;

        // Find store with products
        const store = await prisma.store.findUnique({
            where: {
                subdomain,
                status: 'ACTIVE'
            },
            include: {
                products: {
                    where: { stock: { gt: 0 } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Store not found or inactive
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Transform products with proper typing
        const products = store.products.map((product: any) => ({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            description: product.description || '',
            images: product.images || [],
            stock: product.stock,
            createdAt: product.createdAt.toISOString()
        }));

        // Return store + products
        // Using NextResponse to make it standard
        return NextResponse.json({
            store: {
                id: store.id,
                name: store.name,
                template: store.template,
                governorate: store.governorate,
                // logo: store.logo || null, // Schema doesn't have logo?
                // Checking schema from previous turns: Store has: id, ownerId, name, subdomain, template, commissionRate, affiliateEnabled, governorate, currency, status, createdAt.
                // NO LOGO field in Schema!
                // I will Comment out logo to avoid TS error.
                // logo: store.logo || null, 
                affiliateEnabled: store.affiliateEnabled,
                createdAt: store.createdAt.toISOString()
            },
            products
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });
    } catch (error) {
        console.error('Store fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
