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
import { Search, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
        const res = await api.get('/conversations', { params });
        setConversations(res.data.data || []);
      } catch (error) {
        toast.error('Erro ao carregar conversas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  const filteredConversations = conversations.filter((c) =>
    (c.resident?.fullName && c.resident.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.externalReference && c.externalReference.includes(searchTerm))
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aberta</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendente</Badge>;
      case 'closed': return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Fechada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Conversas</h1>
          <p className="text-slate-500 mt-1">Gerencie os atendimentos via WhatsApp e outros canais.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por morador ou telefone..." 
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
                  <TableHead className="w-[300px]">Contato</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Mensagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Carregando conversas...
                    </TableCell>
                  </TableRow>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <TableRow key={conv.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}>
                      <TableCell className="font-medium text-slate-900">
                        {conv.resident ? (
                          <span>{conv.resident.fullName}</span>
                        ) : (
                          <span className="text-amber-600 italic">Desconhecido</span>
                        )}
                        <span className="block text-xs font-normal text-slate-500 mt-1">
                          Ref: {conv.externalReference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{conv.channel}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(conv.status)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/conversations/${conv.id}`); }}
                        >
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      Nenhuma conversa encontrada.
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
