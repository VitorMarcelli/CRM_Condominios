'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { escalationRulesService, EscalationRule } from '@/services/escalation-rules';
import { api } from '@/lib/api';
import { Siren, Plus, Pencil, Hash, AlertTriangle, ShieldAlert, Search, Trash2, Loader2, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EscalationRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await escalationRulesService.findAll();
      setRules(response?.data || response || []);
    } catch (error) {
      toast.error('Erro ao carregar regras de escalonamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const filteredRules = rules.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.triggerKeywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && r.isActive) || 
      (statusFilter === 'inactive' && !r.isActive);
    return matchSearch && matchStatus;
  });

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/escalation-rules/${ruleToDelete.id}`);
      toast.success('Regra excluída com sucesso.');
      setRuleToDelete(null);
      fetchRules();
    } catch (error) {
      toast.error('Erro ao excluir regra.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getUrgencyDisplay = (urgency: string) => {
    const map: Record<string, { label: string, dot: string, text: string, bg: string }> = {
      critical: { label: 'Crítico', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
      high: { label: 'Alto', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
      medium: { label: 'Médio', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
      low: { label: 'Baixo', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    };
    const mapped = map[urgency] || { label: urgency, dot: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${mapped.bg} ${mapped.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${mapped.dot} mr-1.5`} />
        {mapped.label}
      </span>
    );
  };

  const getStatusDisplay = (isActive: boolean) => {
    if (isActive) {
      return <span className="flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />Ativa</span>;
    }
    return <span className="flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />Inativa</span>;
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1400px] mx-auto font-sans">
      
      {/* CRAVEAT STYLE MAIN CARD */}
      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-8">
        
        {/* HEADER ROW */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Regras de Escalonamento</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar regra ou palavra-chave..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            {/* STATUS FILTER */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto h-11 px-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>

            <Button onClick={() => router.push('/dashboard/escalation-rules/new')} className="w-full sm:w-auto h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-6 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* CLEAN TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Nome da Regra</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Urgência</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Palavras-chave</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Grupo Vinculado</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-red-600 dark:border-slate-800 dark:border-t-red-500 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filteredRules.length > 0 ? (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* RULE NAME */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</span>
                          <span className="text-[11px] font-semibold text-slate-400">ID: {rule.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>

                    {/* URGENCY */}
                    <td className="py-4 px-4">
                      {getUrgencyDisplay(rule.urgencyLevel)}
                    </td>

                    {/* KEYWORDS */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rule.triggerKeywords?.length ? rule.triggerKeywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 border-none font-semibold text-[10px] rounded-md px-1.5 py-0.5">
                            {kw}
                          </Badge>
                        )) : <span className="text-[11px] font-medium text-slate-400 italic">Sem palavras-chave</span>}
                      </div>
                    </td>

                    {/* DISPATCH GROUP */}
                    <td className="py-4 px-4">
                      {rule.dispatchGroup?.name ? (
                        <div className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <Workflow className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                          {rule.dispatchGroup.name}
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 italic">Nenhum</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4">
                      {getStatusDisplay(rule.isActive)}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/escalation-rules/${rule.id}/edit`)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setRuleToDelete({ id: rule.id, name: rule.name })}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nenhuma regra encontrada</p>
                      <p className="text-xs text-slate-500 mt-1">Tente ajustar seus termos de busca ou crie uma nova regra.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={!!ruleToDelete} onOpenChange={(open) => !open && !isDeleting && setRuleToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Excluir Regra
            </DialogTitle>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Você está prestes a excluir permanentemente a regra <strong className="text-slate-900 dark:text-white">{ruleToDelete?.name}</strong>. Esta ação não poderá ser desfeita e pode impactar o roteamento de novos alertas.
            </div>
          </DialogHeader>
          
          <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setRuleToDelete(null)} 
              className="rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-white/5"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-md shadow-red-500/20 hover:scale-105 transition-transform"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
