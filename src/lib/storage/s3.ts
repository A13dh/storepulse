
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
    }
});

export async function uploadImage(file: File, folder: 'products' | 'stores'): Promise<string> {
    const isMock = process.env.AWS_ACCESS_KEY_ID === 'mock';

    if (isMock) {
        // Mock upload behavior
        console.warn('AWS S3 Credentials missing. Using mock URL.');
        return `https://mock-s3.storepulse.tn/${folder}/${Date.now()}_${file.name}`;
    }

    const timestamp = Date.now();
    // Simple random string
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${folder}/${timestamp}_${randomString}_${file.name.replace(/\s/g, '_')}`;

    // Convert File to ArrayBuffer/Buffer for Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        // ACL: 'public-read' // Note: Bucket might block public ACLs by default, ensure bucket policy allows public read or use CloudFront
    };

    await s3Client.send(new PutObjectCommand(params));

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

export async function deleteImage(url: string): Promise<void> {
    if (url.includes('mock-s3')) return;

    try {
        const key = url.split('.com/')[1];
        if (!key) return;

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key
        };

        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error('S3 Delete Error', error);
    }
}
