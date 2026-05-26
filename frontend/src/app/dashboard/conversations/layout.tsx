'use client';

import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Search, MessageSquare, Filter, Hash, Smartphone, Bot, User, Inbox } from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function formatRelativeTime(date: string | null) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMin = differenceInMinutes(now, d);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ontem';
  return format(d, 'dd/MM', { locale: ptBR });
}

const statusConfig: Record<string, { label: string; dotClass: string; glowClass: string }> = {
  open: { label: 'Aberta', dotClass: 'bg-emerald-500', glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.5)]' },
  pending: { label: 'Pendente', dotClass: 'bg-amber-500', glowClass: 'shadow-[0_0_6px_rgba(245,158,11,0.5)]' },
  closed: { label: 'Fechada', dotClass: 'bg-slate-400 dark:bg-slate-600', glowClass: '' },
};

const channelIcon: Record<string, React.ReactNode> = {
  whatsapp: <Smartphone className="w-3 h-3" />,
  telegram: <Hash className="w-3 h-3" />,
};

interface ConversationsContextProps {
  refreshConversations: () => void;
}

const ConversationsContext = createContext<ConversationsContextProps | undefined>(undefined);

export function useConversationsContext() {
  const context = useContext(ConversationsContext);
  if (!context) return { refreshConversations: () => {} };
  return context;
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchConversations = useCallback(async () => {
    try {
      const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
      const res = await api.get('/conversations', { params });
      setConversations(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) => {
    const matchSearch =
      (c.resident?.fullName && c.resident.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.externalReference && c.externalReference.includes(searchTerm));
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const avatarColors = [
    'bg-blue-600 text-white', 'bg-emerald-600 text-white', 'bg-amber-600 text-white',
    'bg-rose-600 text-white', 'bg-cyan-600 text-white', 'bg-orange-600 text-white',
  ];

  const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];
  const isDetailPage = pathname !== '/dashboard/conversations';
  const contextValue = useMemo(() => ({ refreshConversations: fetchConversations }), [fetchConversations]);

  return (
    <ConversationsContext.Provider value={contextValue}>
      <div className="flex h-[calc(100vh-8rem)] w-full gap-6 font-sans">
        
        {/* LEFT PANE: LIST */}
        <div 
          className={`
            ${isDetailPage ? 'hidden lg:flex' : 'flex'}
            flex-col w-full lg:w-[400px] shrink-0
            bg-white dark:bg-[#0d0d0d] 
            rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)] 
            border border-slate-100 dark:border-white/5 
            overflow-hidden
          `}
        >
          {/* HEADER */}
          <div className="shrink-0 p-5 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Atendimentos</h1>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
              </div>

              <div className="relative w-full">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="open">Abertas</option>
                  <option value="pending">Pendentes</option>
                  <option value="closed">Fechadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                {filteredConversations.map((conv, i) => {
                  const status = statusConfig[conv.status] || statusConfig.open;
                  const initials = getInitials(conv.resident?.fullName);
                  const avatarColor = getAvatarColor(conv.id);
                  const hasUnread = conv.status === 'open' || conv.status === 'pending';
                  const isActive = pathname.includes(conv.id);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                      className={`group flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                      }`}
                      style={{ animation: `fadeSlideIn 0.3s ease-out ${i * 0.03}s both` }}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-[#0d0d0d] shadow-sm">
                          <AvatarFallback className={`${avatarColor} text-xs font-black`}>{initials}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.dotClass} ${status.glowClass} ring-2 ring-white dark:ring-[#0d0d0d]`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[13px] font-bold truncate ${hasUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {conv.resident?.fullName || 'Contato Desconhecido'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0 tabular-nums">
                            {formatRelativeTime(conv.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {channelIcon[conv.channel] || <Hash className="w-3 h-3" />}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-500 truncate">
                              {conv.externalReference || `#${conv.id.substring(0, 6).toUpperCase()}`}
                            </span>
                          </div>
                          <div className="flex items-center shrink-0 gap-2">
                            {conv.unreadCount > 0 && (
                              <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                                {conv.unreadCount}
                              </div>
                            )}
                            {conv.isAiActive ? <Bot className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-slate-400" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900 dark:text-white">Nenhum atendimento</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: CHAT */}
        <div 
          className={`
            ${isDetailPage ? 'flex' : 'hidden lg:flex'}
            flex-1 min-w-0 
            bg-white dark:bg-[#0d0d0d] 
            rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)] 
            border border-slate-100 dark:border-white/5 
            overflow-hidden
          `}
        >
          {children}
        </div>

      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ConversationsContext.Provider>
  );
}
