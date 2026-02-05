
import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { prisma } from '@/lib/db/client';

export async function authenticate(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId }
    });

    return user;
}

export function authorizeRole(role: string, allowedRoles: string[]) {
    return allowedRoles.includes(role);
}
