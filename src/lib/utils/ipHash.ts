
import crypto from 'crypto';

export function hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
}
