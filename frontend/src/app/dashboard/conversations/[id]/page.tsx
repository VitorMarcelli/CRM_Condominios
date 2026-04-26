'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Send, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function ConversationDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/messages`)
        ]);
        setConversation(convRes.data);
        setMessages(msgRes.data.data || []);
      } catch (error) {
        console.error('Failed to load conversation', error);
        router.push('/dashboard/conversations');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchConversation();
  }, [id, router]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setIsSending(true);
      await api.post(`/conversations/${id}/messages`, {
        direction: 'outbound',
        body: replyText,
        // Optional: Call real WhatsApp provider here if implemented
      });
      
      setReplyText('');
      // Refresh messages
      const msgRes = await api.get(`/conversations/${id}/messages`);
      setMessages(msgRes.data.data || []);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !conversation) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 border-b border-slate-200 shrink-0 shadow-sm rounded-t-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/conversations">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {conversation.resident ? conversation.resident.fullName : conversation.externalReference}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {conversation.channel}
                <Badge variant="outline" className="text-[10px] py-0 h-4">{conversation.status}</Badge>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-6">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            const isSystem = msg.direction === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-slate-200/50 text-slate-500 text-xs py-1 px-3 rounded-full border border-slate-200/60">
                    <span className="font-medium">Sistema:</span> {msg.body}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  isOutbound 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <div className={`text-[10px] mt-2 text-right ${isOutbound ? 'text-blue-100' : 'text-slate-400'}`}>
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
            Nenhuma mensagem registrada.
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 rounded-b-xl">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input 
            placeholder="Digite sua mensagem (Mock outbound)..." 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-slate-50"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !replyText.trim()} className="bg-blue-600 hover:bg-blue-700 shrink-0">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
