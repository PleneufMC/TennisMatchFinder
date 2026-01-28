'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Swords,
  Users,
  MessageSquare,
  MessageCircle,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Award,
  Zap,
  Medal,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/match-now', label: 'Match Now', icon: Zap },
  { href: '/box-leagues', label: 'Box Leagues', icon: Medal },
  { href: '/tournaments', label: 'Tournois', icon: Crown },
  { href: '/classement', label: 'Classement', icon: Trophy },
  { href: '/matchs', label: 'Mes matchs', icon: Swords },
  { href: '/suggestions', label: 'Trouver un adversaire', icon: Users },
  { href: '/achievements', label: 'Achievements', icon: Award },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/profil', label: 'Mon profil', icon: User },
];

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Administration', icon: Settings },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/images/logo.png"
              alt="TMF Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-bold text-green-600">TMF</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Image
              src="/images/logo.png"
              alt="TMF Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', collapsed && 'hidden md:flex')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Section Admin */}
        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            {adminNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            TennisMatchFinder v1.4
          </p>
        </div>
      )}
    </aside>
  );
}
