'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { 
  Building2, 
  LayoutDashboard, 
  MessageSquare, 
  AlertTriangle, 
  Users, 
  Building, 
  LogOut,
  Bell,
  Siren,
  Users2,
  ShieldCheck,
  Briefcase,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, permKey: 'dashboard' },
  { name: 'Ocorrências', href: '/dashboard/occurrences', icon: AlertTriangle, permKey: 'occurrences' },
  { name: 'Atendimento', href: '/dashboard/conversations', icon: MessageSquare, permKey: 'conversations' },
  { name: 'Alertas', href: '/dashboard/alerts', icon: Bell, permKey: 'alerts' },
  { name: 'Moradores', href: '/dashboard/residents', icon: Users, permKey: 'residents' },
  { name: 'Condomínios', href: '/dashboard/condominiums', icon: Building, adminOnly: true, permKey: 'condominiums' },
  { name: 'Equipe', href: '/dashboard/staff', icon: Briefcase, adminOnly: true, permKey: 'staff' },
  { name: 'Cargos', href: '/dashboard/roles', icon: Crown, adminOnly: true, permKey: 'staff' },
  { name: 'Grupos', href: '/dashboard/dispatch-groups', icon: Users2, permKey: 'dispatch_groups' },
  { name: 'Regras', href: '/dashboard/escalation-rules', icon: Siren, permKey: 'escalation_rules' },
  { name: 'Auditoria', href: '/dashboard/audit-logs', icon: ShieldCheck, adminOnly: true, permKey: 'audit_logs' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const customRolePerms = user?.customRole?.permissions as Record<string, Record<string, boolean>> | undefined;
  const legacyPerms = (user?.permissions ?? {}) as Record<string, boolean>;

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (isAdmin) return true;
    if (item.permKey === 'dashboard') return true;
    // Check customRole permissions first (granular: module.view)
    if (customRolePerms && Object.keys(customRolePerms).length > 0) {
      const modPerms = customRolePerms[item.permKey];
      return modPerms?.view === true;
    }
    // Fallback to legacy flat permissions
    if (Object.keys(legacyPerms).length === 0) return true;
    return legacyPerms[item.permKey] !== false;
  });

  return (
    <>
      {/* Spacer to maintain layout integrity while sidebar floats */}
      <div className="w-20 shrink-0 hidden md:block bg-transparent" />

      {/* Floating Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[#111111] dark:bg-[#0a0a0a] transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] w-20 hover:w-72 group overflow-hidden border-r border-white/5 shadow-2xl">
        
        {/* Logo Section */}
        <div className="h-24 flex items-center px-5 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[14px] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-white/20 dark:bg-white/10 mix-blend-overlay" />
            <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="ml-4 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="font-black text-white tracking-tight text-lg leading-none">
              Condominium
            </span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="block outline-none">
                <div className={cn(
                  "flex items-center px-3 py-3.5 rounded-2xl transition-all duration-300 relative group/item",
                  isActive 
                    ? "bg-white text-[#111111] shadow-[0_4px_20px_-4px_rgba(255,255,255,0.4)]"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}>
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <item.icon 
                      className={cn(
                        "w-[22px] h-[22px] shrink-0 transition-transform duration-300 group-hover/item:scale-110", 
                        isActive ? "text-[#111111]" : ""
                      )} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                  </div>
                  <span className="ml-3 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap tracking-wide">
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 shrink-0 mt-auto border-t border-white/5 bg-[#111111] dark:bg-[#0a0a0a]">
          <div className="flex items-center px-2 py-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <Avatar className="h-10 w-10 border-2 border-slate-800 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.fullName || 'Usuário'}
              </p>
              <p className="text-xs font-medium text-slate-500 truncate">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="w-full flex items-center px-3 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group/btn"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <LogOut className="w-[20px] h-[20px]" strokeWidth={2.5} />
            </div>
            <span className="ml-3 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap tracking-wide">
              Sair da conta
            </span>
          </button>
        </div>

      </aside>
    </>
  );
}
