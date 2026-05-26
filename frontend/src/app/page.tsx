'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, ShieldCheck, Zap, MessageSquare, CreditCard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// WHATSAPP LINK GENÉRICO (Trocar Depois)
const WHATSAPP_LINK = "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20conhecer%20o%20CRM%20SaaS%20para%20o%20meu%20condom%C3%ADnio.";

const features = [
  {
    title: "Comunicação Centralizada",
    description: "Integração nativa com WhatsApp via Evolution API para avisos, boletos e chat em tempo real com moradores.",
    icon: MessageSquare,
  },
  {
    title: "Financeiro Inteligente",
    description: "Emissão de boletos, PIX e conciliação bancária 100% automatizada através da integração com o banco Asaas.",
    icon: CreditCard,
  },
  {
    title: "Gestão de Ocorrências",
    description: "Acompanhe chamados, manutenções e alertas de segurança em um dashboard unificado e priorizado.",
    icon: ShieldCheck,
  },
  {
    title: "Alta Performance",
    description: "Arquitetura serverless de última geração garantindo que o seu condomínio nunca fique fora do ar.",
    icon: Zap,
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-teal-500/30">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CRM<span className="text-teal-500">SaaS</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#solucao" className="hover:text-white transition-colors">Solução</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 hidden sm:flex">
                Já sou cliente
              </Button>
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full font-semibold px-6 shadow-lg shadow-teal-500/20 border border-teal-400/20">
                Falar com Vendas
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 md:pt-52 md:pb-32 px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 px-4 py-1.5 rounded-full mb-6 font-semibold tracking-wide">
              NOVA GERAÇÃO DE GESTÃO CONDOMINIAL
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.1] mb-8"
          >
            O controle total do seu condomínio <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              na palma da sua mão.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
          >
            Automatize cobranças, centralize a comunicação com moradores via WhatsApp e tome decisões baseadas em dados em tempo real.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white rounded-full h-14 px-8 text-lg font-bold shadow-xl shadow-teal-500/25 border border-teal-400/20 group">
                Agendar Demonstração
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            {/* Botão preparado para o Self-Service (Opção A futura) */}
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg font-bold border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white cursor-not-allowed opacity-50" title="Em breve">
              Assinar Agora
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="recursos" className="py-24 px-6 relative bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Tudo o que o síndico precisa.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Uma suíte completa de ferramentas projetadas para eliminar o trabalho manual e aumentar a segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-teal-500/30 hover:bg-slate-800/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-teal-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <Building2 className="w-6 h-6 text-teal-500" />
            <span className="text-xl font-bold tracking-tight text-white">CRM<span className="text-teal-500">SaaS</span></span>
          </div>
          <p className="text-slate-500 font-medium text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Condominium CRM SaaS. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-teal-400 transition-colors">Acesso Cliente</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
