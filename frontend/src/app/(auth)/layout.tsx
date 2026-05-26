'use client';

import { ReactNode } from 'react';
import { Building2, ShieldCheck, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#0B1121] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Left Pane - Scenic / 3D Vibe */}
      <div className="hidden lg:flex flex-col relative w-1/2 overflow-hidden bg-[#0B1121]">
        
        {/* Abstract Scenic Background */}
        <div className="absolute inset-0 z-0">
          {/* Deep gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] to-[#0B1121]" />
          
          {/* "Mountain/3D" fake effect using polygons and gradients */}
          <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-[#060B14] to-transparent z-10" />
          
          <svg className="absolute bottom-0 w-full h-[70%] opacity-40 mix-blend-screen" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon fill="url(#grad1)" points="0,100 0,60 20,40 40,70 60,30 80,60 100,20 100,100" />
            <polygon fill="url(#grad2)" points="0,100 0,80 30,50 50,80 70,40 100,60 100,100" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0B1121" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0B1121" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Stars / Particles */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-white rounded-full opacity-50 blur-[1px]"></div>
          <div className="absolute top-[40%] left-[70%] w-1 h-1 bg-white rounded-full opacity-30 blur-[1px]"></div>
          <div className="absolute top-[10%] left-[60%] w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60 blur-[2px]"></div>
          <div className="absolute top-[35%] left-[15%] w-1 h-1 bg-white rounded-full opacity-40"></div>
          
          {/* Beams of light */}
          <div className="absolute -top-[10%] left-[20%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"></div>
          <div className="absolute top-[10%] left-[80%] w-[1px] h-[50%] bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"></div>
        </div>

        <div className="relative z-20 flex flex-col h-full justify-between p-12 lg:p-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-24">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-wide text-white">
                Condominium CRM
              </span>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Sua jornada de gestão <br />
                <span className="text-blue-500">começa aqui.</span>
              </h1>
              <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed mt-4">
                Gerencie ocorrências, automatize tarefas e ganhe controle total em tempo real.
                Transforme a rotina do seu condomínio com tecnologia de ponta.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Form Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#0F172A]">
        {/* Subtle separator shadow if needed */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>
        
        <div className="w-full max-w-[440px] relative z-10">
          {children}
        </div>
      </div>
      
      {/* Global styles for animations if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { background-position: 1rem 0; }
        }
      `}} />
    </div>
  );
}
