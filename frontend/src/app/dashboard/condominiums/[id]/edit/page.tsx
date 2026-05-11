'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Building, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditCondominiumPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchCondominium = async () => {
      try {
        const res = await api.get(`/condominiums/${id}`);
        setFormData({
          name: res.data.name || '',
          document: res.data.document || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
        });
      } catch (error) {
        toast.error('Erro ao carregar os dados do condomínio.');
        router.push('/dashboard/condominiums');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCondominium();
    }
  }, [id, router]);

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
      await api.put(`/condominiums/${id}`, formData);
      toast.success('Condomínio atualizado com sucesso!');
      router.push('/dashboard/condominiums');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar condomínio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/condominiums" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Editar Condomínio</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Atualize os dados do cliente <span className="font-bold">{formData.name}</span>.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 col-span-1 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Condomínio *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Residencial Bela Vista"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="document" className="text-xs font-bold text-slate-400 uppercase tracking-wider">CNPJ / Documento</Label>
              <Input
                id="document"
                name="document"
                placeholder="00.000.000/0001-00"
                value={formData.document}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone de Contato</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 0000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail de Contato</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contato@condominio.com"
                value={formData.email}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="address" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço Completo</Label>
              <Input
                id="address"
                name="address"
                placeholder="Rua das Flores, 123 - Centro"
                value={formData.address}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full sm:w-auto h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white" 
              onClick={() => router.push('/dashboard/condominiums')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
