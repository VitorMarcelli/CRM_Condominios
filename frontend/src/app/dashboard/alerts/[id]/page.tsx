'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { alertsService, Alert } from '@/services/alerts';
import { AlertTriangle, Bell, Clock, ArrowLeft, CheckCircle, XCircle, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;
  
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlert = async () => {
    try {
      setLoading(true);
      const data = await alertsService.findOne(alertId);
      setAlert(data);
    } catch (error) {
      console.error('Failed to fetch alert', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alertId) fetchAlert();
  }, [alertId]);

  const handleAcknowledge = async () => {
    try {
      await alertsService.acknowledge(alertId);
      fetchAlert();
    } catch (error) {
      console.error('Failed to acknowledge alert', error);
    }
  };

  const handleClose = async () => {
    try {
      await alertsService.close(alertId);
      fetchAlert();
    } catch (error) {
      console.error('Failed to close alert', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes do alerta...</div>;
  if (!alert) return <div className="p-8 text-center text-slate-500">Alerta não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Detalhes do Alerta
          </h1>
          <p className="text-slate-500 mt-1">Acionamento gerado em {new Date(alert.triggeredAt).toLocaleString('pt-BR')}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {alert.status === 'triggered' && (
            <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleAcknowledge}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Reconhecer Alerta
            </Button>
          )}
          {alert.status !== 'closed' && (
            <Button variant="outline" onClick={handleClose}>
              <XCircle className="w-4 h-4 mr-2" /> Encerrar Alerta
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações da Ocorrência</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-500">Título</span>
                <p className="text-base text-slate-900">{alert.occurrence?.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Descrição Original</span>
                <p className="text-base text-slate-900 bg-slate-50 p-3 rounded-md mt-1">{alert.occurrence?.description || 'Nenhuma descrição detalhada.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-500">Status da Ocorrência</span>
                  <p className="text-base text-slate-900 capitalize">{alert.occurrence?.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500">Link</span>
                  <p className="mt-1">
                    <Link href={`/dashboard/occurrences?occurrenceId=${alert.occurrenceId}`} className="text-blue-600 hover:underline inline-flex items-center">
                      Ir para ocorrência <ArrowLeft className="w-3 h-3 ml-1 rotate-135" />
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Destinatários do Alerta
            </h2>
            {alert.recipients && alert.recipients.length > 0 ? (
              <div className="space-y-3">
                {alert.recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-md bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{recipient.user?.fullName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3" /> {recipient.channel} &bull; {recipient.user?.phone || recipient.user?.email}
                      </p>
                    </div>
                    <Badge variant={recipient.status === 'pending' ? 'outline' : 'default'} className={recipient.status === 'sent' ? 'bg-emerald-500' : ''}>
                      {recipient.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Nenhum destinatário vinculado a este alerta.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Status do Alerta</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-500">Status Atual</span>
                <div className="mt-1">
                  <Badge className="text-sm py-1 capitalize" variant={alert.status === 'triggered' ? 'destructive' : 'default'}>
                    {alert.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Urgência</span>
                <div className="mt-1">
                  <Badge className="text-sm py-1 capitalize" variant="outline">{alert.urgencyLevel}</Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-500">Gatilho</span>
                <p className="text-sm text-slate-900">{alert.triggerType}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-500">Criado em</span>
                <p className="text-sm text-slate-900">{new Date(alert.triggeredAt).toLocaleString('pt-BR')}</p>
              </div>
              {alert.acknowledgedAt && (
                <div>
                  <span className="text-sm font-medium text-slate-500">Reconhecido em</span>
                  <p className="text-sm text-slate-900">{new Date(alert.acknowledgedAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
              {alert.closedAt && (
                <div>
                  <span className="text-sm font-medium text-slate-500">Encerrado em</span>
                  <p className="text-sm text-slate-900">{new Date(alert.closedAt).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
