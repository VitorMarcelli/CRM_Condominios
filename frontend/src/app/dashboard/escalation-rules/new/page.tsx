'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { escalationRulesService } from '@/services/escalation-rules';
import { dispatchGroupsService, DispatchGroup } from '@/services/dispatch-groups';
import { ArrowLeft, Save, Plus, X, Siren, Loader2, Workflow, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewEscalationRulePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('critical');
  const [dispatchGroupId, setDispatchGroupId] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatchGroupsService.findAll().then(data => setGroups(data?.data || data || []));
  }, []);

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
    setLoading(true);
    try {
      await escalationRulesService.create({
        name,
        urgencyLevel,
        dispatchGroupId: dispatchGroupId || undefined,
        triggerKeywords: keywords.length > 0 ? keywords : undefined,
        condominiumId: groups[0]?.condominiumId || '', // Simplified for this page, usually derived properly
      });
      
      toast.success('Regra de escalonamento criada com sucesso!');
      router.push('/dashboard/escalation-rules');
    } catch (error) {
      toast.error('Erro ao criar regra de escalonamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-5">
        <Link href="/dashboard/escalation-rules" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <Siren className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Nova Regra</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Configure o roteamento automático de alertas.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 col-span-1 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Regra *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ex: Problema com Elevadores" 
                className="h-14 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="urgencyLevel" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nível de Urgência *</Label>
              <select 
                id="urgencyLevel"
                className="w-full h-14 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                value={urgencyLevel}
                onChange={e => setUrgencyLevel(e.target.value)}
                required
              >
                <option value="low">Baixo (Rotineiro)</option>
                <option value="medium">Médio (Atenção)</option>
                <option value="high">Alto (Urgente)</option>
                <option value="critical">Crítico (Emergência)</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="dispatchGroupId" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grupo de Acionamento (Opcional)</Label>
              <div className="relative">
                <Workflow className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select 
                  id="dispatchGroupId"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  value={dispatchGroupId}
                  onChange={e => setDispatchGroupId(e.target.value)}
                >
                  <option value="">Nenhum grupo (Aberto)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <div>
                <Label className="text-sm font-bold text-slate-900 dark:text-white">Palavras-chave de Gatilho (Opcional)</Label>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 mb-4">A regra será ativada automaticamente se a mensagem contiver alguma dessas palavras.</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      value={keywordInput} 
                      onChange={e => setKeywordInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="Ex: vazamento, elevador, fogo" 
                      className="h-14 pl-12 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-base font-semibold placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddKeyword} 
                    className="h-14 px-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold shadow-sm"
                  >
                    Adicionar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 min-h-[40px]">
                  {keywords.map(kw => (
                    <span key={kw} className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-white/5 transition-all hover:border-red-200 dark:hover:border-red-900/50 group">
                      <Hash className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="text-slate-400 hover:text-red-500 ml-1 focus:outline-none">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && <span className="text-sm font-medium text-slate-400 dark:text-slate-500 italic py-2">Nenhuma palavra-chave. A regra terá que ser aplicada manualmente.</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 mt-8 border-t border-slate-100 dark:border-white/5">
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full sm:w-auto h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white" 
              onClick={() => router.push('/dashboard/escalation-rules')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {loading ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
