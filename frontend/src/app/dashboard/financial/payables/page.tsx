'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { 
  Wallet, Plus, Search, Filter, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, AlertCircle, Clock, 
  MoreVertical, FileText, DollarSign, Calculator
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Payable {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  category: string;
  paidAt?: string;
  interestAmount?: number;
  fineAmount?: number;
  discountAmount?: number;
  amountPaid?: number;
}

interface Metrics {
  pending: number;
  overdue: number;
  paid: number;
}

export default function PayablesPage() {
  const { user } = useAuthStore();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ pending: 0, overdue: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  // Add Form
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    dueDate: '',
    category: 'Manutenção',
  });

  // Pay Form
  const [payData, setPayData] = useState({
    paidAt: format(new Date(), 'yyyy-MM-dd'),
    interestAmount: '0',
    fineAmount: '0',
    discountAmount: '0',
    receiptUrl: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, payablesRes] = await Promise.all([
        api.get('/payables/metrics', { params: { condominiumId: user?.condominiumId } }),
        api.get('/payables', { params: { condominiumId: user?.condominiumId } })
      ]);
      setMetrics(metricsRes.data);
      setPayables(payablesRes.data);
    } catch (error) {
      console.error('Error fetching payables', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.condominiumId || user?.role === 'SUPER_ADMIN') {
      fetchData();
    }
  }, [user]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payables', {
        ...formData,
        amount: parseFloat(formData.amount),
        condominiumId: user?.condominiumId
      });
      setIsAddModalOpen(false);
      setFormData({ description: '', amount: '', dueDate: '', category: 'Manutenção' });
      fetchData();
    } catch (error) {
      console.error('Error creating payable', error);
      alert('Erro ao criar conta a pagar');
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;
    try {
      await api.post(`/payables/${selectedPayable.id}/pay`, {
        paidAt: payData.paidAt,
        interestAmount: parseFloat(payData.interestAmount) || 0,
        fineAmount: parseFloat(payData.fineAmount) || 0,
        discountAmount: parseFloat(payData.discountAmount) || 0,
        receiptUrl: payData.receiptUrl
      });
      setIsPayModalOpen(false);
      setSelectedPayable(null);
      fetchData();
    } catch (error) {
      console.error('Error paying', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'PAID') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3"/> Pago</span>;
    }
    if (new Date(dueDate) < new Date() && status !== 'PAID') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"><AlertCircle className="w-3 h-3"/> Atrasado</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Clock className="w-3 h-3"/> Pendente</span>;
  };

  const calcTotalToPay = () => {
    if (!selectedPayable) return 0;
    const base = selectedPayable.amount;
    const interest = parseFloat(payData.interestAmount) || 0;
    const fine = parseFloat(payData.fineAmount) || 0;
    const discount = parseFloat(payData.discountAmount) || 0;
    return base + interest + fine - discount;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-500" />
            Contas a Pagar
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestão financeira, vencimentos e baixas de pagamentos.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Total Pendente</h3>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white relative">
            {formatCurrency(metrics.pending)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Total Atrasado</h3>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white relative">
            {formatCurrency(metrics.overdue)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4 relative">
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Total Pago</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white relative">
            {formatCurrency(metrics.paid)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar contas..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0a0a0a]/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Vencimento</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                payables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#0a0a0a]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{item.description}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {format(parseISO(item.dueDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status, item.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status !== 'PAID' && (
                        <button 
                          onClick={() => {
                            setSelectedPayable(item);
                            setIsPayModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nova Conta a Pagar</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Ex: Conta de Energia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento</label>
                  <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option>Manutenção</option>
                  <option>Serviços</option>
                  <option>Impostos</option>
                  <option>Consumo (Água, Luz)</option>
                  <option>Outros</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium">Salvar Conta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal (Baixa com juros e comprovante) */}
      {isPayModalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0a]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Pagamento</h2>
                <p className="text-sm text-slate-500">{selectedPayable.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Valor Original</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(selectedPayable.amount)}</p>
              </div>
            </div>
            
            <form onSubmit={handlePaySubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Pagamento</label>
                  <input required type="date" value={payData.paidAt} onChange={e => setPayData({...payData, paidAt: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anexo / Comprovante (URL)</label>
                  <input type="text" placeholder="https://..." value={payData.receiptUrl} onChange={e => setPayData({...payData, receiptUrl: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0a0a0a]/50">
                <div>
                  <label className="block text-xs font-bold text-red-500 mb-1 uppercase tracking-wider">Juros (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="number" step="0.01" value={payData.interestAmount} onChange={e => setPayData({...payData, interestAmount: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-500 mb-1 uppercase tracking-wider">Multa (+)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="number" step="0.01" value={payData.fineAmount} onChange={e => setPayData({...payData, fineAmount: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider">Desconto (-)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                    <input type="number" step="0.01" value={payData.discountAmount} onChange={e => setPayData({...payData, discountAmount: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Total a Pagar</span>
                </div>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(calcTotalToPay())}
                </span>
              </div>
              
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
