'use client';

import { useState, useEffect } from 'react';
import { auditService } from '@/services/audit';
import { ShieldCheck, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.findAll({ limit: 50 });
      setLogs(data.data || data); // handle standard pagination response or direct array
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-700" />
            Auditoria Avançada
          </h1>
          <p className="text-slate-500 mt-1">Rastreabilidade completa das ações no sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum log encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Ator</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Entidade</th>
                  <th className="px-6 py-4">Detalhes (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">{log.actorType}</Badge>
                      <div className="text-xs text-slate-500 mt-1">{log.actorId || 'Sistema'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{log.entityType}</Badge>
                      <div className="text-xs text-slate-400 mt-1 truncate w-24" title={log.entityId}>{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.metadata ? (
                        <pre className="text-xs bg-slate-100 p-2 rounded text-slate-600 max-w-xs overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 text-xs">Sem metadados</span>
                      )}
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
