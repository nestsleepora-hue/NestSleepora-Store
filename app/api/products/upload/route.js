import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { authenticateAdmin } from '@/lib/authHelper';

export async function POST(req) {
  try {
    await authenticateAdmin(req);

    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const urls = [];
    for (const file of files) {
      if (!(file instanceof File)) continue;

      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.webm'];
      const ext = path.extname(file.name).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        return NextResponse.json({ error: 'Security Check: Only images and videos are permitted.' }, { status: 400 });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `sleepora-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      // Return relative media path (clean for Next.js routing)
      urls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls });

  } catch (err) {
    console.error('File upload API error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
