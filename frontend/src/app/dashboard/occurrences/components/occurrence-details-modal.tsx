'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, User, AlignLeft, AlertTriangle, MessageSquare, ShieldAlert, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OccurrenceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrenceId: string | null;
  onUpdated?: () => void;
}

export function OccurrenceDetailsModal({ isOpen, onClose, occurrenceId, onUpdated }: OccurrenceDetailsModalProps) {
  const [occurrence, setOccurrence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && occurrenceId) {
      fetchDetails();
      fetchUsers();
    } else {
      setOccurrence(null);
    }
  }, [isOpen, occurrenceId]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/internal-users');
      setUsersList(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/occurrences/${occurrenceId}`);
      setOccurrence(res.data.data || res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'critical': return <Badge className="bg-red-500 text-white hover:bg-red-600 border-none px-3 py-1 font-bold rounded-xl shadow-lg shadow-red-500/20">Crítica</Badge>;
      case 'high': return <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-none px-3 py-1 font-bold rounded-xl shadow-lg shadow-orange-500/20">Alta</Badge>;
      case 'medium': return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-none px-3 py-1 font-bold rounded-xl shadow-lg shadow-blue-500/20">Média</Badge>;
      default: return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none px-3 py-1 font-bold rounded-xl">Baixa</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <span className="flex items-center gap-1.5 text-xs font-bold text-orange-500"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> ABERTA</span>;
      case 'in_progress': return <span className="flex items-center gap-1.5 text-xs font-bold text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> EM ANDAMENTO</span>;
      case 'resolved': return <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> RESOLVIDA</span>;
      case 'closed': return <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300" /> FECHADA</span>;
      default: return <span className="text-xs font-bold text-slate-500 uppercase">{status}</span>;
    }
  };

  const translateAction = (action: string) => {
    switch (action) {
      case 'CREATED': return 'CRIADO';
      case 'UPDATED': return 'ATUALIZADO';
      case 'STATUS_CHANGE': return 'MUDANÇA DE STATUS';
      case 'PRIORITY_CHANGE': return 'MUDANÇA DE PRIORIDADE';
      case 'ASSIGNED': return 'ATRIBUÍDO';
      case 'NOTE': return 'COMENTÁRIO';
      default: return action;
    }
  };

  const handleResolve = async () => {
    if (!occurrence?.assignedUser && !occurrence?.assignedUserId) {
      alert('⚠️ Atenção: Não é possível resolver uma ocorrência sem um responsável atribuído. Por favor, atribua a ocorrência a alguém primeiro.');
      return;
    }

    try {
      setIsUpdating(true);
      await api.patch(`/occurrences/${occurrenceId}/status`, { status: 'resolved' });
      await fetchDetails();
      if (onUpdated) onUpdated();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao resolver ocorrência');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      setIsUpdating(true);
      await api.patch(`/occurrences/${occurrenceId}/assign`, { assignedUserId: userId });

      // Auto-acknowledge pending alerts
      if (occurrence?.alerts?.length > 0 && userId) {
        for (const alert of occurrence.alerts) {
          if (alert.status === 'triggered' || alert.status === 'pending') {
             try {
               await api.post(`/alerts/${alert.id}/acknowledge`);
             } catch (e) {
               console.error('Failed to auto-acknowledge alert:', e);
             }
          }
        }
      }

      await fetchDetails();
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta ocorrência permanentemente?')) return;
    try {
      setIsUpdating(true);
      await api.delete(`/occurrences/${occurrenceId}`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir ocorrência');
    } finally {
      setIsUpdating(false);
    }
  };

  const canEdit = true; // In a real app we check useAuthStore() role

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-2xl p-0 bg-white dark:bg-[#111111] overflow-hidden max-h-[90vh] flex flex-col">
        {isLoading || !occurrence ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-6">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Carregando detalhes...</p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {getPriorityBadge(occurrence.priority)}
                  <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                    {getStatusBadge(occurrence.status)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-2 md:gap-4 flex-wrap justify-end">
                  {format(new Date(occurrence.openedAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  
                  {occurrence.status !== 'resolved' && occurrence.status !== 'closed' && canEdit && (
                    <button 
                      onClick={handleResolve}
                      disabled={isUpdating}
                      className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20 flex items-center"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Resolver Ocorrência
                    </button>
                  )}

                  {(occurrence.status === 'resolved' || occurrence.status === 'closed') && canEdit && (
                    <button 
                      onClick={handleDelete}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-lg transition-colors border border-red-200 dark:border-red-500/20 flex items-center"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                      Excluir
                    </button>
                  )}
                </div>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight pr-8">
                {occurrence.title}
              </DialogTitle>
              {occurrence.category && (
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  {occurrence.category.name}
                </div>
              )}
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {/* DESCRIPTION SECTION */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <AlignLeft className="w-4 h-4 text-blue-500" /> Descrição
                </h4>
                <div className="p-5 bg-slate-50 dark:bg-[#151515] rounded-2xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {occurrence.description || <span className="italic text-slate-400">Nenhuma descrição fornecida.</span>}
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-[#151515] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Morador / Solicitante</div>
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    {occurrence.resident ? occurrence.resident.fullName : 'Não informado'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-[#151515] rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atribuído a</div>
                  {canEdit && occurrence.status !== 'closed' && occurrence.status !== 'resolved' ? (
                    <select
                      className="w-full h-10 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl px-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      value={occurrence.assignedUserId || ''}
                      onChange={(e) => handleAssign(e.target.value)}
                      disabled={isUpdating}
                    >
                      <option value="" className="text-slate-400">Não atribuído</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      {occurrence.assignedUser ? occurrence.assignedUser.fullName : <span className="text-slate-400 italic">Não atribuído</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* TIMELINE SECTION */}
              {occurrence.timeline && occurrence.timeline.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">
                    <Clock className="w-4 h-4 text-blue-500" /> Linha do Tempo
                  </h4>
                  
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                    {occurrence.timeline.map((event: any, idx: number) => (
                      <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* ICON */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-[#111111] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        {/* CONTENT */}
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-slate-50 dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{translateAction(event.action)}</span>
                            <span className="text-xs font-semibold text-slate-400">{format(new Date(event.createdAt), "dd MMM, HH:mm", { locale: ptBR })}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {event.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
