'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Send, Phone, MoreVertical, Smile, Paperclip, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function safeDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateSeparator(val: any): string {
  const d = safeDate(val);
  if (!d) return '';
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function formatTime(val: any): string {
  const d = safeDate(val);
  if (!d) return '--:--';
  return format(d, 'HH:mm');
}

function shouldShowDateSeparator(current: any, previous: any): boolean {
  const c = safeDate(current);
  const p = safeDate(previous);
  if (!c) return false;
  if (!p) return true;
  return c.toDateString() !== p.toDateString();
}

function getTimestamp(msg: any): any {
  return msg.sentAt || msg.createdAt || msg.timestamp;
}

export default function ConversationDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const fetchConversation = useCallback(async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        api.get(`/conversations/${id}`),
        api.get(`/conversations/${id}/messages`)
      ]);
      setConversation(convRes.data);
      
      // Only scroll to bottom if new messages arrived
      setMessages(prev => {
        const newMsgs = msgRes.data.data || [];
        if (prev.length !== newMsgs.length) {
          setTimeout(scrollToBottom, 50);
        }
        return newMsgs;
      });
    } catch (error) {
      console.error('Failed to load conversation', error);
      if (isLoading) router.push('/dashboard/conversations');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, scrollToBottom, isLoading]);

  useEffect(() => {
    if (id) {
      fetchConversation();
      // Polling every 3 seconds
      const interval = setInterval(fetchConversation, 3000);
      return () => clearInterval(interval);
    }
  }, [id, fetchConversation]);

  const handleTakeOver = async () => {
    try {
      await api.post(`/conversations/${id}/take-over`);
      await fetchConversation();
    } catch (error) {
      console.error('Failed to take over', error);
    }
  };

  const handleResumeAi = async () => {
    try {
      await api.post(`/conversations/${id}/resume-ai`);
      await fetchConversation();
    } catch (error) {
      console.error('Failed to resume AI', error);
    }
  };

  useEffect(() => {
    if (!isLoading && messages.length > 0) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsSending(true);
      await api.post(`/conversations/${id}/messages`, {
        direction: 'outbound',
        body: replyText,
      });

      setReplyText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      const msgRes = await api.get(`/conversations/${id}/messages`);
      setMessages(msgRes.data.data || []);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  if (isLoading || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Carregando conversa...</span>
      </div>
    );
  }

  const contactName = conversation.resident?.fullName || conversation.externalReference || 'Contato';
  const initials = contactName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="w-full max-w-5xl mx-auto font-sans">
      {/* WRAPPER CARD */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>
        
        {/* CHAT HEADER */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#0d0d0d] border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl h-9 w-9 hover:bg-slate-100 dark:hover:bg-white/5">
              <Link href="/dashboard/conversations">
                <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Link>
            </Button>

            {/* CONTACT AVATAR */}
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-600/20">
                <span className="text-white text-xs font-black">{initials}</span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor(conversation.status)} ring-2 ring-white dark:ring-[#0d0d0d]`} />
            </div>

            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {contactName}
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <span className="capitalize">{conversation.channel || 'web'}</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className={`${
                  conversation.status === 'open' ? 'text-emerald-500' :
                  conversation.status === 'pending' ? 'text-amber-500' :
                  'text-slate-400'
                }`}>
                  {conversation.status === 'open' ? 'Online' :
                   conversation.status === 'pending' ? 'Aguardando' :
                   'Encerrada'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {conversation.isAiActive ? (
              <Button onClick={handleTakeOver} size="sm" className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
                Assumir Conversa
              </Button>
            ) : (
              <Button onClick={handleResumeAi} variant="outline" size="sm" className="h-8 rounded-xl border-slate-200 dark:border-white/10 font-semibold">
                Devolver para IA
              </Button>
            )}
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-slate-100 dark:hover:bg-white/5">
              <Phone className="w-4 h-4 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-slate-100 dark:hover:bg-white/5">
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50/50 dark:bg-[#080808]">
          {messages.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-1">
              {messages.map((msg, i) => {
                const isOutbound = msg.direction === 'outbound';
                const isSystem = msg.direction === 'system';
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const ts = getTimestamp(msg);
                const prevTs = prevMsg ? getTimestamp(prevMsg) : null;
                const showDate = shouldShowDateSeparator(ts, prevTs);

                // Group consecutive messages from same direction
                const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
                const isFirstInGroup = !prevMsg || prevMsg.direction !== msg.direction || showDate;
                const isLastInGroup = !nextMsg || nextMsg.direction !== msg.direction;

                return (
                  <div key={msg.id}>
                    {/* DATE SEPARATOR */}
                    {showDate && (
                      <div className="flex justify-center my-5">
                        <div className="px-4 py-1.5 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-sm text-[11px] font-bold text-slate-500 shadow-sm border border-slate-100 dark:border-white/5">
                          {formatDateSeparator(ts)}
                        </div>
                      </div>
                    )}

                    {/* SYSTEM MESSAGE */}
                    {isSystem ? (
                      <div className="flex justify-center my-3">
                        <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 text-[12px] font-medium text-slate-500 text-center leading-relaxed">
                          <span className="font-bold">Sistema:</span> {msg.body}
                        </div>
                      </div>
                    ) : (
                      /* CHAT BUBBLE */
                      <div
                        className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                        style={{
                          animation: i >= messages.length - 3 ? `bubbleIn 0.3s ease-out ${(i % 3) * 0.08}s both` : undefined,
                        }}
                      >
                        <div
                          className={`relative max-w-[75%] px-4 py-2.5 ${
                            isOutbound
                              ? `bg-blue-600 text-white ${
                                  isFirstInGroup && isLastInGroup ? 'rounded-[1.25rem]' :
                                  isFirstInGroup ? 'rounded-[1.25rem] rounded-br-md' :
                                  isLastInGroup ? 'rounded-[1.25rem] rounded-tr-md' :
                                  'rounded-[1.25rem] rounded-r-md'
                                }`
                              : `bg-white dark:bg-[#1a1a1a] text-slate-800 dark:text-slate-200 shadow-[0_1px_3px_rgb(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgb(0,0,0,0.3)] ${
                                  isFirstInGroup && isLastInGroup ? 'rounded-[1.25rem]' :
                                  isFirstInGroup ? 'rounded-[1.25rem] rounded-bl-md' :
                                  isLastInGroup ? 'rounded-[1.25rem] rounded-tl-md' :
                                  'rounded-[1.25rem] rounded-l-md'
                                }`
                          }`}
                        >
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOutbound ? 'text-blue-200' : 'text-slate-400'}`}>
                            <span className="text-[10px] font-medium tabular-nums">
                              {formatTime(ts)}
                            </span>
                            {isOutbound && (
                              <CheckCheck className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-400">Nenhuma mensagem ainda</p>
              <p className="text-xs text-slate-400/70">As mensagens aparecerão aqui.</p>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 px-4 py-3 bg-white dark:bg-[#0d0d0d] border-t border-slate-100 dark:border-white/5">
          {conversation.isAiActive ? (
            <div className="max-w-3xl mx-auto flex items-center justify-center p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
              <p className="text-sm font-semibold">Conversa sendo gerenciada pela Inteligência Artificial.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-end gap-2 max-w-3xl mx-auto">
              <button type="button" className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Mensagem..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onInput={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  rows={1}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-[#151515] border-0 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
                  style={{ maxHeight: '160px' }}
                />
              </div>

              <button type="button" className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  replyText.trim()
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 active:scale-95'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ANIMATION KEYFRAMES */}
      <style jsx>{`
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
