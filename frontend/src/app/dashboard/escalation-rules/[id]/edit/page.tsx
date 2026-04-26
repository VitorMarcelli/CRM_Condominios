'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { escalationRulesService } from '@/services/escalation-rules';
import { dispatchGroupsService, DispatchGroup } from '@/services/dispatch-groups';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditEscalationRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [name, setName] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('critical');
  const [dispatchGroupId, setDispatchGroupId] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatchGroupsService.findAll().then(data => setGroups(data));
  }, []);

  useEffect(() => {
    if (ruleId) {
      escalationRulesService.findOne(ruleId).then(data => {
        setName(data.name);
        setUrgencyLevel(data.urgencyLevel);
        setDispatchGroupId(data.dispatchGroupId || '');
        setKeywords(data.triggerKeywords || []);
        setIsActive(data.isActive);
        setLoading(false);
      });
    }
  }, [ruleId]);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toLowerCase())) {
      setKeywords([...keywords, keywordInput.trim().toLowerCase()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await escalationRulesService.update(ruleId, {
        name,
        urgencyLevel,
        dispatchGroupId: dispatchGroupId || undefined,
        triggerKeywords: keywords.length > 0 ? keywords : undefined,
        isActive
      });
      
      router.push('/dashboard/escalation-rules');
    } catch (error) {
      console.error('Failed to update rule', error);
      alert('Erro ao atualizar regra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando regra...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Editar Regra de Escalonamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 col-span-2">
            <div>
              <Label htmlFor="name">Nome da Regra *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="urgencyLevel">Nível de Urgência *</Label>
              <select 
                id="urgencyLevel"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={urgencyLevel}
                onChange={e => setUrgencyLevel(e.target.value)}
                required
              >
                <option value="low">Baixo</option>
                <option value="medium">Médio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dispatchGroupId">Grupo de Acionamento (Opcional)</Label>
              <select 
                id="dispatchGroupId"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={dispatchGroupId}
                onChange={e => setDispatchGroupId(e.target.value)}
              >
                <option value="">Nenhum grupo específico</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 col-span-2 border-t border-slate-100 pt-4">
            <div>
              <Label>Palavras-chave de Gatilho (Opcional)</Label>
              <div className="flex gap-2 mb-3">
                <Input 
                  value={keywordInput} 
                  onChange={e => setKeywordInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  placeholder="Ex: vazamento, travado, fogo" 
                />
                <Button type="button" onClick={handleAddKeyword} variant="secondary">Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {keywords.length === 0 && <span className="text-sm text-slate-400">Nenhuma palavra-chave adicionada.</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4 col-span-2 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
              <Label htmlFor="isActive">Regra Ativa</Label>
            </div>
          </div>
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
