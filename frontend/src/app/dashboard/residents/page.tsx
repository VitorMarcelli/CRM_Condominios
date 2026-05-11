'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Search, Pencil, Trash2, Plus, Users, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ResidentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [residents, setResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [residentToDelete, setResidentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
      const res = await api.get('/residents', { params });
      setResidents(res.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar moradores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [user]);

  const filteredResidents = residents.filter((r) => {
    const matchSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.phone && r.phone.includes(searchTerm)) ||
      (r.unit?.number && r.unit.number.includes(searchTerm));
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const confirmDelete = async () => {
    if (!residentToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/residents/${residentToDelete.id}`);
      toast.success('Morador excluído com sucesso.');
      setResidentToDelete(null);
      fetchResidents();
    } catch (error) {
      toast.error('Erro ao excluir morador.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'active') {
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
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Moradores</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar morador..." 
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

            <Button onClick={() => router.push('/dashboard/residents/new')} className="w-full sm:w-auto h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-6 shadow-sm">
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
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Morador</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Contato</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Unidade</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filteredResidents.length > 0 ? (
                filteredResidents.map((resident) => (
                  <tr key={resident.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* RESIDENT (AVATAR + NAME) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
                          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm">
                            {resident.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{resident.fullName}</span>
                          <span className="text-[11px] font-semibold text-slate-400">#{resident.id.substring(0, 6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{resident.phone || 'Sem telefone'}</span>
                        <span className="text-[11px] font-medium text-slate-400">{resident.email || 'Sem e-mail'}</span>
                      </div>
                    </td>

                    {/* UNIT */}
                    <td className="py-4 px-4">
                      {resident.unit ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Unidade {resident.unit.number}</span>
                            {resident.unit.block && <span className="text-[11px] font-semibold text-slate-400">Bloco {resident.unit.block.name}</span>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic">Sem unidade vinculada</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4">
                      {getStatusDisplay(resident.status)}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/residents/${resident.id}/edit`)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setResidentToDelete({ id: resident.id, name: resident.fullName })}
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
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nenhum morador encontrado</p>
                      <p className="text-xs text-slate-500 mt-1">Tente ajustar seus termos de busca.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={!!residentToDelete} onOpenChange={(open) => !open && !isDeleting && setResidentToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Excluir Morador
            </DialogTitle>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Você está prestes a excluir permanentemente o morador <strong className="text-slate-900 dark:text-white">{residentToDelete?.name}</strong>. Essa ação apagará todos os dados vinculados a ele e não poderá ser desfeita.
            </div>
          </DialogHeader>
          
          <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setResidentToDelete(null)} 
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
