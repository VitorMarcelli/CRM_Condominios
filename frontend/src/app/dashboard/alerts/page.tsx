'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { alertsService, Alert } from '@/services/alerts';
import { Search, Plus, Filter, X, AlertTriangle, ShieldAlert, CheckCircle, Eye, Zap, Target, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
} as Variants;

export default function AlertsPage() {
  const router = useRouter();
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Alert Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableOccurrences, setAvailableOccurrences] = useState<any[]>([]);
  const [availableCondominiums, setAvailableCondominiums] = useState<any[]>([]);
  const [newAlertForm, setNewAlertForm] = useState({
    condominiumId: 'all',
    occurrenceId: '',
    urgencyLevel: 'medium',
    triggerType: 'MANUAL'
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (urgencyFilter !== 'all') params.urgencyLevel = urgencyFilter;
      const response = await alertsService.findAll(params);
      setAllAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [urgencyFilter]);

  // Fetch Options for Add Alert Modal
  useEffect(() => {
    if (isAddOpen) {
      const fetchOptions = async () => {
        try {
          const [occRes, condRes] = await Promise.all([
            api.get('/occurrences'),
            api.get('/condominiums')
          ]);
          setAvailableOccurrences(occRes.data?.data || occRes.data || []);
          setAvailableCondominiums(condRes.data?.data || condRes.data || []);
        } catch (e) {
          console.error('Failed to fetch options', e);
        }
      };
      fetchOptions();
    }
  }, [isAddOpen]);

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.occurrenceId) return;

    try {
      setIsSubmitting(true);
      let finalCondoId = newAlertForm.condominiumId;
      if (finalCondoId === 'all' || !finalCondoId) {
        const selectedOcc = availableOccurrences.find(o => o.id === newAlertForm.occurrenceId);
        finalCondoId = selectedOcc?.condominiumId || '';
      }

      await alertsService.trigger({
        condominiumId: finalCondoId,
        occurrenceId: newAlertForm.occurrenceId,
        triggerType: newAlertForm.triggerType,
        urgencyLevel: newAlertForm.urgencyLevel
      });
      
      setIsAddOpen(false);
      setNewAlertForm({ condominiumId: 'all', occurrenceId: '', urgencyLevel: 'medium', triggerType: 'MANUAL' });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to create alert', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAlerts = allAlerts.length;
  const triggeredAlerts = allAlerts.filter(a => a.status === 'triggered').length;
  const acknowledgedAlerts = allAlerts.filter(a => a.status === 'acknowledged').length;
  const closedAlerts = allAlerts.filter(a => a.status === 'closed').length;

  const stats = [
    { id: 'all', label: 'Todos os Alertas', count: totalAlerts, icon: Zap, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'triggered', label: 'Disparados (Urgentes)', count: triggeredAlerts, icon: AlertTriangle, color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    { id: 'acknowledged', label: 'Reconhecidos', count: acknowledgedAlerts, icon: ShieldAlert, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { id: 'closed', label: 'Encerrados', count: closedAlerts, icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];

  const filteredAlerts = allAlerts.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSearch = searchQuery === '' || 
      a.occurrence?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.condominium?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency) {
      case 'critical': return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/20 px-2.5 py-0.5 font-bold rounded-md">Crítico</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border-orange-500/20 px-2.5 py-0.5 font-bold rounded-md">Alto</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20 px-2.5 py-0.5 font-bold rounded-md">Médio</Badge>;
      default: return <Badge className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 px-2.5 py-0.5 font-bold rounded-md">Baixo</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'triggered': 
        return <Badge className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 font-bold rounded-full animate-pulse shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" /> DISPARADO</Badge>;
      case 'acknowledged': 
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-200 px-3 py-1 font-bold rounded-full border-transparent"><ShieldAlert className="w-3 h-3 mr-1.5" /> RECONHECIDO</Badge>;
      case 'closed': 
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 px-3 py-1 font-bold rounded-full border-transparent"><CheckCircle className="w-3 h-3 mr-1.5" /> ENCERRADO</Badge>;
      default: 
        return <Badge className="bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400 px-3 py-1 font-bold rounded-full border-transparent">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1400px] mx-auto font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Central de Alertas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Monitoramento em tempo real de notificações críticas.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="h-12 rounded-[1rem] bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/25 transition-all hover:scale-105" />}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Alerta Manual
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Disparar Alerta
              </DialogTitle>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Crie um alerta vinculado a uma ocorrência específica.
              </p>
            </DialogHeader>
            <form onSubmit={handleAddAlert} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ocorrência Base</Label>
                <Select value={newAlertForm.occurrenceId} onValueChange={(val) => setNewAlertForm(prev => ({ ...prev, occurrenceId: val ?? '' }))} required>
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                    <SelectValue placeholder="Selecione uma ocorrência..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                    {availableOccurrences.map(occ => (
                      <SelectItem key={occ.id} value={occ.id} className="font-semibold text-slate-700 dark:text-slate-300">
                        {occ.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nível de Urgência</Label>
                <Select value={newAlertForm.urgencyLevel} onValueChange={(val) => setNewAlertForm(prev => ({ ...prev, urgencyLevel: val ?? 'medium' }))}>
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                    <SelectValue placeholder="Selecione a urgência" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                    <SelectItem value="critical" className="font-bold text-red-600 dark:text-red-400">CRÍTICO</SelectItem>
                    <SelectItem value="high" className="font-bold text-orange-600 dark:text-orange-400">ALTO</SelectItem>
                    <SelectItem value="medium" className="font-bold text-blue-600 dark:text-blue-400">MÉDIO</SelectItem>
                    <SelectItem value="low" className="font-bold text-slate-600 dark:text-slate-400">BAIXO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 mt-6 border-t border-slate-100 dark:border-white/5">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !newAlertForm.occurrenceId} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md">
                  {isSubmitting ? 'Disparando...' : 'Disparar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI CARDS */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = statusFilter === stat.id;
          return (
            <motion.div 
              variants={item}
              key={stat.id}
              onClick={() => setStatusFilter(stat.id)}
              className={`relative overflow-hidden bg-white dark:bg-[#151515] p-6 rounded-[2rem] border cursor-pointer group transition-all duration-300 ${
                isActive 
                ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02] ring-4 ring-blue-500/10' 
                : 'border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-blue-500/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl transition-colors ${isActive ? stat.color.replace('/10', '/20') : stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.count}</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* SEARCH AND FILTERS */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Buscar alertas por título, ID ou condomínio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-[#151515] border-slate-100 dark:border-white/5 rounded-[1.5rem] shadow-sm text-base font-medium focus-visible:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* ALERTS LIST (CARD BASED) */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <motion.div variants={item} className="p-12 text-center bg-white dark:bg-[#151515] rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum alerta encontrado</h3>
              <p className="text-slate-500 mt-1">Ajuste os filtros ou o termo de busca.</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                variants={item}
                layout
                onClick={() => router.push(`/dashboard/alerts/${alert.id}`)}
                className="bg-white dark:bg-[#151515] p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md cursor-pointer group hover:border-blue-500/20 transition-all duration-300 flex flex-col sm:flex-row gap-6 sm:gap-4 justify-between items-start sm:items-center relative overflow-hidden"
              >
                {alert.status === 'triggered' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                )}
                
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(alert.status)}
                    <span className="text-xs font-bold text-slate-400">#{alert.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {alert.condominium?.name || 'Global'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {alert.occurrence?.title || 'Alerta sem ocorrência vinculada'}
                  </h3>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {alert.occurrence?.description || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                  <div className="flex flex-col sm:items-end gap-1">
                    {getUrgencyBadge(alert.urgencyLevel)}
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(alert.triggeredAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-colors">
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
