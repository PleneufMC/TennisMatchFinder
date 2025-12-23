import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    
    const {
      fullName,
      phone,
      bio,
      avatarUrl,
      selfAssessedLevel,
      availability,
      preferences,
    } = data;

    // Mettre à jour le profil
    await db
      .update(players)
      .set({
        fullName,
        phone: phone || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        selfAssessedLevel,
        availability: availability || null,
        preferences: preferences || null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    const player = result[0];
    
    if (!player) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}
