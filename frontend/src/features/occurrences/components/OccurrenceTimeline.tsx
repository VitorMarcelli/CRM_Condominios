'use client';

import React, { useState } from 'react';
import { Lock, User, Activity, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export type TimelineEvent = {
  id: string;
  type: 'message' | 'log' | 'internal_note';
  author: string;
  role?: 'admin' | 'resident' | 'system';
  content: string;
  timestamp: string;
  isInternal?: boolean;
};

interface OccurrenceTimelineProps {
  events: TimelineEvent[];
  isAdmin: boolean;
  onAddNote: (content: string, isInternal: boolean) => void;
}

export function OccurrenceTimeline({ events, isAdmin, onAddNote }: OccurrenceTimelineProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    onAddNote(noteContent, isInternal);
    setNoteContent('');
    toast.success(isInternal ? 'Nota Privada Adicionada' : 'Mensagem Enviada', {
      description: 'A timeline foi atualizada.',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Timeline da Ocorrência
        </h3>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-1 ${
                event.type === 'log' ? 'items-center' : event.role === 'admin' ? 'items-end' : 'items-start'
              }`}
            >
              {event.type === 'log' ? (
                <div className="text-xs text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-900 px-3 py-1 rounded-full flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  <span>{event.content}</span>
                  <span className="opacity-70">{event.timestamp}</span>
                </div>
              ) : event.type === 'internal_note' ? (
                <div className="flex max-w-[85%] flex-col bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-2 text-amber-700 dark:text-amber-500 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Nota Interna (Apenas Admin)</span>
                    </div>
                    <span>{event.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{event.content}</p>
                </div>
              ) : (
                <div className={`flex max-w-[85%] flex-col ${
                  event.role === 'admin' 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl rounded-tl-sm text-slate-800 dark:text-slate-100'
                } p-4 shadow-sm`}>
                  <div className={`flex items-center gap-2 mb-1 text-xs font-medium ${
                    event.role === 'admin' ? 'text-indigo-100' : 'text-slate-500 dark:text-zinc-400'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                    <span>{event.author}</span>
                    <span className="opacity-70 ml-2">{event.timestamp}</span>
                  </div>
                  <p className="text-sm">{event.content}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Digite uma mensagem ou nota..."
              className={`w-full min-h-[80px] p-3 text-sm rounded-xl border focus:ring-2 focus:outline-none resize-none transition-colors ${
                isInternal 
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 focus:ring-amber-500 dark:border-amber-800' 
                  : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-indigo-500'
              }`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${isInternal ? 'bg-amber-500' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                    <motion.div 
                      className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white"
                      animate={{ x: isInternal ? 20 : 0 }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isInternal ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500'}`}>
                  <Lock className="w-3.5 h-3.5" />
                  Nota Interna Privada
                </span>
              </label>
            )}
            
            <button
              type="submit"
              disabled={!noteContent.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {isInternal ? 'Salvar Nota' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
