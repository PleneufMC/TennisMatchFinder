import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

interface PlayerData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  clubId: string;
  clubName: string;
  clubSlug: string;
  isAdmin: boolean;
  isVerified: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      player?: PlayerData | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    player?: PlayerData | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    player?: PlayerData | null;
  }
}
