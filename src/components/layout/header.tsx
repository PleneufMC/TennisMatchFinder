'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import type { PlayerData } from '@/types/player';

interface HeaderProps {
  player: PlayerData;
  notificationCount?: number;
  onMenuClick?: () => void;
}

export function Header({ player, notificationCount = 0, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Déconnexion réussie');
      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 md:px-6">
      {/* Partie gauche */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Club :</span>
          <Badge variant="secondary">{player.clubName}</Badge>
        </div>
      </div>

      {/* Partie droite */}
      <div className="flex items-center gap-2">
        {/* Toggle thème */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Changer le thème</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Menu profil */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <PlayerAvatar
              src={player.avatarUrl}
              name={player.fullName}
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{player.fullName}</p>
              <p className="text-xs text-muted-foreground">{player.currentElo} ELO</p>
            </div>
          </Button>

          {/* Dropdown menu */}
          {isProfileOpen && (
            <>
              {/* Overlay pour fermer le menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-card shadow-lg">
                <div className="p-2">
                  {/* Info mobile */}
                  <div className="md:hidden px-2 py-1.5 mb-2 border-b">
                    <p className="font-medium">{player.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.currentElo} ELO • {player.clubName}
                    </p>
                  </div>

                  <Link
                    href="/profil"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>

                  <Link
                    href="/help"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Aide
                  </Link>

                  <div className="my-1 border-t" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
