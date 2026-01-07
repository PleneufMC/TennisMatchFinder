'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ClubBannerProps {
  bannerUrl?: string | null;
  clubName: string;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  children?: React.ReactNode;
}

const heightClasses = {
  sm: 'h-24',
  md: 'h-40',
  lg: 'h-56',
};

export function ClubBanner({
  bannerUrl,
  clubName,
  className,
  height = 'md',
  overlay = true,
  children,
}: ClubBannerProps) {
  // Image par défaut si pas de banner
  const defaultBanner = '/images/clubs/default-clay-court.jpg';
  const imageSrc = bannerUrl || defaultBanner;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl',
        heightClasses[height],
        className
      )}
    >
      {/* Image de fond */}
      {bannerUrl ? (
        <Image
          src={imageSrc}
          alt={`Terrain ${clubName}`}
          fill
          className="object-cover"
          priority
        />
      ) : (
        // Fallback gradient si pas d'image
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400" />
      )}

      {/* Overlay sombre pour lisibilité */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}

      {/* Contenu optionnel (titre, etc.) */}
      {children && (
        <div className="absolute inset-0 flex items-end p-4">
          {children}
        </div>
      )}

      {/* Pattern terre battue subtil (optionnel) */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * Banner avec titre du club intégré
 */
export function ClubBannerWithTitle({
  bannerUrl,
  clubName,
  clubDescription,
  memberCount,
}: {
  bannerUrl?: string | null;
  clubName: string;
  clubDescription?: string | null;
  memberCount?: number;
}) {
  return (
    <ClubBanner bannerUrl={bannerUrl} clubName={clubName} height="lg">
      <div className="text-white">
        <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
          {clubName}
        </h1>
        {clubDescription && (
          <p className="text-sm md:text-base text-white/90 mt-1 max-w-xl drop-shadow">
            {clubDescription}
          </p>
        )}
        {memberCount !== undefined && (
          <p className="text-sm text-white/80 mt-2">
            {memberCount} membre{memberCount !== 1 ? 's' : ''} actif{memberCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </ClubBanner>
  );
}
