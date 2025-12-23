import type { NextAuthOptions } from 'next-auth';
import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from 'next-auth/adapters';
import EmailProvider from 'next-auth/providers/email';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Custom Drizzle Adapter for NextAuth
 * Compatible with next-auth@4.x without @auth/drizzle-adapter
 */
function CustomDrizzleAdapter(): Adapter {
  return {
    async createUser(data) {
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

    async getUser(id) {
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

    async getUserByEmail(email) {
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

    async getUserByAccount({ providerAccountId, provider }) {
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

    async updateUser(data) {
      if (!data.id) throw new Error('User ID is required');
      
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

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, userId));
    },

    async linkAccount(data) {
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
        session_state: data.session_state,
      });
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider)
          )
        );
    },

    async createSession(data) {
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

    async getSessionAndUser(sessionToken) {
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

    async updateSession(data) {
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

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async createVerificationToken(data) {
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

    async useVerificationToken({ identifier, token }) {
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

export const authOptions: NextAuthOptions = {
  adapter: CustomDrizzleAdapter(),
  
  providers: [
    // Magic Link Email Provider
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'TennisMatchFinder <noreply@tennismatchfinder.net>',
    }),
  ],

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true',
    error: '/login?error=true',
    newUser: '/onboarding',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
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
      console.log('New user created:', user.email);
      // TODO: Send welcome email, create default player profile, etc.
    },

    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log('New user signed in:', user.email);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
