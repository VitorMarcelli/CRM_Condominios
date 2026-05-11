'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { alertsService, Alert } from '@/services/alerts';
import { Search, Download, ListFilter, Plus, Filter, X, MoreHorizontal, AlertTriangle, Clock, Zap, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlertsPage() {
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
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
      
      // Note: We intentionally do NOT filter by status here, 
      // so we can accurately calculate the totals for all 4 KPI cards.
      if (urgencyFilter !== 'all') params.urgencyLevel = urgencyFilter;
      
      if (periodFilter !== 'all') {
        const date = new Date();
        if (periodFilter === 'today') date.setHours(0, 0, 0, 0);
        if (periodFilter === '7d') date.setDate(date.getDate() - 7);
        if (periodFilter === '30d') date.setDate(date.getDate() - 30);
        params.startDate = date.toISOString();
      }

      const response = await alertsService.findAll(params);
      setAllAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch only when Urgency or Period changes, not Status.
  useEffect(() => {
    fetchAlerts();
  }, [urgencyFilter, periodFilter]);

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await alertsService.acknowledge(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert', error);
    }
  };

  const handleClose = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await alertsService.close(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to close alert', error);
    }
  };

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
          console.error('Failed to fetch options for alert form', e);
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
      
      // Se não selecionar condomínio na listagem geral, tenta inferir a partir da ocorrência
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

  // Dynamically calculate KPI Stats from all fetched alerts
  const totalAlerts = allAlerts.length;
  const triggeredAlerts = allAlerts.filter(a => a.status === 'triggered').length;
  const acknowledgedAlerts = allAlerts.filter(a => a.status === 'acknowledged').length;
  const closedAlerts = allAlerts.filter(a => a.status === 'closed').length;

  const stats = [
    { id: 'all', label: 'Todos os alertas', count: totalAlerts, trend: '+12%', isUp: true, color: 'bg-[#93c5fd]' },
    { id: 'triggered', label: 'Disparados (Ação Exigida)', count: triggeredAlerts, trend: '+24%', isUp: true, color: 'bg-[#fdba74]' },
    { id: 'acknowledged', label: 'Reconhecidos', count: acknowledgedAlerts, trend: '-5%', isUp: false, color: 'bg-[#fde047]' },
    { id: 'closed', label: 'Encerrados', count: closedAlerts, trend: '+2%', isUp: true, color: 'bg-[#86efac]' },
  ];

  // Filter the table client-side based on the selected Status and Search Query
  const filteredAlerts = allAlerts.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSearch = searchQuery === '' || 
      a.occurrence?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.condominium?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleExport = () => {
    if (filteredAlerts.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const headers = ['ID', 'Ocorrencia', 'Condominio', 'Urgencia', 'Status', 'Data_Disparo'];
    
    const rows = filteredAlerts.map(a => [
      a.id,
      `"${(a.occurrence?.title || 'Desconhecida').replace(/"/g, '""')}"`,
      `"${(a.condominium?.name || 'Global').replace(/"/g, '""')}"`,
      a.urgencyLevel,
      a.status,
      format(new Date(a.triggeredAt), "dd/MM/yyyy HH:mm")
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_alertas_${format(new Date(), "ddMMyyyy_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusPill = (status: string) => {
    switch(status) {
      case 'triggered': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500 uppercase tracking-widest border border-red-200 dark:border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />DISPARADO</span>;
      case 'acknowledged': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 uppercase tracking-widest border border-yellow-200 dark:border-yellow-500/20"><ShieldAlert className="w-3 h-3 mr-1" />RECONHECIDO</span>;
      case 'closed': 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" />ENCERRADO</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1400px] mx-auto font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Alert list</h1>
      </div>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div 
            key={stat.id}
            onClick={() => setStatusFilter(stat.id)}
            className={`relative overflow-hidden bg-white dark:bg-[#151515] rounded-[1.5rem] cursor-pointer transition-all duration-300 border ${statusFilter === stat.id ? 'shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-slate-300 dark:border-white/20 scale-[1.02]' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 shadow-sm'}`}
          >
            {/* Top color bar matching the image style */}
            <div className={`absolute top-0 left-0 right-0 h-12 ${stat.color} opacity-90`} />
            
            <div className="relative z-10 px-6 pt-3 pb-6">
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 drop-shadow-sm">{stat.label}</span>
              <div className="flex items-end gap-3 mt-7">
                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stat.count}</span>
                <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${stat.isUp ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10'}`}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-2">Then last week</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#151515] p-3 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center flex-1 w-full gap-4 pl-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0f0f0f] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{filteredAlerts.length} <span className="text-slate-400 font-medium">alerts</span></span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="ghost" className="h-10 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
          <Button variant="ghost" className="h-10 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-white/5">
            <ListFilter className="w-4 h-4 mr-2" /> Sort: default
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-5 shadow-sm ml-2" />}>
              <Plus className="w-4 h-4 mr-1.5" /> Add alert
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  Novo Alerta
                </DialogTitle>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Dispare um alerta manual vinculado a uma ocorrência.
                </p>
              </DialogHeader>
              <form onSubmit={handleAddAlert} className="space-y-5">
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ocorrência Base</Label>
                  <Select value={newAlertForm.occurrenceId} onValueChange={(val) => setNewAlertForm(prev => ({ ...prev, occurrenceId: val }))} required>
                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                      <SelectValue placeholder="Selecione uma ocorrência..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                      {availableOccurrences.map(occ => (
                        <SelectItem key={occ.id} value={occ.id} className="font-semibold text-slate-700 dark:text-slate-300">
                          {occ.title}
                        </SelectItem>
                      ))}
                      {availableOccurrences.length === 0 && (
                        <div className="p-3 text-sm text-slate-500 text-center">Nenhuma ocorrência encontrada</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio (Opcional se global)</Label>
                  <Select value={newAlertForm.condominiumId} onValueChange={(val) => setNewAlertForm(prev => ({ ...prev, condominiumId: val }))}>
                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                      <SelectValue placeholder="Aplicar a todos os condomínios" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                      <SelectItem value="all" className="font-bold text-blue-600 dark:text-blue-400">Todos os condomínios</SelectItem>
                      {availableCondominiums.map(condo => (
                        <SelectItem key={condo.id} value={condo.id} className="font-semibold text-slate-700 dark:text-slate-300">
                          {condo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nível de Urgência</Label>
                  <Select value={newAlertForm.urgencyLevel} onValueChange={(val) => setNewAlertForm(prev => ({ ...prev, urgencyLevel: val }))}>
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
                  <Button type="submit" disabled={isSubmitting || !newAlertForm.occurrenceId} className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 shadow-md hover:scale-105 transition-transform">
                    {isSubmitting ? 'Disparando...' : 'Disparar Alerta'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* FILTER CHIPS */}
      {(urgencyFilter !== 'all' || periodFilter !== 'all') && (
        <div className="flex items-center gap-3 px-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {urgencyFilter !== 'all' && (
            <div className="flex items-center bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              Urgência: {urgencyFilter}
              <button onClick={() => setUrgencyFilter('all')} className="ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-3 h-3" /></button>
            </div>
          )}
          {periodFilter !== 'all' && (
            <div className="flex items-center bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              Período: {periodFilter}
              <button onClick={() => setPeriodFilter('all')} className="ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-3 h-3" /></button>
            </div>
          )}
          <button 
            onClick={() => { setUrgencyFilter('all'); setPeriodFilter('all'); }} 
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline-offset-4 hover:underline ml-2"
          >
            Clear all {Number(urgencyFilter !== 'all') + Number(periodFilter !== 'all')}
          </button>
        </div>
      )}

      {/* CLEAN DATA TABLE */}
      <div className="bg-white dark:bg-[#151515] rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="py-5 pl-6 pr-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">ALERT ID</th>
                <th className="py-5 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">OCORRÊNCIA</th>
                <th className="py-5 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">CONDOMÍNIO</th>
                <th className="py-5 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">URGÊNCIA</th>
                <th className="py-5 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">DATA</th>
                <th className="py-5 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap">STATUS</th>
                <th className="py-5 pr-6 pl-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 dark:border-slate-800 dark:border-t-white rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-500 font-medium">
                    No alerts found for current filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6 pr-4 text-sm font-bold text-slate-900 dark:text-white">
                      #{alert.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-900 dark:text-white max-w-[250px] truncate">
                      {alert.occurrence?.title || 'Unknown'}
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                        {alert.occurrence?.description || 'No description provided'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {alert.condominium?.name || 'Global'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        alert.urgencyLevel === 'critical' ? 'text-red-500' :
                        alert.urgencyLevel === 'high' ? 'text-orange-500' :
                        alert.urgencyLevel === 'medium' ? 'text-blue-500' : 'text-slate-500'
                      }`}>
                        {alert.urgencyLevel}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {format(new Date(alert.triggeredAt), "dd.MM.yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusPill(alert.status)}
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/alerts/${alert.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
