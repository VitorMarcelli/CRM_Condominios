'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCondominiumPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    address: '',
    phone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('O nome do condomínio é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/condominiums', formData);
      toast.success('Condomínio criado com sucesso!');
      router.push('/dashboard/condominiums');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar condomínio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/condominiums">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Condomínio</h1>
          <p className="text-slate-500 mt-1">Preencha os dados para registrar um novo condomínio.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome do Condomínio *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Residencial Bela Vista"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CNPJ / Documento</Label>
                <Input
                  id="document"
                  name="document"
                  placeholder="00.000.000/0001-00"
                  value={formData.document}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone de Contato</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(00) 0000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@condominio.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Rua das Flores, 123 - Centro"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-3" 
                onClick={() => router.push('/dashboard/condominiums')}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Condomínio
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
