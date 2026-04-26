'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CondominiumsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      setCondominiums(res.data.data || []);
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

  const filteredCondominiums = condominiums.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.document && c.document.includes(searchTerm))
  );

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/condominiums/${id}`, { status: newStatus });
      toast.success('Status atualizado com sucesso.');
      fetchCondominiums();
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Condomínios</h1>
          <p className="text-slate-500 mt-1">Gerencie os condomínios cadastrados na plataforma.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/condominiums/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Condomínio
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou documento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-slate-50 border-slate-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[300px]">Nome do Condomínio</TableHead>
                  <TableHead>Documento / CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Carregando condomínios...
                    </TableCell>
                  </TableRow>
                ) : filteredCondominiums.length > 0 ? (
                  filteredCondominiums.map((condominium) => (
                    <TableRow key={condominium.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">
                        {condominium.name}
                      </TableCell>
                      <TableCell className="text-slate-500">{condominium.document || '-'}</TableCell>
                      <TableCell className="text-slate-500">
                        {condominium.email || '-'}
                        {condominium.phone && <span className="block text-xs">{condominium.phone}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={condominium.status === 'active' ? 'default' : 'secondary'} 
                               className={condominium.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}>
                          {condominium.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/condominiums/${condominium.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleStatus(condominium.id, condominium.status)}
                        >
                          <Trash2 className="w-4 h-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Nenhum condomínio encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
