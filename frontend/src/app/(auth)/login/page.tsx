'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      const { accessToken, refreshToken, user } = response.data;
      
      login(accessToken, refreshToken, user);
      
      toast.success(`Bem-vindo, ${user.fullName.split(' ')[0]}!`);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-8 w-full max-w-[400px] mx-auto"
    >
      {/* Mobile Branding */}
      <div className="flex lg:hidden flex-col items-center mb-10 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Condominium CRM</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
          Bem-vindo de volta
        </h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400">
          Acesse sua conta para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@crmcondominios.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 px-4 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Senha
              </Label>
              <button type="button" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                Esqueceu a senha?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 px-4 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-2xl text-base shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar na plataforma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="pt-8 flex justify-center border-t border-slate-100 dark:border-white/10">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Precisa de acesso?{' '}
          <button className="text-slate-900 dark:text-white font-bold hover:underline transition-all">
            Contate o administrador
          </button>
        </p>
      </div>
    </motion.div>
  );
}
