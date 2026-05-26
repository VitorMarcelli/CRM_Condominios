'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Search, MoreVertical, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  status: string;
  createdAt: string;
  condominiumsCount: number;
  usersCount: number;
  planName: string;
}

export default function BackofficeDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.get('/onboarding/organizations');
        setOrganizations(response.data);
      } catch (error) {
        console.error('Error fetching organizations', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase()) || 
    org.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Organizações SaaS</h1>
          <p className="text-slate-400 mt-1">Gerencie os clientes (tenants) da sua plataforma.</p>
        </div>
        <Link href="/backoffice/new">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total de Organizações</p>
              <h3 className="text-3xl font-bold text-white mt-1">{organizations.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Lista de Clientes</h2>
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <Input 
              placeholder="Buscar por nome ou domínio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Organização</th>
                <th className="px-6 py-4 font-semibold">Plano</th>
                <th className="px-6 py-4 font-semibold">Domínio</th>
                <th className="px-6 py-4 font-semibold">Métricas</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Criado em</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Nenhuma organização encontrada.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {org.name}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">Slug: {org.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {org.planName}
                    </td>
                    <td className="px-6 py-4">
                      <a href={`https://${org.domain}`} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">
                        {org.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex flex-col gap-1">
                        <span>{org.condominiumsCount} Condomínios</span>
                        <span>{org.usersCount} Usuários</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}>
                        {org.status === 'active' ? 'Ativo' : org.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {format(new Date(org.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
