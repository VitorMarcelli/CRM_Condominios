'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { alertsService, Alert } from '@/services/alerts';
import { AlertTriangle, Bell, Clock, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (urgencyFilter !== 'all') params.urgencyLevel = urgencyFilter;
      
      if (periodFilter !== 'all') {
        const date = new Date();
        if (periodFilter === 'today') date.setHours(0, 0, 0, 0);
        if (periodFilter === '7d') date.setDate(date.getDate() - 7);
        if (periodFilter === '30d') date.setDate(date.getDate() - 30);
        params.startDate = date.toISOString();
      }

      const response = await alertsService.findAll(params);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, urgencyFilter, periodFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsService.acknowledge(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert', error);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await alertsService.close(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to close alert', error);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const map: Record<string, { label: string, className: string }> = {
      critical: { label: 'Crítico', className: 'bg-red-100 text-red-800' },
      high: { label: 'Alto', className: 'bg-orange-100 text-orange-800' },
      medium: { label: 'Médio', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baixo', className: 'bg-blue-100 text-blue-800' },
    };
    const mapped = map[urgency] || { label: urgency, className: 'bg-slate-100 text-slate-800' };
    return <Badge className={mapped.className} variant="outline">{mapped.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string, className: string }> = {
      triggered: { label: 'Disparado', className: 'bg-red-500 text-white border-transparent' },
      acknowledged: { label: 'Reconhecido', className: 'bg-yellow-500 text-white border-transparent' },
      closed: { label: 'Encerrado', className: 'bg-slate-500 text-white border-transparent' },
    };
    const mapped = map[status] || { label: status, className: 'bg-slate-100 text-slate-800 border-transparent' };
    return <Badge className={mapped.className}>{mapped.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-600" />
            Alertas Operacionais
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os alertas críticos e acionamentos.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="triggered">Disparados</SelectItem>
              <SelectItem value="acknowledged">Reconhecidos</SelectItem>
              <SelectItem value="closed">Encerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Urgência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Urgências</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="high">Alto</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o Período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
            <p>Nenhum alerta encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Ocorrência</th>
                  <th className="px-6 py-4">Urgência</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Destinatários</th>
                  <th className="px-6 py-4">Data do Disparo</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{alert.occurrence?.title || 'N/A'}</div>
                      <div className="text-slate-500 text-xs mt-1">{alert.condominium?.name}</div>
                    </td>
                    <td className="px-6 py-4">{getUrgencyBadge(alert.urgencyLevel)}</td>
                    <td className="px-6 py-4">{getStatusBadge(alert.status)}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      <div>{alert.recipients?.length || 0} pessoa(s)</div>
                      <div className="text-slate-400 mt-0.5">
                        {Array.from(new Set(alert.recipients?.map(r => r.channel) || [])).join(', ') || 'Nenhum'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.triggeredAt).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/alerts/${alert.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                        </Link>
                        {alert.status === 'triggered' && (
                          <Button variant="default" size="sm" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => handleAcknowledge(alert.id)}>
                            <AlertTriangle className="w-4 h-4 mr-1" /> Reconhecer
                          </Button>
                        )}
                        {alert.status !== 'closed' && (
                          <Button variant="outline" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => handleClose(alert.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Encerrar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
