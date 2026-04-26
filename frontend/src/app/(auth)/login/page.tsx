'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      {/* Mobile Branding (visible only on small screens) */}
      <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
        <div className="bg-blue-600 p-3 rounded-xl shadow-sm">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">Condominium CRM</span>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Entrar na plataforma</CardTitle>
          <CardDescription className="text-base text-slate-500">
            Digite suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="font-semibold text-slate-700">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@crmcondominios.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-slate-700">Senha</Label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu a senha?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-6 text-sm text-slate-500">
          Precisa de acesso? Contate o administrador.
        </CardFooter>
      </Card>
    </div>
  );
}
