import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/toast';
import { CookieBanner } from '@/components/cookie-banner';
import { GoogleAnalyticsWithConsent } from '@/components/google-analytics';
import { MetaPixelWithConsent } from '@/components/meta-pixel';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TennisMatchFinder - Trouvez votre prochain adversaire',
    template: '%s | TennisMatchFinder',
  },
  description:
    'Plateforme de mise en relation pour joueurs de tennis avec système de classement ELO innovant. Trouvez des adversaires de votre niveau et progressez ensemble.',
  keywords: [
    'tennis',
    'match',
    'adversaire',
    'classement',
    'ELO',
    'club',
    'partenaire',
    'sport',
  ],
  authors: [{ name: 'TennisMatchFinder' }],
  creator: 'TennisMatchFinder',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://tennismatchfinder.net',
    siteName: 'TennisMatchFinder',
    title: 'TennisMatchFinder - Trouvez votre prochain adversaire',
    description:
      'Plateforme de mise en relation pour joueurs de tennis avec système de classement ELO innovant.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TennisMatchFinder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisMatchFinder',
    description:
      'Trouvez des adversaires de tennis de votre niveau avec notre système ELO innovant.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'zi3-Whhmgdt1ZvoCrPdpG9tyswpkoVqgB8llHX_v7xQ',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider>
              {children}
            </I18nProvider>
            <Toaster />
            <CookieBanner />
            {/* Google Analytics - conditionnel au consentement */}
            {gaId && (
              <Suspense fallback={null}>
                <GoogleAnalyticsWithConsent measurementId={gaId} />
              </Suspense>
            )}
            {/* Meta Pixel (Facebook) - conditionnel au consentement */}
            {metaPixelId && (
              <Suspense fallback={null}>
                <MetaPixelWithConsent pixelId={metaPixelId} />
              </Suspense>
            )}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
