'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Lock, Pencil, Trash2, Users, Shield, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MODULES_MAP: Record<string, { label: string; actions: { key: string; label: string }[] }> = {
  dashboard: { label: '📊 Dashboard', actions: [{ key: 'view', label: 'Visualizar' }] },
  occurrences: {
    label: '⚠️ Ocorrências',
    actions: [
      { key: 'view', label: 'Visualizar' }, { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' }, { key: 'assign', label: 'Atribuir' },
      { key: 'resolve', label: 'Resolver' }, { key: 'close', label: 'Fechar' },
      { key: 'delete', label: 'Deletar' },
    ],
  },
  conversations: {
    label: '💬 Atendimento',
    actions: [
      { key: 'view', label: 'Visualizar' }, { key: 'assign', label: 'Atribuir' },
      { key: 'respond', label: 'Responder' }, { key: 'close', label: 'Fechar' },
    ],
  },
  alerts: {
    label: '🔔 Alertas',
    actions: [
      { key: 'view', label: 'Visualizar' }, { key: 'acknowledge', label: 'Reconhecer' },
      { key: 'dismiss', label: 'Dispensar' },
    ],
  },
  residents: {
    label: '👥 Moradores',
    actions: [
      { key: 'view', label: 'Visualizar' }, { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' }, { key: 'delete', label: 'Deletar' },
    ],
  },
  staff: {
    label: '💼 Equipe',
    actions: [
      { key: 'view', label: 'Visualizar' }, { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' },
    ],
  },
  condominiums: {
    label: '🏢 Condomínios',
    actions: [{ key: 'view', label: 'Visualizar' }, { key: 'manage', label: 'Gerenciar' }],
  },
  dispatch_groups: {
    label: '👥 Grupos',
    actions: [{ key: 'view', label: 'Visualizar' }, { key: 'manage', label: 'Gerenciar' }],
  },
  escalation_rules: {
    label: '🚨 Regras',
    actions: [{ key: 'view', label: 'Visualizar' }, { key: 'manage', label: 'Gerenciar' }],
  },
  audit_logs: {
    label: '🛡️ Auditoria',
    actions: [{ key: 'view', label: 'Visualizar' }],
  },
};

const ROLE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

const buildDefaultPerms = (): Record<string, Record<string, boolean>> => {
  const p: any = {};
  for (const [mod, cfg] of Object.entries(MODULES_MAP)) {
    p[mod] = {};
    for (const act of cfg.actions) p[mod][act.key] = false;
  }
  p.dashboard.view = true;
  return p;
};

const countPerms = (perms: any): { on: number; total: number } => {
  let on = 0, total = 0;
  for (const mod of Object.values(perms || {})) {
    for (const v of Object.values(mod as any)) { total++; if (v) on++; }
  }
  return { on, total };
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemAnim = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function RolesPage() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', color: '#3b82f6',
    permissions: buildDefaultPerms(),
  });

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/custom-roles');
      setRoles(res.data);
    } catch { toast.error('Erro ao carregar cargos.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', color: '#3b82f6', permissions: buildDefaultPerms() });
    setIsModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    const perms = buildDefaultPerms();
    if (role.permissions && typeof role.permissions === 'object') {
      for (const [mod, acts] of Object.entries(role.permissions as any)) {
        if (perms[mod]) {
          for (const [act, val] of Object.entries(acts as any)) {
            if (perms[mod][act] !== undefined) perms[mod][act] = !!val;
          }
        }
      }
    }
    setFormData({ name: role.name, description: role.description || '', color: role.color || '#3b82f6', permissions: perms });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório.'); return; }
    try {
      setIsSubmitting(true);
      if (editingRole) {
        const payload: any = { permissions: formData.permissions, description: formData.description, color: formData.color };
        if (!editingRole.isSystem) payload.name = formData.name;
        await api.put(`/custom-roles/${editingRole.id}`, payload);
        toast.success('Cargo atualizado!');
      } else {
        await api.post('/custom-roles', formData);
        toast.success('Cargo criado!');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (role: any) => {
    if (role.isSystem) return;
    if (!confirm(`Deletar o cargo "${role.name}"?`)) return;
    try {
      await api.delete(`/custom-roles/${role.id}`);
      toast.success('Cargo excluído.');
      fetchRoles();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir.'); }
  };

  const togglePerm = (mod: string, act: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [mod]: { ...prev.permissions[mod], [act]: !prev.permissions[mod][act] } },
    }));
  };

  const toggleModule = (mod: string) => {
    const acts = formData.permissions[mod];
    const allOn = Object.values(acts).every(v => v);
    const newVal: any = {};
    for (const k of Object.keys(acts)) newVal[k] = !allOn;
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [mod]: newVal } }));
  };

  const filtered = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Cargos & Permissões</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Crie cargos personalizados e defina os acessos de cada perfil.</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Cargo
        </Button>
      </motion.div>

      {/* SEARCH */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="px-2">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Buscar cargo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 rounded-[1.5rem] shadow-sm text-base focus-visible:ring-2 focus-visible:ring-blue-500" />
        </div>
      </motion.div>

      {/* ROLES GRID */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-6">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Carregando cargos...</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
          <AnimatePresence>
            {filtered.map(role => {
              const { on, total } = countPerms(role.permissions);
              return (
                <motion.div key={role.id} variants={itemAnim} layout
                  className="bg-white dark:bg-[#151515] p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all border border-slate-100 dark:border-white/5 flex flex-col relative group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: role.color || '#3b82f6' }}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {role.name}
                          {role.isSystem && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        </h3>
                        {role.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{role.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(role)} title="Editar"
                        className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => handleDelete(role)} title="Excluir"
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold">{on}/{total}</span>
                      <span className="text-xs">permissões</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{role._count?.users || 0}</span>
                      <span className="text-xs">usuários</span>
                    </div>
                  </div>

                  {/* Permission pills preview */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-white/5">
                    {Object.entries(MODULES_MAP).map(([mod, cfg]) => {
                      const modPerms = (role.permissions as any)?.[mod];
                      const hasView = modPerms?.view === true;
                      return (
                        <span key={mod} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${hasView ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 line-through'}`}>
                          {cfg.label.replace(/^[^ ]+ /, '')}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MODAL CREATE/EDIT */}
      <Dialog open={isModalOpen} onOpenChange={o => { setIsModalOpen(o); if (!o) setEditingRole(null); }}>
        <DialogContent className="sm:max-w-[640px] rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 bg-white dark:bg-[#111111] overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
              {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
            </DialogTitle>
            <p className="text-sm font-medium text-slate-500 mt-1">Defina o nome e as permissões granulares.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Color */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Cargo *</Label>
                <Input required placeholder="Ex: Porteiro Noturno" value={formData.name}
                  disabled={editingRole?.isSystem}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white disabled:opacity-60" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cor</Label>
                <div className="flex gap-2 flex-wrap pt-1">
                  {ROLE_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: c }))}
                      className={`w-9 h-9 rounded-xl transition-all ${formData.color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</Label>
              <Input placeholder="Descrição breve do cargo..." value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
            </div>

            {/* Permissions grid */}
            <div className="space-y-4 pt-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permissões por Módulo</Label>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {Object.entries(MODULES_MAP).map(([mod, cfg]) => {
                  const modPerms = formData.permissions[mod] || {};
                  const allOn = Object.values(modPerms).every(v => v);
                  return (
                    <div key={mod} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{cfg.label}</span>
                        <button type="button" onClick={() => toggleModule(mod)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${allOn ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>
                          {allOn ? 'Tudo ✓' : 'Ativar Tudo'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cfg.actions.map(act => {
                          const on = modPerms[act.key] === true;
                          return (
                            <button key={act.key} type="button" onClick={() => togglePerm(mod, act.key)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${on ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10'}`}>
                              <div className={`w-2 h-2 rounded-full ${on ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                              {act.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md hover:scale-105 transition-transform">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : editingRole ? 'Salvar Alterações' : 'Criar Cargo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
