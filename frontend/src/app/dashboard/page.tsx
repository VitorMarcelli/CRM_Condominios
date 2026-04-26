'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboard';
import { Users, AlertTriangle, MessageSquare, Bell, Clock, ShieldAlert, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando painel...</div>;
  if (!metrics) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
          <p className="text-slate-500 mt-1">Acompanhamento operacional em tempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Ocorrências Abertas</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{metrics.totalOpenOccurrences}</div>
          <div className="mt-2 text-sm text-slate-500">{metrics.totalCriticalOccurrences} críticas</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Alertas Ativos</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Bell className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{metrics.totalActiveAlerts}</div>
          <div className="mt-2 text-sm text-slate-500">Aguardando reconhecimento</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Conversas em Aberto</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MessageSquare className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{metrics.totalOpenConversations}</div>
          <div className="mt-2 text-sm text-green-600 flex items-center gap-1">Operando normalmente</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Moradores Ativos</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{metrics.totalResidents}</div>
          <div className="mt-2 text-sm text-slate-500">Na base de dados</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Últimas Ocorrências</h2>
            <Link href="/dashboard/occurrences">
              <Button variant="ghost" size="sm" className="text-blue-600">Ver todas</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {metrics.recentOccurrences.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma ocorrência recente.</p>
            ) : (
              metrics.recentOccurrences.map((occ: any) => (
                <div key={occ.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{occ.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{occ.category?.name || 'Sem categoria'} &bull; {new Date(occ.openedAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <Badge variant={occ.priority === 'critical' ? 'destructive' : 'outline'} className="capitalize">{occ.priority}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Alertas Recentes</h2>
            <Link href="/dashboard/alerts">
              <Button variant="ghost" size="sm" className="text-blue-600">Ver todos</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {metrics.recentAlerts.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum alerta recente.</p>
            ) : (
              metrics.recentAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{alert.occurrence?.title || 'Alerta do Sistema'}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(alert.triggeredAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge className="capitalize" variant={alert.status === 'triggered' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
