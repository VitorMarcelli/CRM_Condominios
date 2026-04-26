'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditResidentPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    document: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const res = await api.get(`/residents/${id}`);
        setFormData({
          fullName: res.data.fullName || '',
          document: res.data.document || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
        });
      } catch (error) {
        toast.error('Erro ao carregar dados do morador.');
        router.push('/dashboard/residents');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchResident();
    }
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      toast.error('Nome é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/residents/${id}`, formData);
      toast.success('Morador atualizado com sucesso!');
      router.push('/dashboard/residents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar morador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/residents">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Editar Morador</h1>
          <p className="text-slate-500 mt-1">Atualize os dados cadastrais do morador.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF / Documento</Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Celular (WhatsApp)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-3" 
                onClick={() => router.push('/dashboard/residents')}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
