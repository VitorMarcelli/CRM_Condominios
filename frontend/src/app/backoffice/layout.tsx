'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';

const SIDEBAR_ITEMS = [
  { name: 'Organizações', path: '/backoffice', icon: Building2 },
  { name: 'Configurações', path: '/backoffice/settings', icon: Settings },
];

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-50 flex selection:bg-teal-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 bg-[#0F172A] hidden md:flex flex-col relative z-20 shadow-2xl">
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-teal-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CRM<span className="text-teal-500">Master</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400 font-semibold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-8 bg-teal-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@crm'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-teal-900/20 to-transparent pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
