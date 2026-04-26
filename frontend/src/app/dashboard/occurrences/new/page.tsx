'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOccurrencePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [condominiums, setCondominiums] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    condominiumId: user?.condominiumId || '',
    title: '',
    description: '',
    priority: 'low',
    status: 'open',
  });

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      api.get('/condominiums').then(res => setCondominiums(res.data.data || [])).catch(console.error);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    if (value !== null) setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.condominiumId) {
      toast.error('Título e Condomínio são obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/occurrences', formData);
      toast.success('Ocorrência criada com sucesso!');
      router.push('/dashboard/occurrences');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/occurrences">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nova Ocorrência</h1>
          <p className="text-slate-500 mt-1">Registre um incidente ou solicitação manual.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="condominiumId">Condomínio *</Label>
                  <Select 
                    value={formData.condominiumId} 
                    onValueChange={(val) => handleSelectChange('condominiumId', val)}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecione um condomínio" />
                    </SelectTrigger>
                    <SelectContent>
                      {condominiums.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título da Ocorrência *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Vazamento de água no Bloco B"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição Detalhada</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  placeholder="Descreva o problema com o máximo de detalhes..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => handleSelectChange('priority', val)}
                >
                  <SelectTrigger className="bg-slate-50">
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

              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => handleSelectChange('status', val)}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberta</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-3" 
                onClick={() => router.push('/dashboard/occurrences')}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Ocorrência
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
