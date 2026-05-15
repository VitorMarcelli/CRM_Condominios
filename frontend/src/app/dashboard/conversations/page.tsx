'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Search, MessageSquare, Clock, ChevronRight, Inbox, Filter, Hash, Smartphone, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
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
  open: {
    label: 'Aberta',
    dotClass: 'bg-emerald-500',
    glowClass: 'shadow-[0_0_6px_rgba(16,185,129,0.5)]',
  },
  pending: {
    label: 'Pendente',
    dotClass: 'bg-amber-500',
    glowClass: 'shadow-[0_0_6px_rgba(245,158,11,0.5)]',
  },
  closed: {
    label: 'Fechada',
    dotClass: 'bg-slate-400 dark:bg-slate-600',
    glowClass: '',
  },
};

const channelIcon: Record<string, React.ReactNode> = {
  whatsapp: <Smartphone className="w-3 h-3" />,
  telegram: <Hash className="w-3 h-3" />,
};

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
        const res = await api.get('/conversations', { params });
        setConversations(res.data?.data || res.data || []);
      } catch (error) {
        toast.error('Erro ao carregar conversas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

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
    'bg-blue-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
    'bg-orange-600 text-white',
  ];

  const getAvatarColor = (id: string) => {
    const idx = id.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1400px] mx-auto font-sans">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Atendimentos</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {conversations.length} conversa{conversations.length !== 1 ? 's' : ''} registrada{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* SEARCH */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Buscar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            />
          </div>

          {/* STATUS FILTER */}
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-11 pl-9 pr-8 bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="open">Abertas</option>
              <option value="pending">Pendentes</option>
              <option value="closed">Fechadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONVERSATIONS LIST */}
      <div
        ref={listRef}
        className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-white/5 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-400">Carregando conversas...</span>
            </div>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
            {filteredConversations.map((conv, i) => {
              const status = statusConfig[conv.status] || statusConfig.open;
              const initials = getInitials(conv.resident?.fullName);
              const avatarColor = getAvatarColor(conv.id);
              const hasUnread = conv.status === 'open' || conv.status === 'pending';

              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                  className="group flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-all duration-200"
                  style={{
                    animation: `fadeSlideIn 0.4s ease-out ${i * 0.05}s both`,
                  }}
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-[#0d0d0d] shadow-md">
                      <AvatarFallback className={`${avatarColor} text-sm font-black`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* STATUS DOT */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${status.dotClass} ${status.glowClass} ring-2 ring-white dark:ring-[#0d0d0d]`} />
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className={`text-sm font-bold truncate ${hasUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {conv.resident?.fullName || 'Contato Desconhecido'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 tabular-nums">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* CHANNEL TAG */}
                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                          {channelIcon[conv.channel] || <Hash className="w-3 h-3" />}
                          {conv.channel || 'web'}
                        </span>
                        {/* LAST MESSAGE PREVIEW */}
                        <span className="text-xs text-slate-500 dark:text-slate-500 truncate">
                          {conv.externalReference || `#${conv.id.substring(0, 6).toUpperCase()}`}
                        </span>
                      </div>

                      {/* ASSIGNEE BADGE + STATUS BADGE + ARROW */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* ASSIGNEE BADGE */}
                        {conv.isAiActive ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 text-[10px] font-bold uppercase tracking-wider">
                            <Bot className="w-3 h-3" />
                            Agente IA
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            <User className="w-3 h-3" />
                            {conv.assignedTo?.fullName ? conv.assignedTo.fullName.split(' ')[0] : 'Humano'}
                          </span>
                        )}

                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          conv.status === 'open' ? 'text-emerald-600 dark:text-emerald-400' :
                          conv.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {status.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-900 dark:text-white">Nenhum atendimento</p>
              <p className="text-xs text-slate-400 mt-1">Os atendimentos aparecerão aqui quando iniciados.</p>
            </div>
          </div>
        )}
      </div>

      {/* STAGGER ANIMATION KEYFRAMES */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
