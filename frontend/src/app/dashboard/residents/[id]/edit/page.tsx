'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserCog } from 'lucide-react';
import Link from 'next/link';

export default function EditResidentPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const { user } = useAuthStore();
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    condominiumId: '',
    unitId: 'none',
    fullName: '',
    document: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      api.get('/condominiums').then(res => setCondominiums(res.data.data || [])).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (formData.condominiumId) {
      api.get(`/condominiums/${formData.condominiumId}/units`)
        .then(res => setUnits(res.data.data || res.data || []))
        .catch(console.error);
    } else {
      setUnits([]);
    }
  }, [formData.condominiumId]);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const res = await api.get(`/residents/${id}`);
        setFormData({
          condominiumId: res.data.condominiumId || '',
          unitId: res.data.unitId || 'none',
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
        unitId: formData.unitId === 'none' ? null : formData.unitId
      };
      await api.put(`/residents/${id}`, payload);
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/residents" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Editar Morador</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Atualize os dados cadastrais de {formData.fullName}.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <div className="space-y-3 md:col-span-1">
                <Label htmlFor="condominiumId" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio *</Label>
                <Select 
                  value={formData.condominiumId} 
                  onValueChange={(val) => {
                    handleSelectChange('condominiumId', val);
                    handleSelectChange('unitId', 'none'); // Reset unit
                  }}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold">
                    <SelectValue placeholder="Selecione o condomínio">
                      {formData.condominiumId ? (condominiums.find(c => c.id === formData.condominiumId)?.name || 'Selecione o condomínio') : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl">
                    {condominiums.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-semibold text-slate-700 dark:text-slate-300 py-3">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 md:col-span-1">
              <Label htmlFor="unitId" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade / Casa</Label>
              <Select 
                value={formData.unitId} 
                onValueChange={(val) => handleSelectChange('unitId', val)}
                disabled={!formData.condominiumId || units.length === 0}
              >
                <SelectTrigger className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold">
                  <SelectValue placeholder={units.length === 0 ? "Nenhuma unidade cadastrada" : "Selecione a unidade"}>
                    {formData.unitId === 'none' 
                      ? 'Sem unidade vinculada' 
                      : units.find(u => u.id === formData.unitId)
                        ? `${units.find(u => u.id === formData.unitId)?.block?.name ? units.find(u => u.id === formData.unitId)?.block?.name + ' - ' : ''}Unidade ${units.find(u => u.id === formData.unitId)?.number}`
                        : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl max-h-60">
                  <SelectItem value="none" className="font-semibold text-slate-500 py-3">Sem unidade vinculada</SelectItem>
                  {units.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="font-semibold text-slate-700 dark:text-slate-300 py-3">
                      {u.block?.name ? `${u.block.name} - ` : ''}Unidade {u.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</Label>
              <Input
                id="fullName"
                name="fullName"
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
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
