'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, ShieldCheck, Mail, Phone, Loader2, UserX, Pencil, Power } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const PERMISSION_KEYS = [
  { key: 'occurrences', label: 'Ocorrências' },
  { key: 'conversations', label: 'Atendimento' },
  { key: 'alerts', label: 'Alertas' },
  { key: 'residents', label: 'Moradores' },
  { key: 'dispatch_groups', label: 'Grupos de Despacho' },
  { key: 'escalation_rules', label: 'Regras de Escalação' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
} as Variants;

const defaultPerms = () => PERMISSION_KEYS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {} as Record<string, boolean>);

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    condominiumId: '', customRoleId: '', fullName: '', email: '', phone: '', role: 'ATENDENTE', password: '',
    permissions: defaultPerms(),
  });

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editData, setEditData] = useState({
    condominiumId: '', customRoleId: '', fullName: '', email: '', phone: '', role: '',
    permissions: defaultPerms(),
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const params = user?.condominiumId ? { condominiumId: user.condominiumId } : {};
      const res = await api.get('/internal-users', { params });
      setStaff(res.data.data || res.data || []);
    } catch { toast.error('Erro ao carregar equipe.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchStaff();
    if (user?.condominiumId) setFormData(p => ({ ...p, condominiumId: user.condominiumId || '' }));
  }, [user]);

  const fetchCondominiums = () => {
    if (isAdmin && condominiums.length === 0) {
      api.get('/condominiums').then(r => setCondominiums(r.data.data || r.data || [])).catch(console.error);
    }
  };

  const fetchCustomRoles = () => {
    if (customRoles.length === 0) {
      api.get('/custom-roles').then(r => setCustomRoles(r.data || [])).catch(console.error);
    }
  };

  useEffect(() => { if (isAddOpen || isEditOpen) { fetchCondominiums(); fetchCustomRoles(); } }, [isAddOpen, isEditOpen]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password || (!formData.role && !formData.customRoleId)) {
      toast.error('Preencha todos os campos obrigatórios.'); return;
    }
    try {
      setIsSubmitting(true);
      const payload: any = { ...formData };
      if (!payload.condominiumId || payload.condominiumId === 'none') delete payload.condominiumId;
      if (payload.customRoleId) {
        if (!payload.role) payload.role = 'ATENDENTE'; // fallback for enum validation
      } else {
        delete payload.customRoleId;
      }
      if (!payload.phone) delete payload.phone;
      await api.post('/internal-users', payload);
      toast.success('Membro da equipe criado com sucesso!');
      setIsAddOpen(false);
      setFormData({ condominiumId: user?.condominiumId || '', customRoleId: '', fullName: '', email: '', phone: '', role: 'ATENDENTE', password: '', permissions: defaultPerms() });
      fetchStaff();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao criar funcionário.'); }
    finally { setIsSubmitting(false); }
  };

  const openEdit = (person: any) => {
    setEditTarget(person);
    const perms = (person.permissions && typeof person.permissions === 'object') ? person.permissions : defaultPerms();
    setEditData({
      condominiumId: person.condominiumId || '',
      customRoleId: person.customRoleId || '',
      fullName: person.fullName,
      email: person.email,
      phone: person.phone || '',
      role: person.role,
      permissions: { ...defaultPerms(), ...perms },
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      setIsSubmitting(true);
      const payload: any = { ...editData };
      if (!payload.condominiumId || payload.condominiumId === 'none') payload.condominiumId = null;
      if (payload.customRoleId) {
        delete payload.role; // Don't send role when using customRoleId
      } else {
        delete payload.customRoleId;
      }
      if (!payload.phone) delete payload.phone;
      await api.put(`/internal-users/${editTarget.id}`, payload);
      toast.success('Usuário atualizado com sucesso!');
      setIsEditOpen(false);
      setEditTarget(null);
      fetchStaff();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao atualizar.'); }
    finally { setIsSubmitting(false); }
  };

  const toggleStatus = async (person: any) => {
    const newStatus = person.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/internal-users/${person.id}/status`, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Usuário ativado.' : 'Usuário desativado.');
      fetchStaff();
    } catch { toast.error('Erro ao alterar status.'); }
  };

  const handleDelete = async (person: any) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o funcionário ${person.fullName}?`)) return;
    try {
      await api.delete(`/internal-users/${person.id}`);
      toast.success('Funcionário excluído com sucesso.');
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir funcionário.');
    }
  };

  const filteredStaff = staff.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (person: any) => {
    if (person.customRole) {
      return <Badge className="text-white font-bold rounded-xl border-none" style={{ backgroundColor: person.customRole.color || '#3b82f6' }}>{person.customRole.name}</Badge>;
    }
    const map: Record<string, { bg: string; label: string }> = {
      SUPER_ADMIN: { bg: 'bg-red-500', label: 'Global Admin' },
      ADMIN: { bg: 'bg-orange-500', label: 'Administrador' },
      SINDICO: { bg: 'bg-blue-500', label: 'Síndico' },
      ZELADOR: { bg: 'bg-emerald-500', label: 'Zelador' },
      ATENDENTE: { bg: 'bg-indigo-500', label: 'Atendente' },
      RESPONSAVEL_OPERACIONAL: { bg: 'bg-teal-500', label: 'Operacional' },
    };
    const r = map[person.role] || { bg: 'bg-slate-500', label: person.role };
    return <Badge className={`${r.bg} text-white font-bold rounded-xl border-none`}>{r.label}</Badge>;
  };

  const PermToggle = ({ permKey, perms, onChange }: { permKey: string; perms: Record<string,boolean>; onChange: (k: string, v: boolean) => void }) => {
    const p = PERMISSION_KEYS.find(pk => pk.key === permKey);
    if (!p) return null;
    const on = perms[permKey] !== false;
    return (
      <button type="button" onClick={() => onChange(permKey, !on)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${on ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-500/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10 line-through'}`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${on ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
        {p.label}
      </button>
    );
  };

  const renderFormFields = (data: any, setData: (fn: (p: any) => any) => void, isEdit: boolean) => (
    <>
      {isAdmin && (
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio Vínculo</Label>
          <Select value={data.condominiumId} onValueChange={val => setData((p: any) => ({ ...p, condominiumId: val }))}>
            <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
              <SelectValue placeholder="Conta Global (Sem condomínio)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl max-h-60">
              <SelectItem value="none" className="italic text-slate-500">Acesso Global (Todos)</SelectItem>
              {condominiums.map(c => <SelectItem key={c.id} value={c.id} className="font-semibold text-slate-700 dark:text-slate-300">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</Label>
        <Input required placeholder="Ex: Carlos Silva" value={data.fullName}
          onChange={e => setData((p: any) => ({ ...p, fullName: e.target.value }))}
          className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail {isEdit ? '' : '(Acesso) *'}</Label>
          <Input required type="email" placeholder="carlos@email.com" value={data.email}
            onChange={e => setData((p: any) => ({ ...p, email: e.target.value }))}
            className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone</Label>
          <Input placeholder="(11) 99999-9999" value={data.phone}
            onChange={e => setData((p: any) => ({ ...p, phone: e.target.value }))}
            className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
        </div>
      </div>
      <div className={`grid grid-cols-1 ${isEdit ? '' : 'sm:grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo *</Label>
          {customRoles.length > 0 ? (
            <Select value={data.customRoleId || data.role} onValueChange={val => {
              const found = customRoles.find((r: any) => r.id === val);
              if (found) {
                setData((p: any) => ({ ...p, customRoleId: found.id }));
              } else {
                setData((p: any) => ({ ...p, customRoleId: '', role: val }));
              }
            }}>
              <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl max-h-60">
                {customRoles.map((r: any) => (
                  <SelectItem key={r.id} value={r.id} className="font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: r.color }} />
                      {r.name} {r.isSystem ? '🔒' : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={data.role} onValueChange={val => setData((p: any) => ({ ...p, role: val }))} required>
              <SelectTrigger className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800 shadow-xl max-h-60">
                {user?.role === 'SUPER_ADMIN' && <SelectItem value="SUPER_ADMIN" className="font-semibold text-red-500">Super Admin</SelectItem>}
                {isAdmin && <SelectItem value="ADMIN" className="font-semibold text-orange-500">Administrador</SelectItem>}
                <SelectItem value="SINDICO" className="font-semibold text-blue-500">Síndico</SelectItem>
                <SelectItem value="ZELADOR" className="font-semibold text-emerald-500">Zelador</SelectItem>
                <SelectItem value="ATENDENTE" className="font-semibold text-indigo-500">Atendente</SelectItem>
                <SelectItem value="RESPONSAVEL_OPERACIONAL" className="font-semibold text-teal-500">Operacional</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {!isEdit && (
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha Inicial *</Label>
            <Input required type="password" minLength={8} placeholder="Mínimo 8 caracteres" value={data.password}
              onChange={e => setData((p: any) => ({ ...p, password: e.target.value }))}
              className="h-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white" />
          </div>
        )}
      </div>
      {/* Permissions */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acessos do Sistema</Label>
        <p className="text-xs text-slate-400">Defina quais módulos este usuário poderá acessar.</p>
        <div className="flex flex-wrap gap-2">
          {PERMISSION_KEYS.map(pk => (
            <PermToggle key={pk.key} permKey={pk.key} perms={data.permissions}
              onChange={(k, v) => setData((p: any) => ({ ...p, permissions: { ...p.permissions, [k]: v } }))} />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">Equipe</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Gestão de funcionários, atendentes e administradores.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95" />
          }>
            <Plus className="w-5 h-5 mr-2" /> Novo Funcionário
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px] rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 bg-white dark:bg-[#111111] overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Novo Membro da Equipe</DialogTitle>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Cadastre um funcionário e defina suas permissões no sistema.</p>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-5">
              {renderFormFields(formData, setFormData, false)}
              <DialogFooter className="pt-4 mt-6 border-t border-slate-100 dark:border-white/5">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md hover:scale-105 transition-transform">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Salvando...' : 'Cadastrar Funcionário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={o => { setIsEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[540px] rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 bg-white dark:bg-[#111111] overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Editar Usuário</DialogTitle>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">As alterações serão salvas no banco de dados imediatamente.</p>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {renderFormFields(editData, setEditData, true)}
            <DialogFooter className="pt-4 mt-6 border-t border-slate-100 dark:border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md hover:scale-105 transition-transform">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TOOLBAR */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 rounded-[1.5rem] shadow-sm text-base focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0" />
        </div>
        <Button variant="outline" className="h-14 px-6 rounded-[1.5rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#151515] shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-600 dark:text-slate-300">
          <Filter className="w-5 h-5 mr-2" /> Filtros
        </Button>
      </motion.div>

      {/* STAFF LIST */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-6">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Carregando equipe...</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
          <AnimatePresence>
            {filteredStaff.length > 0 ? (
              filteredStaff.map(person => (
                <motion.div key={person.id} variants={item} layout
                  className="bg-white dark:bg-[#151515] p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all border border-slate-100 dark:border-white/5 flex flex-col relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${person.status === 'active' ? 'from-blue-500 to-indigo-600' : 'from-slate-400 to-slate-500'} text-white flex items-center justify-center font-bold text-xl shadow-lg ${person.status === 'active' ? 'shadow-blue-500/20' : 'shadow-slate-400/20'}`}>
                        {person.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{person.fullName}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          {getRoleBadge(person)}
                          {person.status === 'inactive' && <Badge className="bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold rounded-xl border-none text-[10px]">Inativo</Badge>}
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {person.id !== user?.id && (
                          <button onClick={() => handleDelete(person)} title="Excluir"
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(person)} title="Editar"
                          className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {person.id !== user?.id && (
                          <button onClick={() => toggleStatus(person)} title={person.status === 'active' ? 'Desativar' : 'Ativar'}
                            className={`p-2 rounded-xl transition-colors ${person.status === 'active' ? 'hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500'}`}>
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate font-medium">{person.email}</span>
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="font-medium">{person.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="font-medium">{person.condominium?.name || 'Acesso Global'}</span>
                    </div>
                  </div>
                  {/* Permission pills */}
                  {person.permissions && typeof person.permissions === 'object' && Object.keys(person.permissions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                      {PERMISSION_KEYS.map(pk => {
                        const on = (person.permissions as Record<string, boolean>)[pk.key] !== false;
                        return (
                          <span key={pk.key} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${on ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 line-through'}`}>
                            {pk.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div variants={item} className="col-span-full p-12 text-center bg-slate-50 dark:bg-[#151515] rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                <UserX className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum funcionário encontrado</h3>
                <p className="text-slate-500 mt-1">Cadastre o primeiro membro da sua equipe.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
