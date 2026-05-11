'use client';

import { ReactNode } from 'react';
import { Building2, ShieldCheck, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-[#0A0A0B]">
      {/* Left Pane - Premium Branding */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-[#0A0A0B] text-white p-16">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[120px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-32">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Condominium CRM
              </span>
            </div>

            <div className="max-w-xl space-y-8">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] text-white">
                Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">inteligente</span> para condomínios do futuro.
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed font-medium">
                Centralize ocorrências, atendimento, controle de acesso e comunicação com moradores em uma plataforma de altíssimo padrão.
              </p>

              <div className="pt-8 flex flex-col gap-6">
                {[
                  { icon: Zap, title: "Automação Inteligente", desc: "Fluxos de trabalho otimizados" },
                  { icon: ShieldCheck, title: "Segurança Avançada", desc: "Controle de acessos granular" },
                  { icon: Users, title: "Gestão Unificada", desc: "Síndicos, moradores e portaria conectados" }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-sm text-slate-500 font-medium"
          >
            &copy; {new Date().getFullYear()} Condominium CRM. Todos os direitos reservados.
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Content */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative bg-slate-50 dark:bg-[#0A0A0B]">
        <div className="w-full max-w-[440px] relative z-10">
          {children}
        </div>
        {/* Subtle decorative blob on right side */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      </div>
    </div>
  );
}
