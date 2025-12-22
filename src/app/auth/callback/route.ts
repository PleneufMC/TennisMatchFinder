import { createClient } from '@/lib/supabase/server';
import { createAdminClient, createPlayerProfile } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route de callback pour l'authentification Supabase
 * Gère la confirmation d'email et la création de profil
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard';
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    
    // Échanger le code contre une session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(`${origin}/login?error=session_error`);
    }

    if (session?.user) {
      // Vérifier si le profil joueur existe déjà
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!existingPlayer) {
        // Créer le profil joueur s'il n'existe pas
        try {
          const userMetadata = session.user.user_metadata;
          const fullName = userMetadata?.full_name || session.user.email?.split('@')[0] || 'Joueur';
          const clubSlug = userMetadata?.club_slug || 'mccc';
          const selfAssessedLevel = userMetadata?.self_assessed_level || 'intermédiaire';

          // Récupérer l'ID du club
          const adminClient = createAdminClient();
          const { data: club, error: clubError } = await adminClient
            .from('clubs')
            .select('id')
            .eq('slug', clubSlug)
            .single();

          if (clubError || !club) {
            console.error('Club not found:', clubSlug);
            // Utiliser le club par défaut
            const { data: defaultClub } = await adminClient
              .from('clubs')
              .select('id')
              .eq('slug', 'mccc')
              .single();

            if (!defaultClub) {
              return NextResponse.redirect(`${origin}/login?error=no_club`);
            }

            await createPlayerProfile(
              session.user.id,
              session.user.email!,
              fullName,
              defaultClub.id,
              { selfAssessedLevel }
            );
          } else {
            await createPlayerProfile(
              session.user.id,
              session.user.email!,
              fullName,
              club.id,
              { selfAssessedLevel }
            );
          }

          console.log('Player profile created for:', session.user.email);
        } catch (profileError) {
          console.error('Error creating player profile:', profileError);
          // Continuer quand même - l'utilisateur pourra compléter son profil plus tard
        }
      }
    }
  }

  // Rediriger vers la page demandée
  return NextResponse.redirect(`${origin}${redirect}`);
}
