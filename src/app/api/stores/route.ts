
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/client';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { z } from 'zod';

const createStoreSchema = z.object({
    name: z.string().min(3),
    template: z.enum(['ARTISAN', 'MODETN', 'TECHDARI']),
    governorate: z.enum([
        'TUNIS', 'SFAX', 'SOUSSE', 'KAIROUAN', 'BIZERTE', 'GABES', 'MONASTIR',
        'MAHDIA', 'TOZEUR', 'KEF', 'JENDOUBA', 'NABEUL', 'ZAGHOUAN', 'BEN_AROUS',
        'MANOUBA', 'SILIANA', 'KASSERINE', 'SIDI_BOUZID', 'GAFSA', 'MEDENINE', 'TATAOUINE'
    ]),
    commissionRate: z.number().min(0.05).max(0.30).optional().default(0.15),
});

export async function POST(req: NextRequest) {
    try {
        const user = await authenticate(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'STORE_OWNER') {
            return NextResponse.json({ error: 'Only store owners can create stores' }, { status: 403 });
        }

        const body = await req.json();
        const result = createStoreSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.issues }, { status: 400 });
        }

        const { name, template, governorate, commissionRate } = result.data;

        const subdomain = await generateUniqueSlug(name);

        const store = await prisma.store.create({
            data: {
                ownerId: user.id,
                name,
                subdomain,
                template: template as 'ARTISAN' | 'MODETN' | 'TECHDARI',
                governorate: governorate as any, // Cast to any to avoid complex enum imports unless we import from client
                commissionRate,
            },
        });

        return NextResponse.json({
            store: {
                id: store.id,
                subdomain: `${store.subdomain}.storepulse.tn`,
                previewUrl: `/fr/store/preview/${store.subdomain}`,
                name: store.name
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Create store error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
