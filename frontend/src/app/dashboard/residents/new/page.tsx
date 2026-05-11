'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
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
    <div className="space-y-8 pb-12 w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/residents" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Novo Morador</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Insira os dados cadastrais do residente.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="condominiumId" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio *</Label>
                <Select 
                  value={formData.condominiumId} 
                  onValueChange={(val) => handleSelectChange('condominiumId', val)}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold">
                    <SelectValue placeholder="Selecione o condomínio vinculado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                    {condominiums.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-semibold text-slate-700 dark:text-slate-300 py-3">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Ex: João da Silva"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="document" className="text-xs font-bold text-slate-400 uppercase tracking-wider">CPF / Documento</Label>
              <Input
                id="document"
                name="document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celular (WhatsApp)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 90000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="morador@email.com"
                value={formData.email}
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
              onClick={() => router.push('/dashboard/residents')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar Cadastro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
