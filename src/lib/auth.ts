import type { NextAuthOptions } from 'next-auth';
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens, players, clubs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Only log in development mode to avoid leaking sensitive data in production
const isDev = process.env.NODE_ENV === 'development';
const debugLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

/**
 * Custom Drizzle Adapter for NextAuth
 * Compatible with next-auth@4.x without @auth/drizzle-adapter
 */
function CustomDrizzleAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const result = await db.insert(users).values({
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
      }).returning();
      
      const user = result[0];
      if (!user) throw new Error('Failed to create user');
      
      return {
        id: user.id,
        email: user.email!,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const user = result[0];
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email!,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0];
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email!,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      };
    },

    async getUserByAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>): Promise<AdapterUser | null> {
      const result = await db
        .select({ user: users })
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider)
          )
        )
        .limit(1);
      
      const row = result[0];
      if (!row) return null;
      
      return {
        id: row.user.id,
        email: row.user.email!,
        name: row.user.name,
        image: row.user.image,
        emailVerified: row.user.emailVerified,
      };
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
      const result = await db
        .update(users)
        .set({
          name: data.name,
          email: data.email,
          image: data.image,
          emailVerified: data.emailVerified,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.id))
        .returning();
      
      const user = result[0];
      if (!user) throw new Error('Failed to update user');
      
      return {
        id: user.id,
        email: user.email!,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      };
    },

    async deleteUser(userId: string): Promise<void> {
      await db.delete(users).where(eq(users.id, userId));
    },

    async linkAccount(data: AdapterAccount): Promise<void> {
      await db.insert(accounts).values({
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state as string | undefined,
      });
    },

    async unlinkAccount({ providerAccountId, provider }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>): Promise<void> {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider)
          )
        );
    },

    async createSession(data: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      const result = await db.insert(sessions).values({
        userId: data.userId,
        sessionToken: data.sessionToken,
        expires: data.expires,
      }).returning();
      
      const session = result[0];
      if (!session) throw new Error('Failed to create session');
      
      return {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      };
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);
      
      const row = result[0];
      if (!row) return null;
      
      return {
        session: {
          userId: row.session.userId,
          sessionToken: row.session.sessionToken,
          expires: row.session.expires,
        },
        user: {
          id: row.user.id,
          email: row.user.email!,
          name: row.user.name,
          image: row.user.image,
          emailVerified: row.user.emailVerified,
        },
      };
    },

    async updateSession(data: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null> {
      const result = await db
        .update(sessions)
        .set({
          expires: data.expires,
        })
        .where(eq(sessions.sessionToken, data.sessionToken))
        .returning();
      
      const session = result[0];
      if (!session) return null;
      
      return {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async createVerificationToken(data: VerificationToken): Promise<VerificationToken> {
      const result = await db.insert(verificationTokens).values({
        identifier: data.identifier,
        token: data.token,
        expires: data.expires,
      }).returning();
      
      const token = result[0];
      if (!token) throw new Error('Failed to create verification token');
      
      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      const result = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )
        .limit(1);
      
      const verificationToken = result[0];
      if (!verificationToken) return null;
      
      // Delete the token after use
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        );
      
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },
  };
}

// Check if email configuration is valid (not placeholder values)
const isEmailConfigValid = () => {
  const host = process.env.EMAIL_SERVER_HOST || '';
  const password = process.env.EMAIL_SERVER_PASSWORD || '';
  // Check for placeholder values
  if (host.includes('(') || host.includes('votre') || host.includes('your')) return false;
  if (password.includes('(') || password.includes('votre') || password.includes('your')) return false;
  if (!host || !password) return false;
  return true;
};

export const authOptions: NextAuthOptions = {
  adapter: CustomDrizzleAdapter(),
  
  providers: [
    // Passkey Provider (WebAuthn)
    CredentialsProvider({
      id: 'passkey',
      name: 'Passkey',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        // This is called after WebAuthn verification succeeds
        // The actual authentication happens in /api/auth/passkey/authenticate
        if (!credentials?.userId || !credentials?.email) {
          return null;
        }

        // Verify user exists
        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, credentials.userId))
          .limit(1);

        const user = result[0];
        if (!user || user.email !== credentials.email) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    // Magic Link Email Provider
    EmailProvider({
      server: isEmailConfigValid() ? {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      } : {
        // Fallback to prevent crash - emails won't be sent but auth won't crash
        host: 'localhost',
        port: 25,
        auth: {
          user: '',
          pass: '',
        },
      },
      from: process.env.EMAIL_FROM || 'TennisMatchFinder <noreply@tennismatchfinder.net>',
      // Custom sendVerificationRequest to handle invalid email config gracefully
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!isEmailConfigValid()) {
          console.error('⚠️ Email configuration is invalid. Magic link cannot be sent.');
          console.log('📧 Magic link URL (for development):', url);
          // In development/misconfigured env, we log the URL but don't crash
          throw new Error('Email non configuré. Contactez l\'administrateur.');
        }
        
        // Extraire les paramètres de l'URL NextAuth
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const callbackUrl = urlObj.searchParams.get('callbackUrl') || '/dashboard';
        
        // Créer l'URL intermédiaire qui gère les WebViews
        const baseUrl = process.env.NEXTAUTH_URL || 'https://tennismatchfinder.net';
        const magicLinkUrl = `${baseUrl}/magic-link?token=${token}&email=${encodeURIComponent(identifier)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        
        // Use default email sending
        const { createTransport } = await import('nodemailer');
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: 'Connexion à TennisMatchFinder',
          text: `Cliquez sur ce lien pour vous connecter : ${magicLinkUrl}\n\nSi le lien ne fonctionne pas, copiez-le et collez-le dans Safari ou Chrome.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">🎾 TennisMatchFinder</h2>
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
              <a href="${magicLinkUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Se connecter
              </a>
              <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
              <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 11px;">
                <strong>Le bouton ne fonctionne pas ?</strong><br>
                Copiez ce lien et collez-le dans Safari ou Chrome :<br>
                <span style="word-break: break-all; color: #666;">${magicLinkUrl}</span>
              </p>
            </div>
          `,
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email non envoyé à ${failed.join(', ')}`);
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Let NextAuth handle cookies automatically
  // The cookie name will be determined by the NEXTAUTH_URL protocol (http vs https)

  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true',
    error: '/login?error=true',
    newUser: '/onboarding',
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      debugLog('[Auth JWT] Trigger:', trigger, 'User:', user?.id);
      
      // Add user id to JWT token on first sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      // Ensure token always has id from sub (NextAuth standard)
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      
      return token;
    },

    async session({ session, token }) {
      const startTime = Date.now();
      debugLog('[Auth Session] START');
      
      // Add user id from JWT to session
      if (session.user && token) {
        // Get user ID from token (try multiple sources)
        const userId = (token.id || token.sub) as string;
        
        if (!userId) {
          console.error('[Auth Session] ERROR - No user ID in token');
          return session;
        }
        
        session.user.id = userId;
        
        // Fetch player data from database
        try {
          const playerResult = await db
            .select({
              id: players.id,
              fullName: players.fullName,
              avatarUrl: players.avatarUrl,
              currentElo: players.currentElo,
              clubId: players.clubId,
              city: players.city,
              isAdmin: players.isAdmin,
              isVerified: players.isVerified,
            })
            .from(players)
            .where(eq(players.id, userId))
            .limit(1);
          
          if (playerResult[0]) {
            const player = playerResult[0];
            debugLog('[Auth Session] Player found:', player.fullName);
            
            // Fetch club info only if player has a club
            let club: { name: string; slug: string } | undefined;
            if (player.clubId) {
              const clubResult = await db
                .select({
                  name: clubs.name,
                  slug: clubs.slug,
                })
                .from(clubs)
                .where(eq(clubs.id, player.clubId))
                .limit(1);
              club = clubResult[0];
            }
            
            const playerData = {
              id: player.id,
              fullName: player.fullName,
              avatarUrl: player.avatarUrl,
              currentElo: player.currentElo,
              clubId: player.clubId,
              city: player.city,
              clubName: club?.name || '',
              clubSlug: club?.slug || '',
              isAdmin: player.isAdmin,
              isVerified: player.isVerified,
            };
            
            session.user.player = playerData;
          } else {
            debugLog('[Auth Session] No player found for user');
            // Set empty player to differentiate from "loading" state
            session.user.player = null;
          }
        } catch (error) {
          console.error('[Auth Session] ERROR - DB fetch failed:', error);
          // Don't crash, just log
          session.user.player = null;
        }
      }
      
      debugLog('[Auth Session] END - Duration:', Date.now() - startTime, 'ms');
      return session;
    },

    async signIn() {
      // Allow sign in
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  events: {
    async createUser({ user }) {
      debugLog('New user created:', user.email);
      // Note: L'email de bienvenue est envoyé lors de l'approbation de la demande d'adhésion
      // car les utilisateurs sont créés dans le contexte d'un club spécifique
    },

    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        debugLog('New user signed in:', user.email);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
