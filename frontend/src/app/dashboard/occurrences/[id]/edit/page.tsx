'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Clock, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EditOccurrencePage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occurrence, setOccurrence] = useState<any>(null);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
  });

  useEffect(() => {
    const fetchOccurrence = async () => {
      try {
        const res = await api.get(`/occurrences/${id}`);
        setOccurrence(res.data);
        setFormData({
          status: res.data.status,
          priority: res.data.priority,
        });
      } catch (error) {
        toast.error('Erro ao carregar dados da ocorrência.');
        router.push('/dashboard/occurrences');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOccurrence();
    }
  }, [id, router]);

  const handleSelectChange = (name: string, value: string | null) => {
    if (value !== null) setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await api.put(`/occurrences/${id}`, formData);
      toast.success('Ocorrência atualizada com sucesso!');
      
      // Refresh to see new timeline entries
      const res = await api.get(`/occurrences/${id}`);
      setOccurrence(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !occurrence) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/occurrences">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gerenciar Ocorrência</h1>
          <p className="text-slate-500 mt-1">ID: {occurrence.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Details & Edit */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xl">{occurrence.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Descrição:</h3>
                  <div className="bg-slate-50 p-4 rounded-md text-slate-700 text-sm whitespace-pre-wrap">
                    {occurrence.description || <span className="italic text-slate-400">Sem descrição detalhada.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">Abertura:</span>
                    <span className="text-slate-600 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-slate-400" />
                      {format(new Date(occurrence.openedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block mb-1">Morador Solicitante:</span>
                    <span className="text-slate-600">
                      {occurrence.resident ? occurrence.resident.fullName : 'Abertura manual sistêmica'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6 mt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Atualizar Situação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status Atual</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(val) => handleSelectChange('status', val)}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberta</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="resolved">Resolvida</SelectItem>
                          <SelectItem value="closed">Fechada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(val) => handleSelectChange('priority', val)}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Mudanças
                    </Button>
                  </div>
                </form>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Timeline */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center">
                <MessageSquareText className="w-5 h-5 mr-2 text-slate-400" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {occurrence.timeline && occurrence.timeline.length > 0 ? (
                  <div className="relative border-l border-slate-200 ml-3 space-y-6">
                    {occurrence.timeline.map((entry: any) => (
                      <div key={entry.id} className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-blue-100 border border-blue-500 rounded-full -left-1.5 top-1"></div>
                        <div className="text-xs text-slate-500 mb-1">
                          {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {entry.actionType === 'status_changed' ? 'Status alterado' :
                           entry.actionType === 'priority_changed' ? 'Prioridade alterada' :
                           entry.actionType === 'created' ? 'Ocorrência criada' :
                           'Atualização'}
                        </div>
                        {entry.note && (
                          <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {entry.note}
                          </div>
                        )}
                        {entry.createdBy && (
                          <div className="text-xs text-slate-400 mt-1">Por: {entry.createdBy.fullName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Nenhuma movimentação registrada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
