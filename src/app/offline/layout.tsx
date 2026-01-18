import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hors connexion | TennisMatchFinder',
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
