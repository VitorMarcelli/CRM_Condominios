'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredConversations = conversations.filter((c) =>
    (c.resident?.fullName && c.resident.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.externalReference && c.externalReference.includes(searchTerm))
  );

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'open': 
        return <span className="flex items-center text-[13px] font-bold text-emerald-600 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />Aberta</span>;
      case 'pending': 
        return <span className="flex items-center text-[13px] font-bold text-amber-600 dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />Pendente</span>;
      case 'closed': 
        return <span className="flex items-center text-[13px] font-bold text-slate-500 dark:text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />Fechada</span>;
      default: 
        return <span className="flex items-center text-[13px] font-bold text-blue-600 dark:text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />{status}</span>;
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto font-sans p-6">
      
      {/* HEADER SECTION MATCHING THE IMAGE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Atendimentos</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
            />
          </div>
          
          {/* FILTER DROPDOWNS */}
          <select className="h-10 px-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none cursor-pointer hidden sm:block min-w-[100px]">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select className="h-10 px-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none cursor-pointer hidden sm:block min-w-[100px]">
            <option value="all">Todos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
      </div>

      {/* TABLE SECTION MATCHING THE IMAGE */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">ID Atendimento</th>
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">Morador / Contato</th>
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">Canal</th>
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">Referência</th>
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">Status</th>
              <th className="py-5 px-6 font-bold text-[13px] text-slate-900 dark:text-white">Última Interação</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-white rounded-full animate-spin" />
                </td>
              </tr>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <tr 
                  key={conv.id} 
                  onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                  className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  
                  {/* ID */}
                  <td className="py-4 px-6">
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">#{conv.id.substring(0, 5).toUpperCase()}</span>
                  </td>

                  {/* CUSTOMER NAME (WITH AVATAR) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold dark:bg-white/10 dark:text-white">
                          {conv.resident?.fullName ? conv.resident.fullName.substring(0, 2).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">
                        {conv.resident?.fullName || 'Desconhecido'}
                      </span>
                    </div>
                  </td>

                  {/* CHANNEL (PAYMENT IN IMAGE) */}
                  <td className="py-4 px-6">
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 capitalize">{conv.channel || 'Online'}</span>
                  </td>

                  {/* REFERENCE (LOCATION IN IMAGE) */}
                  <td className="py-4 px-6">
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{conv.externalReference || 'Sem referência'}</span>
                  </td>

                  {/* STATUS */}
                  <td className="py-4 px-6">
                    {getStatusDisplay(conv.status)}
                  </td>

                  {/* CONTACT / LAST INTERACTION */}
                  <td className="py-4 px-6">
                    <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                      {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                    </span>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <p className="text-[13px] font-medium text-slate-500">Nenhum atendimento encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
