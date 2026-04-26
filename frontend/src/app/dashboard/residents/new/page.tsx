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

export default function NewResidentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    condominiumId: user?.condominiumId || '',
    fullName: '',
    document: '',
    phone: '',
    email: '',
    unitId: 'none',
  });

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      api.get('/condominiums').then(res => setCondominiums(res.data.data || [])).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.condominiumId) {
        setUnits([]);
        return;
      }
      try {
        // In a real app we might fetch only units for this condominium
        // For MVP we can just fetch all units and filter, or backend could have /condominiums/:id/units
        // Assuming backend handles filtering via query param if we had it.
        const res = await api.get(`/condominiums/${formData.condominiumId}`);
        // Let's assume we don't have unit list endpoint yet, so we will skip unit dropdown population for MVP
        // or we can fetch blocks/units from backend if implemented.
      } catch (error) {
        console.error('Error fetching units', error);
      }
    };
    fetchUnits();
  }, [formData.condominiumId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    if (value !== null) setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.condominiumId) {
      toast.error('Nome e Condomínio são obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        unitId: formData.unitId === 'none' ? undefined : formData.unitId
      };
      
      await api.post('/residents', payload);
      toast.success('Morador cadastrado com sucesso!');
      router.push('/dashboard/residents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar morador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/residents">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Morador</h1>
          <p className="text-slate-500 mt-1">Cadastre um novo morador no sistema.</p>
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
                    <SelectTrigger className="bg-slate-50">
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
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Ex: João da Silva"
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
                  placeholder="000.000.000-00"
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
                  placeholder="(00) 90000-0000"
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
                  placeholder="morador@email.com"
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
                Cadastrar Morador
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
