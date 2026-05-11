'use client';

import { useState, useEffect } from 'react';
import { auditService } from '@/services/audit';
import { ShieldCheck, History, Search, Fingerprint, Database, Code, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.findAll({ limit: 100 });
      setLogs(data?.data || data || []);
    } catch (error) {
      toast.error('Erro ao carregar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      log.action.toLowerCase().includes(term) || 
      log.entityType.toLowerCase().includes(term) ||
      (log.actorId && log.actorId.toLowerCase().includes(term));
    
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchSearch && matchAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const getActorDisplay = (actorType: string, actorId: string) => {
    if (actorType === 'system') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center shadow-sm">
            <Code className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Sistema</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Automação</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
          <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{actorType}</span>
          <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]" title={actorId}>ID: {actorId?.substring(0,8)}</span>
        </div>
      </div>
    );
  };

  const getActionBadge = (action: string) => {
    let color = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300';
    if (action.includes('CREATE') || action.includes('ADD')) color = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (action.includes('UPDATE') || action.includes('EDIT')) color = 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
    if (action.includes('DELETE') || action.includes('REMOVE')) color = 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';

    return (
      <Badge variant="secondary" className={`${color} border-none font-bold text-[11px] px-2 py-1`}>
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1400px] mx-auto font-sans">
      
      {/* CRAVEAT STYLE MAIN CARD */}
      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-8">
        
        {/* HEADER ROW */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Auditoria Avançada</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Rastreabilidade completa de ações no sistema.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar ator, entidade..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            {/* ACTION FILTER */}
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-auto h-11 px-4 bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="all">Todas as Ações</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CLEAN TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Data e Hora</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Ator / Responsável</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Ação Realizada</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Entidade Afetada</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Detalhes Técnicos (JSON)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* TIMESTAMP */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <History className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* ACTOR */}
                    <td className="py-4 px-4">
                      {getActorDisplay(log.actorType, log.actorId)}
                    </td>

                    {/* ACTION */}
                    <td className="py-4 px-4">
                      {getActionBadge(log.action)}
                    </td>

                    {/* ENTITY */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          {log.entityType}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1 truncate max-w-[150px]" title={log.entityId}>
                          ID: {log.entityId?.substring(0,8)}...
                        </span>
                      </div>
                    </td>

                    {/* METADATA */}
                    <td className="py-4 px-4">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 max-w-[300px] overflow-auto max-h-24 no-scrollbar">
                          <pre className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 leading-tight">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 italic">Sem metadados adicionais</span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nenhum log encontrado</p>
                      <p className="text-xs text-slate-500 mt-1">Nenhuma atividade corresponde aos seus filtros de busca.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
