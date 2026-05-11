'use client';

import React from 'react';
import { AlertCircle, Clock, CheckCircle2, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const kpis = [
  {
    title: 'Tempo Médio de Resolução',
    value: '4h 20m',
    trend: '-12%',
    trendUp: false,
    icon: Clock,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    title: 'Ocorrências Críticas',
    value: '3',
    trend: '+2',
    trendUp: true,
    icon: AlertCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
  {
    title: 'Resolvidas (Hoje)',
    value: '18',
    trend: '+24%',
    trendUp: true,
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

export function OccurrenceKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-xl border border-slate-100 dark:border-zinc-800 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{kpi.title}</p>
              <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{kpi.value}</h4>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-medium flex items-center gap-1 ${
              kpi.trendUp ? 'text-emerald-600' : 'text-emerald-600' // Keeping it simple for demo
            }`}>
              {kpi.trendUp ? <TrendingDown className="w-3 h-3 rotate-180" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.trend}
            </span>
            <span className="text-xs text-slate-400">em relação à semana passada</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
