import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clubCreationRequests, clubs, users } from '@/lib/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendClubCreationRequestEmail } from '@/lib/email/send-email';

// Générer un slug URL-friendly
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// POST: Demander la création d'un club
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clubName, 
      clubDescription, 
      clubAddress, 
      clubWebsite,
      requesterName,
      requesterPhone,
      estimatedMembers 
    } = body;

    // Validation
    if (!clubName || clubName.length < 3) {
      return NextResponse.json({ error: 'Le nom du club doit contenir au moins 3 caractères' }, { status: 400 });
    }

    if (!requesterName) {
      return NextResponse.json({ error: 'Votre nom est requis' }, { status: 400 });
    }

    // Générer le slug
    const clubSlug = slugify(clubName);

    // Vérifier que le slug n'existe pas déjà
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.slug, clubSlug))
      .limit(1);

    if (existingClub.length > 0) {
      return NextResponse.json({ 
        error: 'Un club avec un nom similaire existe déjà. Veuillez choisir un autre nom.' 
      }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours pour ce slug
    const existingRequest = await db
      .select()
      .from(clubCreationRequests)
      .where(
        and(
          eq(clubCreationRequests.clubSlug, clubSlug),
          eq(clubCreationRequests.status, 'pending')
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json({ 
        error: 'Une demande pour un club similaire est déjà en cours de traitement.' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'a pas déjà une demande en cours
    const userPendingRequest = await db
      .select()
      .from(clubCreationRequests)
      .where(
        and(
          eq(clubCreationRequests.userId, session.user.id),
          eq(clubCreationRequests.status, 'pending')
        )
      )
      .limit(1);

    if (userPendingRequest.length > 0) {
      return NextResponse.json({ 
        error: 'Vous avez déjà une demande de création de club en cours.' 
      }, { status: 400 });
    }

    // Récupérer l'email de l'utilisateur
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user?.email) {
      return NextResponse.json({ error: 'Email utilisateur non trouvé' }, { status: 400 });
    }

    // Générer le token d'approbation
    const approvalToken = randomBytes(32).toString('hex');

    // Date d'expiration (7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer la demande
    const [newRequest] = await db
      .insert(clubCreationRequests)
      .values({
        userId: session.user.id,
        requesterName,
        requesterEmail: user.email,
        requesterPhone: requesterPhone || null,
        clubName,
        clubSlug,
        clubDescription: clubDescription || null,
        clubAddress: clubAddress || null,
        clubWebsite: clubWebsite || null,
        estimatedMembers: estimatedMembers || null,
        approvalToken,
        expiresAt,
      })
      .returning();

    if (!newRequest) {
      return NextResponse.json({ error: 'Erreur lors de la création de la demande' }, { status: 500 });
    }

    // Construire les URLs d'approbation/rejet
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
    const approveUrl = `${baseUrl}/api/clubs/approve?token=${approvalToken}&action=approve`;
    const rejectUrl = `${baseUrl}/api/clubs/approve?token=${approvalToken}&action=reject`;

    // Envoyer l'email à l'admin
    const emailSent = await sendClubCreationRequestEmail({
      requesterName,
      requesterEmail: user.email,
      clubName,
      clubDescription: clubDescription || undefined,
      estimatedMembers: estimatedMembers || undefined,
      approveUrl,
      rejectUrl,
    });

    if (!emailSent) {
      console.error('Failed to send club creation request email');
      // On ne fait pas échouer la requête, la demande est quand même enregistrée
    }

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été envoyée ! Vous recevrez une réponse par email sous 48h.',
      requestId: newRequest.id,
    });
  } catch (error) {
    console.error('Error creating club request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET: Vérifier le statut d'une demande
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer la dernière demande de l'utilisateur
    const [lastRequest] = await db
      .select()
      .from(clubCreationRequests)
      .where(eq(clubCreationRequests.userId, session.user.id))
      .orderBy(clubCreationRequests.createdAt)
      .limit(1);

    if (!lastRequest) {
      return NextResponse.json({ hasRequest: false });
    }

    return NextResponse.json({
      hasRequest: true,
      request: {
        id: lastRequest.id,
        clubName: lastRequest.clubName,
        status: lastRequest.status,
        createdAt: lastRequest.createdAt,
        expiresAt: lastRequest.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching club request:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
