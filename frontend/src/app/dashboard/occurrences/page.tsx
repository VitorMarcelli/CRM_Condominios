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
import { Plus, Search, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OccurrencesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOccurrences = async () => {
    try {
      setIsLoading(true);
      const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
      const res = await api.get('/occurrences', { params });
      setOccurrences(res.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar ocorrências.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOccurrences();
  }, [user]);

  const filteredOccurrences = occurrences.filter((o) =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'critical': return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200 border">Crítica</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 border">Alta</Badge>;
      case 'medium': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 border">Média</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200 border">Baixa</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Aberta</Badge>;
      case 'in_progress': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Em andamento</Badge>;
      case 'resolved': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Resolvida</Badge>;
      case 'closed': return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">Fechada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ocorrências</h1>
          <p className="text-slate-500 mt-1">Gerencie incidentes e solicitações {user?.condominiumId ? 'do seu condomínio' : ''}.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/occurrences/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar ocorrências por título ou descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-slate-50 border-slate-200"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="w-4 h-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                      Carregando ocorrências...
                    </TableCell>
                  </TableRow>
                ) : filteredOccurrences.length > 0 ? (
                  filteredOccurrences.map((occ) => (
                    <TableRow key={occ.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/occurrences/${occ.id}`)}>
                      <TableCell className="font-medium text-slate-900">
                        {occ.title}
                        {occ.resident && <span className="block text-xs font-normal text-slate-500 mt-1">Morador: {occ.resident.fullName}</span>}
                      </TableCell>
                      <TableCell>{getPriorityBadge(occ.priority)}</TableCell>
                      <TableCell>{getStatusBadge(occ.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {format(new Date(occ.openedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {occ.assignedToUser ? occ.assignedToUser.fullName : <span className="text-slate-400 italic">Não atribuído</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/occurrences/${occ.id}/edit`); }}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                      Nenhuma ocorrência encontrada.
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
