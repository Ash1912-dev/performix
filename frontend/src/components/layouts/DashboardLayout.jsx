import { useState } from'react';
import { NavLink, Outlet } from'react-router-dom';
import { LogOut, Menu, X } from'lucide-react';

import { Button } from'@/components/ui/button';
import { Badge } from'@/components/ui/badge';
import { cn } from'@/lib/utils';
import { useAuthStore } from'@/store/authStore';

function DashboardLayout({ navItems = [] }) {
 const [isMobileOpen, setIsMobileOpen] = useState(false);
 const { user, logout } = useAuthStore();

 return (
 <div className="min-h-screen bg-slate-100 text-gray-900">
 <div className="flex min-h-screen">
 <div
 className={cn(
'fixed inset-0 z-30 bg-slate-950/45 transition md:hidden',
 isMobileOpen ?'pointer-events-auto opacity-100' :'pointer-events-none opacity-0'
)}
 onClick={() => setIsMobileOpen(false)}
 />

 <aside
 className={cn(
'fixed left-0 top-0 z-40 flex h-full w-[var(--sidebar-width)] flex-col bg-slate-800 text-white transition-transform md:translate-x-0',
 isMobileOpen ?'translate-x-0' :'-translate-x-full'
)}
 >
 <div className="flex items-center justify-between border-b border-slate-700 px-6 py-5">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
 Performix
 </div>
 <div className="mt-1 text-lg font-bold text-white">Performance Portal</div>
 </div>
 <button
 type="button"
 className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
 onClick={() => setIsMobileOpen(false)}
 >
 <X className="size-5" />
 </button>
 </div>

 <nav className="flex-1 space-y-2 px-4 py-6">
 {navItems.map((item) => {
 const Icon = item.icon;

 return (
 <NavLink
 key={item.to}
 to={item.to}
 onClick={() => setIsMobileOpen(false)}
 className={({ isActive }) =>
 cn(
'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
 isActive
 ?'text-white bg-slate-700 shadow-lg shadow-slate-900/20'
 :'text-slate-200 hover:text-white hover:bg-slate-700'
)
 }
 >
 <Icon className="size-4" />
 <span>{item.label}</span>
 </NavLink>
);
 })}
 </nav>

 <div className="border-t border-slate-700 px-4 py-5">
 <div className="rounded-2xl bg-slate-800/90 p-4">
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
 <div className="truncate text-xs text-slate-400">{user?.email}</div>
 <div className="mt-2">
 <Badge variant={user?.role}>{user?.role}</Badge>
 </div>
 </div>
 <div className="mt-4 border-t border-slate-700/50 pt-3">
 <Button
 type="button"
 variant="ghost"
 className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white"
 onClick={logout}
 >
 <LogOut className="mr-2 size-4" />
 Logout
 </Button>
 </div>
 </div>
 </div>
 </aside>

 <div className="flex min-h-screen flex-1 flex-col md:pl-[var(--sidebar-width)]">
 <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
 <div className="flex items-center justify-between px-4 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <button
 type="button"
 className="rounded-xl border border-slate-200 bg-white p-2 text-gray-700 shadow-sm md:hidden"
 onClick={() => setIsMobileOpen(true)}
 >
 <Menu className="size-5" />
 </button>
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
 Align. Track. Achieve.
 </div>
 <div className="mt-1 text-lg font-bold text-gray-900">
 Welcome back, {user?.name?.split(' ')[0]}
 </div>
 </div>
 </div>
 </div>
 </header>

 <main className="flex-1 bg-gray-50 text-gray-900 overflow-auto p-4 sm:p-6">
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
