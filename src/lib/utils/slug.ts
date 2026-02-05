
import slugify from 'slugify';
import { prisma } from '@/lib/db/client';

export async function generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name, { lower: true, strict: true });

    // Check if slug exists
    let existingStore = await prisma.store.findUnique({
        where: { subdomain: slug }
    });

    if (!existingStore) {
        return slug;
    }

    // If exists, append random suffix
    let suffix = 1;
    while (true) {
        const newSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        const check = await prisma.store.findUnique({
            where: { subdomain: newSlug }
        });

        if (!check) {
            return newSlug;
        }
    }
}
