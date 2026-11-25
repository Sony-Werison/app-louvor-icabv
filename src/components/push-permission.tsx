'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';

const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
function keyBytes(base64: string) { const raw = atob((base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
export function PushPermission() {
 const { user, account } = useAuth();
 const [state, setState] = useState<'loading'|'enabled'|'prompt'|'blocked'|'unsupported'|'error'>('loading');
 const register = useCallback(async (prompt: boolean) => {
  if (!user || !account?.active || account.must_change_password) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !key) { setState('unsupported'); return; }
  try {
   const permission = prompt ? await Notification.requestPermission() : Notification.permission;
   if (permission !== 'granted') { setState(permission === 'denied' ? 'blocked' : 'prompt'); return; }
   const registration = await navigator.serviceWorker.register('/sw.js');
   const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
   const { data } = await supabase!.auth.getSession();
   if (!data.session) throw Error('Sem sessão');
   const response = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(subscription.toJSON()) });
   if (!response.ok) throw Error('Inscrição indisponível');
   setState('enabled');
  } catch { setState('error'); }
 }, [user, account]);
 useEffect(() => { void register(false); }, [register]);
 if (!user || !account?.active || account.must_change_password || state === 'loading' || state === 'enabled') return null;
 return <div role="status" className="flex flex-wrap items-center justify-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-sm">
  <span>{state === 'blocked' ? 'As notificações estão bloqueadas. Ative-as nas configurações do navegador para este site.' : state === 'unsupported' ? 'Notificações push indisponíveis neste navegador. No iPhone, adicione o aplicativo à Tela de Início e abra-o por lá.' : state === 'error' ? 'Não foi possível ativar as notificações neste dispositivo.' : 'Ative as notificações para receber avisos de escalas e repertórios.'}</span>
  {(state === 'prompt' || state === 'error') && <Button size="sm" variant="outline" onClick={() => void register(true)}>Ativar notificações</Button>}
 </div>;
}
