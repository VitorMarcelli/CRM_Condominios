'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { dispatchGroupsService } from '@/services/dispatch-groups';
import { internalUsersService } from '@/services/internal-users';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function EditDispatchGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<{userId: string, priority: number}[]>([]);
  const [initialMembers, setInitialMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    internalUsersService.findAll().then(data => setUsers(data.data || data));
  }, []);

  useEffect(() => {
    if (groupId) {
      dispatchGroupsService.findOne(groupId).then(data => {
        setName(data.name);
        setDescription(data.description || '');
        setIsActive(data.isActive);
        
        const mappedMembers = data.members?.map((m: any) => ({
          userId: m.userId,
          priority: m.priority
        })) || [];
        
        setSelectedMembers(mappedMembers);
        setInitialMembers(mappedMembers);
        setLoading(false);
      });
    }
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatchGroupsService.update(groupId, { name, description, isActive });
      
      // Compare old and new members. A robust app would have a dedicated endpoint to sync members.
      // Here we just sequentially remove missing and add new for demonstration.
      for (const m of initialMembers) {
        const stillExists = selectedMembers.find(sm => sm.userId === m.userId);
        if (!stillExists) {
          await dispatchGroupsService.removeMember(groupId, m.userId);
        }
      }

      for (const m of selectedMembers) {
        const wasExisting = initialMembers.find(im => im.userId === m.userId);
        if (!wasExisting) {
          await dispatchGroupsService.addMember(groupId, m);
        }
      }
      
      router.push('/dashboard/dispatch-groups');
    } catch (error) {
      console.error('Failed to update group', error);
      alert('Erro ao atualizar grupo');
    } finally {
      setSaving(false);
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

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando grupo...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar Grupo de Acionamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <Label htmlFor="isActive">Grupo Ativo</Label>
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
          <Button type="submit" disabled={saving || !name}>
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
