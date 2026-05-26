'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Clock, MessageSquareText, Save, Info, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, type Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25 } }
} as Variants;

export default function EditOccurrencePage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occurrence, setOccurrence] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assignedUserId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [occRes, usersRes] = await Promise.all([
          api.get(`/occurrences/${id}`),
          api.get('/internal-users')
        ]);
        
        setOccurrence(occRes.data);
        setUsersList(usersRes.data.data || usersRes.data || []);
        
        setFormData({
          status: occRes.data.status,
          priority: occRes.data.priority,
          assignedUserId: occRes.data.assignedUserId || 'none',
        });
      } catch (error) {
        toast.error('Erro ao carregar dados da ocorrência.');
        router.push('/dashboard/occurrences');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleSelectChange = (name: string, value: string | null) => {
    if (value !== null) setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      
      const payload: any = {
        status: formData.status,
        priority: formData.priority,
        assignedUserId: formData.assignedUserId === 'none' ? null : formData.assignedUserId,
      };

      if (payload.status === 'resolved' && !payload.assignedUserId) {
        toast.error('Não é possível resolver uma ocorrência sem um responsável atribuído.');
        setIsSubmitting(false);
        return;
      }

      await api.put(`/occurrences/${id}`, payload);

      // Auto-acknowledge pending alerts if assigned to someone
      if (payload.assignedUserId && occurrence?.alerts?.length > 0) {
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

      toast.success('Ocorrência atualizada com sucesso!');
      
      const res = await api.get(`/occurrences/${id}`);
      setOccurrence(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !occurrence) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Carregando detalhes...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12 w-full max-w-5xl mx-auto">
      
      {/* HEADER */}
      <motion.div variants={item} className="flex items-center gap-6 px-2">
        <Button 
          variant="outline" 
          size="icon" 
          asChild 
          className="rounded-2xl w-12 h-12 border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <Link href="/dashboard/occurrences">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Gerenciar Ocorrência</h1>
          <p className="text-slate-500 font-medium">#{occurrence.id.split('-')[0].toUpperCase()}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
        {/* ESQUERDA - DETALHES & EDIÇÃO */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={item} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            {/* Subtle decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-bl-[100%] pointer-events-none" />
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 relative z-10">{occurrence.title}</h2>
            
            <div className="space-y-8 relative z-10">
              
              {/* Descrição Box */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Relato Original
                </h3>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-6 rounded-2xl text-slate-700 dark:text-slate-300 text-base leading-relaxed border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  {occurrence.description || <span className="italic text-slate-400">Nenhuma descrição detalhada fornecida pelo usuário.</span>}
                </div>
              </div>

              {/* Meta Data Flex */}
              <div className="flex flex-col sm:flex-row gap-6 bg-blue-50/50 dark:bg-slate-800/30 p-6 rounded-2xl">
                <div className="flex-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider block mb-2">Abertura</span>
                  <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {format(new Date(occurrence.openedAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider block mb-2">Solicitante</span>
                  <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    {occurrence.resident ? occurrence.resident.fullName : 'Abertura Sistêmica'}
                  </span>
                </div>
              </div>

              {/* Formulário de Ação */}
              <form onSubmit={handleSubmit} className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Controle Operacional</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="status" className="font-bold text-slate-600 dark:text-slate-400">Status da Ocorrência</Label>
                    <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-xl">
                        <SelectItem value="open" className="font-medium rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/30">Aberta (Aguardando)</SelectItem>
                        <SelectItem value="in_progress" className="font-medium rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/30">Em Andamento</SelectItem>
                        <SelectItem value="resolved" className="font-medium rounded-xl focus:bg-emerald-50 dark:focus:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Resolvida</SelectItem>
                        <SelectItem value="closed" className="font-medium rounded-xl">Fechada / Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="priority" className="font-bold text-slate-600 dark:text-slate-400">Nível de Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(val) => handleSelectChange('priority', val)}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-xl">
                        <SelectItem value="low" className="font-medium rounded-xl">Baixa (Rotina)</SelectItem>
                        <SelectItem value="medium" className="font-medium rounded-xl text-blue-600 dark:text-blue-400">Média (Atenção)</SelectItem>
                        <SelectItem value="high" className="font-medium rounded-xl text-orange-500">Alta (Urgente)</SelectItem>
                        <SelectItem value="critical" className="font-medium rounded-xl text-red-500">Crítica (Emergência)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="assignedUserId" className="font-bold text-slate-600 dark:text-slate-400">Responsável</Label>
                    <Select value={formData.assignedUserId} onValueChange={(val) => handleSelectChange('assignedUserId', val)}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Atribuir a..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-xl">
                        <SelectItem value="none" className="font-medium rounded-xl text-slate-400">Não atribuído</SelectItem>
                        {usersList.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="font-medium rounded-xl">{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    type="submit" 
                    className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Aplicar Alterações
                  </Button>
                </div>
              </form>

            </div>
          </motion.div>
        </div>

        {/* DIREITA - TIMELINE */}
        <div className="lg:col-span-1">
          <motion.div variants={item} className="bg-slate-900 dark:bg-slate-950 p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-800 h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
            
            <h2 className="text-xl font-bold text-white mb-8 flex items-center relative z-10">
              <MessageSquareText className="w-5 h-5 mr-3 text-blue-400" />
              Histórico Operacional
            </h2>
            
            <div className="relative z-10">
              {occurrence.timeline && occurrence.timeline.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-0 md:before:translate-x-3 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500/50 before:via-slate-700 before:to-transparent">
                  {occurrence.timeline.map((entry: any, i: number) => (
                    <motion.div 
                      key={entry.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="relative pl-10"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute w-6 h-6 bg-slate-900 border-2 border-blue-500 rounded-full left-0 top-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                      
                      <div className="text-xs font-bold tracking-wider text-blue-400 mb-1">
                        {format(new Date(entry.createdAt), "dd MMM, HH:mm")}
                      </div>
                      
                      <div className="text-sm font-bold text-white mb-2">
                        {entry.actionType === 'status_changed' ? 'Atualização de Status' :
                         entry.actionType === 'priority_changed' ? 'Revisão de Prioridade' :
                         entry.actionType === 'created' ? 'Abertura de Ocorrência' :
                         'Registro de Sistema'}
                      </div>
                      
                      {entry.note && (
                        <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 leading-relaxed">
                          {entry.note}
                        </div>
                      )}
                      
                      {entry.createdBy && (
                        <div className="text-xs font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                          <User className="w-3 h-3" /> {entry.createdBy.fullName}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Nenhum histórico registrado.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
