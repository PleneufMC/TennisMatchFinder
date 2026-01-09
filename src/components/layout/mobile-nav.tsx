'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Trophy, Swords, Users, MessageSquare, MessageCircle, User, LayoutDashboard, Award, Zap, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/match-now', label: 'Match Now', icon: Zap },
  { href: '/box-leagues', label: 'Box Leagues', icon: Medal },
  { href: '/tournaments', label: 'Tournois', icon: Crown },
  { href: '/classement', label: 'Classement', icon: Trophy },
  { href: '/matchs', label: 'Mes matchs', icon: Swords },
  { href: '/suggestions', label: 'Trouver un adversaire', icon: Users },
  { href: '/achievements', label: 'Achievements', icon: Award },
  { href: '/chat', label: 'Messages', icon: MessageCircle },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/profil', label: 'Mon profil', icon: User },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Fermer le menu quand on change de page
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <div 
        className="fixed inset-y-0 left-0 z-[101] w-72 bg-card shadow-lg md:hidden transform transition-transform duration-300 ease-in-out"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎾</span>
            <span className="font-bold">TennisMatchFinder</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-manipulation',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted'
                )}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
