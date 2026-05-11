'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, AlertTriangle, Clock, User, ArrowRight, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import { OccurrenceDetailsModal } from './components/occurrence-details-modal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function OccurrencesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'recent' | 'urgent' | 'mine'>('all');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    condominiumId: '',
    title: '',
    description: '',
    priority: 'low',
    residentId: '',
    assignedUserId: '',
  });

  // Details Modal States
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOccurrences = async () => {
    try {
      setIsLoading(true);
      const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
      const res = await api.get('/occurrences', { params });
      setOccurrences(res.data.data || res.data || []);
    } catch (error) {
      toast.error('Erro ao carregar ocorrências.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
    if (user?.condominiumId) {
      setFormData(prev => ({ ...prev, condominiumId: user.condominiumId }));
    }
  }, [user]);

  useEffect(() => {
    if (isAddOpen) {
      if ((user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && condominiums.length === 0) {
        api.get('/condominiums')
          .then(res => setCondominiums(res.data.data || res.data || []))
          .catch(console.error);
      }
      
      const currentCondoId = formData.condominiumId || user?.condominiumId;
      const params = currentCondoId ? { condominiumId: currentCondoId } : {};
      
      api.get('/residents', { params })
        .then(res => setResidents(res.data.data || res.data || []))
        .catch(console.error);
        
      api.get('/internal-users')
        .then(res => setUsersList(res.data.data || res.data || []))
        .catch(console.error);
    }
  }, [isAddOpen, formData.condominiumId, user, condominiums.length]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.condominiumId) {
      toast.error('Título e Condomínio são obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = { ...formData };
      if (!payload.residentId || payload.residentId === 'none') delete payload.residentId;
      if (!payload.assignedUserId || payload.assignedUserId === 'none') delete payload.assignedUserId;
      
      await api.post('/occurrences', payload);
      toast.success('Ocorrência criada com sucesso!');
      setIsAddOpen(false);
      setFormData({
        condominiumId: user?.condominiumId || '',
        title: '',
        description: '',
        priority: 'low',
        residentId: '',
        assignedUserId: '',
      });
      fetchOccurrences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOccurrences = occurrences.filter((o) => {
    // 1. Text Search
    const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (filterMode === 'urgent') {
      if (o.priority !== 'critical' && o.priority !== 'high') return false;
      if (o.status === 'closed' || o.status === 'resolved') return false;
    }
    if (filterMode === 'mine') {
      if (o.assignedToUserId !== user?.id) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (filterMode === 'urgent') {
      const pMap: any = { critical: 4, high: 3, medium: 2, low: 1 };
      const diff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      if (diff !== 0) return diff;
    }
    // Default: Sort by newest
    return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
  });

  // KPI Calculations
  const totalOpen = occurrences.filter(o => o.status !== 'closed' && o.status !== 'resolved').length;
  const totalCritical = occurrences.filter(o => o.priority === 'critical' && o.status !== 'closed' && o.status !== 'resolved').length;
  const totalResolvedToday = occurrences.filter(o => {
    if (o.status !== 'resolved' && o.status !== 'closed') return false;
    const dateToCompare = o.closedAt || o.updatedAt || o.openedAt;
    if (!dateToCompare) return false;
    return Math.abs(differenceInHours(new Date(), new Date(dateToCompare))) <= 24;
  }).length;

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'critical': return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/20 px-2.5 py-0.5 font-bold rounded-md">Crítica</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border-orange-500/20 px-2.5 py-0.5 font-bold rounded-md">Alta</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20 px-2.5 py-0.5 font-bold rounded-md">Média</Badge>;
      default: return <Badge className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 px-2.5 py-0.5 font-bold rounded-md">Baixa</Badge>;
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
  }

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      
      {/* HEADER & KPIs */}
      <div className="flex flex-col gap-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Central de Chamados</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Gestão inteligente de incidentes e requisições do condomínio.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                Novo Chamado
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 bg-white dark:bg-[#111111]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                Nova Ocorrência
              </DialogTitle>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Registre um incidente ou solicitação manual no sistema.
              </p>
            </DialogHeader>
            
            <form onSubmit={handleAddSubmit} className="space-y-5">
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio *</Label>
                  <select 
                    value={formData.condominiumId} 
                    onChange={(e) => setFormData(prev => ({ ...prev, condominiumId: e.target.value }))} 
                    required
                    className="w-full h-12 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Selecione um condomínio...</option>
                    {condominiums.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título da Ocorrência *</Label>
                <Input
                  required
                  placeholder="Ex: Vazamento no Bloco B"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</Label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do incidente..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Morador Solicitante</Label>
                  <select 
                    value={formData.residentId} 
                    onChange={(e) => setFormData(prev => ({ ...prev, residentId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Não informado</option>
                    {residents.map(r => (
                      <option key={r.id} value={r.id}>{r.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atribuir a</Label>
                  <select 
                    value={formData.assignedUserId} 
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedUserId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Não atribuído</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridade</Label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full sm:w-1/2 h-12 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <DialogFooter className="pt-4 mt-6 border-t border-slate-100 dark:border-white/5">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md hover:scale-105 transition-transform">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Salvando...' : 'Registrar Ocorrência'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </motion.div>

        {/* KPI BOARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
          <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Abertos</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalOpen}</h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center relative z-10 group-hover:bg-blue-100 transition-colors">
              <Clock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Críticos</p>
              <h3 className="text-4xl font-black text-red-600 dark:text-red-400">{totalCritical}</h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center relative z-10 group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#151515] p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Resolvidos (24h)</p>
              <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{totalResolvedToday}</h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center relative z-10 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col lg:flex-row gap-4 px-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto p-1 bg-slate-200/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'recent', label: 'Recentes' },
            { id: 'urgent', label: 'Urgentes', icon: AlertTriangle },
            { id: 'mine', label: 'Meus Chamados' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filterMode === tab.id 
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon && <tab.icon className={`w-4 h-4 ${filterMode === tab.id ? 'text-red-500' : ''}`} />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 flex shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar chamado (ID, título, req)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* TICKETS LIST */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-6">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Carregando chamados...</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3 px-2">
          <AnimatePresence>
            {filteredOccurrences.length > 0 ? (
              filteredOccurrences.map((occ) => (
                <motion.div 
                  key={occ.id} 
                  variants={item}
                  layout
                  onClick={() => {
                    setSelectedOccurrenceId(occ.id);
                    setIsDetailsOpen(true);
                  }}
                  className="group bg-white dark:bg-[#151515] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-200 dark:border-white/5 hover:border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between overflow-hidden relative p-4"
                >
                  {/* Urgent indicator line */}
                  {(occ.priority === 'critical' || occ.priority === 'high') && occ.status !== 'closed' && occ.status !== 'resolved' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}

                  {/* Left Column: ID, Title, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 pl-2">
                    <div className="flex items-center gap-3 w-40 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{occ.id.split('-')[0].toUpperCase()}
                      </span>
                      {getStatusBadge(occ.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {occ.title}
                        </h3>
                        {getPriorityBadge(occ.priority)}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-500">
                        {occ.category?.name && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {occ.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(occ.openedAt), "dd MMM HH:mm", { locale: ptBR })}
                        </span>
                        {occ.resident && (
                          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{occ.resident.fullName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Assignee & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-100 dark:border-transparent">
                    <div className="flex items-center gap-2">
                      {occ.assignedUser ? (
                        <>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-[#151515]">
                            {occ.assignedUser.fullName.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 hidden lg:block">
                            {occ.assignedUser.fullName.split(' ')[0]}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 border-dashed">
                          Não atribuído
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div variants={item} className="p-12 text-center bg-slate-50 dark:bg-[#151515] rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma ocorrência encontrada</h3>
                <p className="text-slate-500 mt-1">Tente ajustar seus termos de busca.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* DETALHES DA OCORRÊNCIA (MODAL) */}
      <OccurrenceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        occurrenceId={selectedOccurrenceId}
        onUpdated={fetchOccurrences}
      />
    </div>
  );
}
