'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dispatchGroupsService } from '@/services/dispatch-groups';
import { internalUsersService } from '@/services/internal-users';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
        await dispatchGroupsService.addMember(group.id, member);
      }
      
      router.push('/dashboard/dispatch-groups');
    } catch (error) {
      console.error('Failed to create group', error);
      alert('Erro ao criar grupo');
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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Grupo de Acionamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Emergências Gerais" />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição do propósito do grupo..." />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-900">Membros do Grupo</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMemberSelection}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Membro
            </Button>
          </div>
          
          {selectedMembers.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum membro adicionado. O grupo não notificará ninguém.</p>
          ) : (
            <div className="space-y-3">
              {selectedMembers.map((member, idx) => (
                <div key={idx} className="flex items-end gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">Usuário</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                  <div className="w-24">
                    <Label className="text-xs text-slate-500">Prioridade</Label>
                    <Input type="number" min="1" value={member.priority} onChange={e => updateMember(idx, 'priority', parseInt(e.target.value))} required />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeMemberSelection(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading || !name}>
            <Save className="w-4 h-4 mr-2" /> {loading ? 'Salvando...' : 'Salvar Grupo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
