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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ocorrências', href: '/dashboard/occurrences', icon: AlertTriangle },
  { name: 'Atendimento (WhatsApp)', href: '/dashboard/conversations', icon: MessageSquare },
  { name: 'Alertas', href: '/dashboard/alerts', icon: Bell },
  { name: 'Moradores', href: '/dashboard/residents', icon: Users },
  { name: 'Grupos de Acionamento', href: '/dashboard/dispatch-groups', icon: Users2 },
  { name: 'Regras de Escalonamento', href: '/dashboard/escalation-rules', icon: Siren },
  { name: 'Auditoria', href: '/dashboard/audit-logs', icon: ShieldCheck, adminOnly: true },
  { name: 'Condomínios', href: '/dashboard/condominiums', icon: Building, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 bg-slate-950">
        <Building2 className="w-6 h-6 text-blue-500 mr-3" />
        <span className="font-bold text-white tracking-tight">Condominium CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "hover:bg-slate-800 hover:text-white"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 bg-slate-950">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border border-slate-700">
            <AvatarFallback className="bg-slate-800 text-slate-300 font-medium">
              {user?.fullName.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </aside>
  );
}
