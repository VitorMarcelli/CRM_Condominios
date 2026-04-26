'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResidentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [residents, setResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredResidents = residents.filter((r) =>
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.phone && r.phone.includes(searchTerm)) ||
    (r.unit?.number && r.unit.number.includes(searchTerm))
  );

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/residents/${id}`, { status: newStatus });
      toast.success('Status do morador atualizado.');
      fetchResidents();
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Moradores</h1>
          <p className="text-slate-500 mt-1">Gerencie os moradores {user?.condominiumId ? 'do seu condomínio' : 'registrados na plataforma'}.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/residents/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Morador
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, telefone ou unidade..." 
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
                  <TableHead className="w-[300px]">Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Unidade/Bloco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Carregando moradores...
                    </TableCell>
                  </TableRow>
                ) : filteredResidents.length > 0 ? (
                  filteredResidents.map((resident) => (
                    <TableRow key={resident.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">
                        {resident.fullName}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {resident.email || '-'}
                        {resident.phone && <span className="block text-xs">{resident.phone}</span>}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {resident.unit ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Unidade {resident.unit.number} 
                            {resident.unit.block && ` - ${resident.unit.block.name}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sem unidade</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={resident.status === 'active' ? 'default' : 'secondary'} 
                               className={resident.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}>
                          {resident.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/residents/${resident.id}/edit`)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleStatus(resident.id, resident.status)}
                        >
                          <Trash2 className="w-4 h-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Nenhum morador encontrado.
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
