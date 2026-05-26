'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboard';
import { Users, AlertTriangle, MessageSquare, Bell, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 250, damping: 25 } }
} as Variants;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Sincronizando painel de controle...</p>
    </div>
  );

  if (!metrics) return (
    <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-[2rem] border border-red-100 dark:border-red-900/50 mt-10">
      <p className="text-red-600 dark:text-red-400 font-bold">Erro de conexão ao carregar o dashboard.</p>
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <motion.div variants={item} className="flex flex-col gap-1 px-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Panorama</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Controle total da sua operação em tempo real.</p>
      </motion.div>

      {/* 🧩 BENTO GRID - ASYMMETRICAL & CLICKABLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[160px] md:auto-rows-[180px]">
        
        {/* HERO CARD: Ocorrências Críticas (Span 2x2) */}
        <Link href="/dashboard/occurrences" className="col-span-1 md:col-span-2 row-span-2 block group outline-none">
          <motion.div 
            variants={item} 
            whileHover={{ scale: 0.985 }} 
            whileTap={{ scale: 0.97 }} 
            className="h-full bg-blue-600 dark:bg-blue-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20 flex flex-col justify-between"
          >
            {/* Visual Depth: Background Blur Blob */}
            <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl group-hover:scale-125 group-hover:bg-white/20 transition-all duration-1000 ease-out pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-blue-600 transition-colors border border-white/10">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-7xl md:text-8xl font-black tracking-tighter leading-none mb-2">{metrics.totalCriticalOccurrences}</h2>
              <p className="text-2xl md:text-3xl font-bold text-blue-50 tracking-tight">Ocorrências Críticas</p>
              <p className="text-blue-200/90 mt-3 text-sm md:text-base max-w-[85%] font-medium leading-relaxed">
                Requerem atenção imediata da administração do condomínio.
              </p>
            </div>
          </motion.div>
        </Link>

        {/* METRIC CARD 1: Alertas */}
        <Link href="/dashboard/alerts" className="block group outline-none">
          <motion.div 
            variants={item} 
            whileHover={{ scale: 0.97 }} 
            whileTap={{ scale: 0.95 }} 
            className="h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0" />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{metrics.totalActiveAlerts}</h2>
              <p className="font-semibold text-slate-500 dark:text-slate-400 mt-1">Alertas Ativos</p>
            </div>
          </motion.div>
        </Link>

        {/* METRIC CARD 2: Conversas */}
        <Link href="/dashboard/chat" className="block group outline-none">
          <motion.div 
            variants={item} 
            whileHover={{ scale: 0.97 }} 
            whileTap={{ scale: 0.95 }} 
            className="h-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0" />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{metrics.totalOpenConversations}</h2>
              <p className="font-semibold text-slate-500 dark:text-slate-400 mt-1">Sessões de Chat</p>
            </div>
          </motion.div>
        </Link>

        {/* WIDE CARD: Moradores (Span 2) */}
        <Link href="/dashboard/residents" className="col-span-1 md:col-span-2 block group outline-none">
          <motion.div 
            variants={item} 
            whileHover={{ scale: 0.985 }} 
            whileTap={{ scale: 0.97 }} 
            className="h-full bg-slate-900 dark:bg-slate-950 rounded-[2rem] border border-slate-800 p-8 shadow-xl flex items-center justify-between relative overflow-hidden"
          >
            {/* Dark background gradient effect */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/30 via-slate-900 to-slate-900 pointer-events-none group-hover:opacity-60 transition-opacity duration-700" />
            
            <div className="relative z-10 flex flex-col justify-center h-full">
              <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-xs">Base de Dados</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">Moradores Ativos</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">{metrics.totalResidents}</span>
                <span className="text-slate-500 font-medium">registrados</span>
              </div>
            </div>
            <div className="relative z-10 w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-blue-600 transition-colors duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* 📑 LIST SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* LIST 1: Últimas Ocorrências */}
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ocorrências Recentes</h2>
            <Link href="/dashboard/occurrences" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Ver todas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-4 flex-1">
            {metrics.recentOccurrences.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5 opacity-50" />
                </div>
                <p className="font-medium">Nenhuma ocorrência registrada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.recentOccurrences.map((occ: any, i: number) => (
                  <Link href={`/dashboard/occurrences/${occ.id}`} key={occ.id}>
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.05) }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{occ.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-500">
                          <span className="bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                            {occ.category?.name || 'Sem categoria'}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(occ.openedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</span>
                        </div>
                      </div>
                      <Badge variant={occ.priority === 'critical' ? 'destructive' : 'secondary'} className="self-start sm:self-auto capitalize rounded-xl px-3 py-1 font-bold">
                        {occ.priority}
                      </Badge>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* LIST 2: Alertas Recentes */}
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Timeline de Alertas</h2>
            <Link href="/dashboard/alerts" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              Central <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-4 flex-1">
            {metrics.recentAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 opacity-50" />
                </div>
                <p className="font-medium">Nenhum alerta recente.</p>
              </div>
            ) : (
              <div className="space-y-2 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent dark:before:from-slate-800 dark:before:via-slate-800">
                {metrics.recentAlerts.map((alert: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.05) }}
                    key={alert.id} 
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    {/* Timeline Node */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 dark:group-hover:bg-blue-900/50 dark:group-hover:border-blue-800">
                      <Bell className="w-4 h-4" />
                    </div>
                    {/* Card Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-default">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="capitalize text-[10px] px-2 py-0 h-5" variant={alert.status === 'triggered' ? 'destructive' : 'outline'}>{alert.status}</Badge>
                        <time className="text-[11px] font-bold text-slate-400">{new Date(alert.triggeredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}</time>
                      </div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
                        {alert.occurrence?.title || 'Alerta do Sistema'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
