'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dispatchGroupsService, DispatchGroup } from '@/services/dispatch-groups';
import { Users2, Plus, Edit, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DispatchGroupsPage() {
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await dispatchGroupsService.findAll();
      setGroups(response);
    } catch (error) {
      console.error('Failed to fetch dispatch groups', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-blue-600" />
            Grupos de Acionamento
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os grupos de usuários para escalonamento de alertas.</p>
        </div>
        <Link href="/dashboard/dispatch-groups/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Grupo
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-2" />
            <p>Nenhum grupo de acionamento cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nome do Grupo</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Membros</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{group.name}</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{group.description || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {group.members?.length || 0} membro(s)
                    </td>
                    <td className="px-6 py-4">
                      {group.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/dispatch-groups/${group.id}/edit`}>
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
