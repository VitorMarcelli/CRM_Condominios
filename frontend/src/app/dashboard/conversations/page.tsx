'use client';

import { MessageSquare } from 'lucide-react';

export default function ConversationsEmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#080808]">
      <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#111] shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
        <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Seus Atendimentos</h2>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 text-center max-w-sm">
        Selecione uma conversa na lista ao lado para visualizar as mensagens e interagir com o contato.
      </p>
    </div>
  );
}
