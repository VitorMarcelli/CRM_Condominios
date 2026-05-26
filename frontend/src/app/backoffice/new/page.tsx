'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2, User, Globe, Loader2, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    domain: '',
    document: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    planId: 'plan_123', // Hardcoded placeholder for now (in a real app, fetch from plans table)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate domain if not provided (fallback to path-based routing)
    let finalDomain = formData.domain;
    if (!finalDomain) {
      const slug = formData.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '');
      finalDomain = `${slug}.crmcondominios.com.br`;
    }

    setIsLoading(true);
    try {
      // Assuming planId is handled gracefully or mocked in the backend for manual onboarding
      await api.post('/onboarding', {
        ...formData,
        domain: finalDomain,
      });
      
      toast.success('Cliente cadastrado com sucesso!');
      router.push('/backoffice');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/backoffice">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Novo Cliente (Tenant)</h1>
          <p className="text-slate-400 mt-1">Provisione uma nova instância do CRM SaaS.</p>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-8 shadow-xl space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Organization Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
              <Building2 className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-white">Dados da Administradora</h2>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-slate-300">Nome da Empresa</Label>
              <Input
                id="organizationName"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Ex: Condominium Master Admin"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document" className="text-slate-300">CNPJ / CPF</Label>
              <Input
                id="document"
                name="document"
                value={formData.document}
                onChange={handleChange}
                placeholder="00.000.000/0001-00"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain" className="text-slate-300 flex items-center gap-2">
                Domínio Personalizado
                <span className="text-xs text-slate-500 font-normal">(Opcional)</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-500" />
                </div>
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="app.empresa.com.br"
                  className="pl-9 bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <p className="text-xs text-slate-500">Deixe em branco para auto-gerar baseado no nome.</p>
            </div>
          </div>

          {/* Admin Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
              <User className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-white">Primeiro Usuário (Admin)</h2>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminName" className="text-slate-300">Nome Completo</Label>
              <Input
                id="adminName"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                placeholder="Ex: Carlos Silva"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-slate-300">E-mail do Administrador</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleChange}
                placeholder="admin@empresa.com.br"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone" className="text-slate-300">WhatsApp</Label>
              <Input
                id="adminPhone"
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleChange}
                placeholder="5511999999999"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            {/* Mock Plan */}
            <div className="space-y-2">
              <Label htmlFor="plan" className="text-slate-300">Plano de Faturamento</Label>
              <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-md">
                <CreditCard className="w-5 h-5 text-teal-500" />
                <span className="text-sm font-medium text-white">Plano Start - Integração Manual</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700/50 flex justify-end gap-4">
          <Link href="/backoffice">
            <Button type="button" variant="ghost" className="text-slate-300 hover:text-white">
              Cancelar
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 shadow-lg shadow-teal-500/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Criar Instância SaaS
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
