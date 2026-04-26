'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { escalationRulesService, EscalationRule } from '@/services/escalation-rules';
import { Siren, Plus, Edit, Hash, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function EscalationRulesPage() {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await escalationRulesService.findAll();
      setRules(response);
    } catch (error) {
      console.error('Failed to fetch escalation rules', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Siren className="w-6 h-6 text-red-500" />
            Regras de Escalonamento
          </h1>
          <p className="text-slate-500 mt-1">Configure gatilhos e direcione alertas operacionais.</p>
        </div>
        <Link href="/dashboard/escalation-rules/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Nova Regra
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando regras...</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-2" />
            <p>Nenhuma regra cadastrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome da Regra</th>
                  <th className="px-6 py-4">Urgência</th>
                  <th className="px-6 py-4">Palavras-chave</th>
                  <th className="px-6 py-4">Grupo Vinculado</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                    <td className="px-6 py-4">{getUrgencyBadge(rule.urgencyLevel)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {rule.triggerKeywords?.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            <Hash className="w-3 h-3 mr-0.5 inline" /> {kw}
                          </Badge>
                        )) || <span className="text-slate-400 text-xs">Nenhuma</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {rule.dispatchGroup?.name || <span className="text-slate-400">Nenhum</span>}
                    </td>
                    <td className="px-6 py-4">
                      {rule.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/escalation-rules/${rule.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                      </Link>
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
