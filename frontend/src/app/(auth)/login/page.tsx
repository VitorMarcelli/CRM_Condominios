'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, Lock, User, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'support'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Support State
  const [supportName, setSupportName] = useState('');
  const [supportUnit, setSupportUnit] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportUnit || !supportMessage) {
      toast.error('Preencha todos os campos para enviar a mensagem.');
      return;
    }
    
    try {
      setIsLoading(true);
      await api.post('/auth/support-request', {
        name: supportName,
        unit: supportUnit,
        message: supportMessage
      });
      
      toast.success('Mensagem enviada com sucesso! O administrador entrará em contato via WhatsApp.');
      setSupportName('');
      setSupportUnit('');
      setSupportMessage('');
      setActiveTab('login');
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação. Tente novamente mais tarde.');
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
      <div className="flex lg:hidden flex-col items-start mb-8 gap-3">
        <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg shadow-lg shadow-blue-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">Condominium CRM</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          {activeTab === 'login' ? 'Bem-vindo de volta' : 'Central de Ajuda'}
        </h2>
        <p className="text-base text-slate-400">
          {activeTab === 'login' ? 'Pronto para gerenciar o condomínio?' : 'Envie uma solicitação para o administrador.'}
        </p>
      </div>

      {/* Visual Tabs */}
      <div className="flex w-full border-b border-slate-700/60 mb-8 pt-4">
        <div 
          onClick={() => setActiveTab('login')}
          className={`pb-3 px-8 font-semibold text-sm cursor-pointer transition-colors ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Login
        </div>
        <div 
          onClick={() => setActiveTab('support')}
          className={`pb-3 px-8 font-semibold text-sm cursor-pointer transition-colors ${activeTab === 'support' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Suporte
        </div>
      </div>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-6"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-300">
                    E-mail corporativo
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@crmcondominios.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-11 pr-4 bg-[#1E293B] border-slate-700 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-300">
                      Senha
                    </Label>
                    <button type="button" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-11 pr-4 bg-[#1E293B] border-slate-700 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-[15px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    'Entrar na Plataforma'
                  )}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="support"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSupportSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-300">
                  Nome Completo
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    required
                    className="h-12 pl-11 pr-4 bg-[#1E293B] border-slate-700 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-semibold text-slate-300">
                  Unidade / Apartamento
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="Ex: Apto 101, Bloco B"
                    value={supportUnit}
                    onChange={(e) => setSupportUnit(e.target.value)}
                    required
                    className="h-12 pl-11 pr-4 bg-[#1E293B] border-slate-700 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-slate-300">
                  Mensagem para o Síndico
                </Label>
                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-3.5 flex pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-slate-500" />
                  </div>
                  <textarea
                    id="message"
                    placeholder="Descreva sua dúvida ou solicite credenciais..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                    rows={3}
                    className="w-full flex min-h-[80px] pt-3.5 pl-11 pr-4 bg-[#1E293B] border border-slate-700 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-[15px] font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      Enviar Solicitação
                      <Send className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-6 text-center">
        <p className="text-sm text-slate-500">
          {activeTab === 'login' ? (
            <>
              Não possui credenciais?{' '}
              <button 
                onClick={() => setActiveTab('support')}
                className="text-blue-500 font-semibold hover:underline transition-all"
              >
                Fale com o síndico
              </button>
            </>
          ) : (
            <>
              Já possui acesso?{' '}
              <button 
                onClick={() => setActiveTab('login')}
                className="text-blue-500 font-semibold hover:underline transition-all"
              >
                Faça login
              </button>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
