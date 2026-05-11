'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dispatchGroupsService, DispatchGroup } from '@/services/dispatch-groups';
import { api } from '@/lib/api';
import { Users2, Plus, Pencil, ShieldAlert, Search, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function DispatchGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupToDelete, setGroupToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await dispatchGroupsService.findAll();
      // Assume response is the array or response.data is the array depending on the exact service return shape
      setGroups(response?.data || response || []);
    } catch (error) {
      toast.error('Erro ao carregar grupos de acionamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && g.isActive) || 
      (statusFilter === 'inactive' && !g.isActive);
    return matchSearch && matchStatus;
  });

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/dispatch-groups/${groupToDelete.id}`);
      toast.success('Grupo excluído com sucesso.');
      setGroupToDelete(null);
      fetchGroups();
    } catch (error) {
      toast.error('Erro ao excluir grupo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (isActive: boolean) => {
    if (isActive) {
      return <span className="flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />Ativo</span>;
    }
    return <span className="flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />Inativo</span>;
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[1400px] mx-auto font-sans">
      
      {/* CRAVEAT STYLE MAIN CARD */}
      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-8">
        
        {/* HEADER ROW */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Grupos de Acionamento</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar grupo..." 
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
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <Button onClick={() => router.push('/dashboard/dispatch-groups/new')} className="w-full sm:w-auto h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-6 shadow-sm">
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
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Nome do Grupo</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Descrição</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Membros</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* GROUP NAME */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <Users2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</span>
                          <span className="text-[11px] font-semibold text-slate-400">#{group.id.substring(0, 6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-xs block">
                        {group.description || <span className="italic text-slate-400">Sem descrição</span>}
                      </span>
                    </td>

                    {/* MEMBERS */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(3, group.members?.length || 0) }).map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#151515]" />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                          {group.members?.length || 0} {group.members?.length === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4">
                      {getStatusDisplay(group.isActive)}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/dispatch-groups/${group.id}/edit`)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
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
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nenhum grupo encontrado</p>
                      <p className="text-xs text-slate-500 mt-1">Tente ajustar seus termos de busca ou crie um novo grupo.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={!!groupToDelete} onOpenChange={(open) => !open && !isDeleting && setGroupToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Excluir Grupo
            </DialogTitle>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Você está prestes a excluir permanentemente o grupo <strong className="text-slate-900 dark:text-white">{groupToDelete?.name}</strong>. Todos os membros associados a este grupo perderão o vínculo de acionamento e essa ação não poderá ser desfeita.
            </div>
          </DialogHeader>
          
          <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setGroupToDelete(null)} 
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
