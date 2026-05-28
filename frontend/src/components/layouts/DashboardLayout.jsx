import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, X, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const roleColors = {
  employee: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  manager: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  admin: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
};

function DashboardLayout({ navItems = [] }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <div className="flex min-h-screen">
        {/* mobile overlay */}
        <div
          className={cn(
            'fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity md:hidden',
            isMobileOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col bg-slate-900 text-white transition-transform duration-300 md:translate-x-0',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* logo section */}
          <div className="flex items-center justify-between bg-slate-950 border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                P
              </span>
              <span className="text-base font-bold text-white tracking-tight">
                Performix
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden transition"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* nav */}
          <nav className="flex-1 space-y-1 px-3 py-5">
            {navItems.map((navItem) => {
              const Icon = navItem.icon;
              return (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )
                  }
                >
                  <Icon className="size-4" />
                  <span>{navItem.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* user section */}
          <div className="bg-slate-950 border-t border-slate-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {user?.name}
                </div>
                <span
                  className={cn(
                    'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    roleColors[user?.role] || roleColors.employee
                  )}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-all"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* main area */}
        <div className="flex min-h-screen flex-1 flex-col md:pl-[260px]">
          {/* header */}
          <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-gray-700 shadow-sm md:hidden hover:bg-slate-50 transition"
                  onClick={() => setIsMobileOpen(true)}
                >
                  <Menu className="size-5" />
                </button>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Align. Track. Achieve.
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-slate-900">
                    Welcome back, {user?.name?.split(' ')[0]}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <Bell className="size-5" />
                  <span className="absolute top-1.5 right-1.5 flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                  </span>
                </button>
                <div className="hidden sm:flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-slate-50 text-gray-900 overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
