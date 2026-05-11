'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dispatchGroupsService } from '@/services/dispatch-groups';
import { internalUsersService } from '@/services/internal-users';
import { ArrowLeft, Save, Plus, Trash2, ShieldAlert, Loader2, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewDispatchGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<{userId: string, priority: number}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    internalUsersService.findAll().then(data => setUsers(data.data || data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Group
      const group = await dispatchGroupsService.create({ name, description, condominiumId: users[0]?.condominiumId });
      
      // 2. Add Members
      for (const member of selectedMembers) {
        if (member.userId) {
          await dispatchGroupsService.addMember(group.id, member);
        }
      }
      
      toast.success('Grupo criado com sucesso!');
      router.push('/dashboard/dispatch-groups');
    } catch (error) {
      toast.error('Erro ao criar grupo.');
    } finally {
      setLoading(false);
    }
  };

  const addMemberSelection = () => {
    setSelectedMembers([...selectedMembers, { userId: '', priority: selectedMembers.length + 1 }]);
  };

  const removeMemberSelection = (index: number) => {
    const newMembers = [...selectedMembers];
    newMembers.splice(index, 1);
    setSelectedMembers(newMembers);
  };

  const updateMember = (index: number, field: string, value: any) => {
    const newMembers = [...selectedMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setSelectedMembers(newMembers);
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/dispatch-groups" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Novo Grupo</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Crie um grupo de acionamento para alertas.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Grupo *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ex: Equipe de Segurança" 
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="description" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Breve descrição do propósito deste grupo..." 
                className="min-h-[120px] bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Membros do Grupo</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Adicione os usuários que serão notificados.</p>
              </div>
              <Button type="button" onClick={addMemberSelection} className="h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-5 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Membro
              </Button>
            </div>
            
            {selectedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <Users2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Nenhum membro adicionado.</p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Este grupo não notificará ninguém atualmente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedMembers.map((member, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/10 transition-colors hover:border-slate-300 dark:hover:border-white/20">
                    
                    <div className="flex-1 space-y-2">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuário *</Label>
                      <select 
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        value={member.userId}
                        onChange={e => updateMember(idx, 'userId', e.target.value)}
                        required
                      >
                        <option value="">Selecione um usuário...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-32 space-y-2">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prioridade</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={member.priority} 
                        onChange={e => updateMember(idx, 'priority', parseInt(e.target.value))} 
                        required 
                        className="h-12 bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold"
                      />
                    </div>

                    <div className="flex justify-end sm:mt-6">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeMemberSelection(idx)}
                        className="h-12 w-12 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full sm:w-auto h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white" 
              onClick={() => router.push('/dashboard/dispatch-groups')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {loading ? 'Salvando...' : 'Salvar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
