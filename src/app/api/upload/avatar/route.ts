import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting - 5 uploads par minute
  const rateLimitResponse = await withRateLimit(request, 'upload');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 2 Mo)' }, { status: 400 });
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Format de fichier invalide' }, { status: 400 });
    }

    // Convertir en base64 data URL
    // Note: Pour la production, utiliser un service comme Cloudflare R2, S3, ou Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}
