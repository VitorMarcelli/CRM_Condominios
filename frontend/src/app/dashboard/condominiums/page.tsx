'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, Pencil, Trash2, Building, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function CondominiumsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [condominiumToToggle, setCondominiumToToggle] = useState<{ id: string, name: string, status: string } | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem ver condomínios globais.');
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchCondominiums = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/condominiums');
      setCondominiums(res.data?.data || res.data || []);
    } catch (error) {
      toast.error('Erro ao carregar condomínios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      fetchCondominiums();
    }
  }, [user]);

  const filteredCondominiums = condominiums.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (c.document && c.document.includes(searchTerm));
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const confirmToggleStatus = async () => {
    if (!condominiumToToggle) return;
    const newStatus = condominiumToToggle.status === 'active' ? 'inactive' : 'active';
    try {
      setIsToggling(true);
      await api.put(`/condominiums/${condominiumToToggle.id}`, { status: newStatus });
      toast.success(`Condomínio ${newStatus === 'active' ? 'ativado' : 'inativado'} com sucesso.`);
      setCondominiumToToggle(null);
      fetchCondominiums();
    } catch (error) {
      toast.error('Erro ao atualizar status do condomínio.');
    } finally {
      setIsToggling(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return null; // Will redirect
  }

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
              <Building className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Condomínios</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Gerencie os clientes e condomínios da plataforma.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar nome ou documento..." 
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

            <Button onClick={() => router.push('/dashboard/condominiums/new')} className="w-full sm:w-auto h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm shadow-blue-500/20 hover:scale-105 transition-transform">
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
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 w-[350px]">Nome do Condomínio</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Documento / CNPJ</th>
                <th className="py-4 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">Contato</th>
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
              ) : filteredCondominiums.length > 0 ? (
                filteredCondominiums.map((condominium) => (
                  <tr key={condominium.id} className="group border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* NAME */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                          {condominium.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{condominium.name}</span>
                          <span className="text-[11px] font-semibold text-slate-400">ID: {condominium.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>

                    {/* DOCUMENT */}
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{condominium.document || '-'}</span>
                    </td>

                    {/* CONTACT */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{condominium.email || '-'}</span>
                        {condominium.phone && <span className="text-[11px] font-medium text-slate-500 mt-0.5">{condominium.phone}</span>}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4">
                      {getStatusDisplay(condominium.status)}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/condominiums/${condominium.id}/edit`)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setCondominiumToToggle({ id: condominium.id, name: condominium.name, status: condominium.status })}
                          className={`h-8 w-8 ${condominium.status === 'active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                          title={condominium.status === 'active' ? 'Inativar' : 'Ativar'}
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
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Nenhum condomínio encontrado</p>
                      <p className="text-xs text-slate-500 mt-1">Tente ajustar seus filtros ou cadastre um novo condomínio.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM TOGGLE STATUS DIALOG */}
      <Dialog open={!!condominiumToToggle} onOpenChange={(open) => !open && !isToggling && setCondominiumToToggle(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-white/10 shadow-2xl p-8 bg-white dark:bg-[#111111]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className={`w-6 h-6 ${condominiumToToggle?.status === 'active' ? 'text-red-500' : 'text-emerald-500'}`} />
              {condominiumToToggle?.status === 'active' ? 'Inativar Condomínio' : 'Reativar Condomínio'}
            </DialogTitle>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
              Você tem certeza que deseja {condominiumToToggle?.status === 'active' ? 'inativar' : 'reativar'} o condomínio <strong className="text-slate-900 dark:text-white">{condominiumToToggle?.name}</strong>? {condominiumToToggle?.status === 'active' ? 'Isso irá bloquear o acesso de todos os usuários vinculados a ele.' : 'Isso irá liberar o acesso de todos os usuários vinculados a ele.'}
            </div>
          </DialogHeader>
          
          <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setCondominiumToToggle(null)} 
              className="rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-white/5"
              disabled={isToggling}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={confirmToggleStatus}
              disabled={isToggling}
              className={`rounded-xl text-white font-bold px-6 shadow-md hover:scale-105 transition-transform ${condominiumToToggle?.status === 'active' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
            >
              {isToggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isToggling ? 'Aguarde...' : 'Sim, confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
