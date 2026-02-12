'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  Calendar,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  Stethoscope,
  UserCog,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Profissionais', icon: Users },
  { href: '/admin/admins', label: 'Administradores', icon: UserCog },
  { href: '/admin/hospitals', label: 'Hospitais', icon: Building2 },
  { href: '/admin/groups', label: 'Grupos/Escalas', icon: Layers },
  { href: '/admin/shifts', label: 'Plantões', icon: Calendar },
  { href: '/admin/trades', label: 'Trocas', icon: ArrowLeftRight },
  { href: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
];

interface AdminSidebarProps {
  user: any;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-sky-500" />
          <span className="font-bold text-gray-900">Assistenza</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 mt-16"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0 mt-16 lg:mt-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-gray-100 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Assistenza</h1>
              <p className="text-xs text-gray-500">Painel Admin</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium',
                  isActive(item.href)
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Spacer for mobile */}
      <div className="lg:hidden h-16" />
    </>
  );
}
