'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Notice = { id: number; title: string; body: string; href: string; created_at: string; read_at: string | null };
export function NotificationBell() {
  const { user, account } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    if (!supabase || !user || !account?.active) { setNotices([]); return; }
    const { data, error } = await supabase.from('notifications').select('id,title,body,href,created_at,read_at').order('created_at', { ascending: false }).limit(100);
    if (error) { setError(true); return; }
    setError(false); setNotices(data || []);
  }, [user, account]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 30000); return () => clearInterval(timer); }, [load]);
  if (!user || !account?.active) return null;
  const unread = notices.filter(n => !n.read_at).length;
  async function markRead(id: number) {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    if (error) { setError(true); return; }
    await load();
  }
  return <Popover open={open} onOpenChange={value => { setOpen(value); if (value) void load(); }}>
    <PopoverTrigger asChild><Button size="icon" variant="outline" className="relative shrink-0" aria-label={unread ? `Notificações: ${unread} não lidas` : 'Notificações'}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread}</span>}</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[min(90vw,24rem)] p-0"><div className="border-b p-3 font-semibold">Notificações</div><div className="max-h-[60vh] overflow-y-auto">
      {error && <p className="p-3 text-sm text-destructive">Não foi possível carregar as notificações.</p>}
      {!error && !notices.length && <p className="p-3 text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>}
      {notices.map(n => <Link key={n.id} href={n.href} onClick={() => { if (!n.read_at) void markRead(n.id); setOpen(false); }} className={`block border-b p-3 text-sm hover:bg-muted ${n.read_at ? 'text-muted-foreground' : 'bg-muted/40'}`}><div className="font-semibold">{n.title}</div><p>{n.body}</p><time className="text-xs">{new Date(n.created_at).toLocaleString('pt-BR')}</time></Link>)}
    </div></PopoverContent>
  </Popover>;
}
