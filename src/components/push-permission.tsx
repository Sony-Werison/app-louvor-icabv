'use client';
import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
function keyBytes(base64: string) { const raw = atob((base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
const PushContext = createContext({ enabled: false, busy: true, toggle: async () => {} });
export const usePushNotifications = () => useContext(PushContext);
export function PushPermission({ children }: { children: ReactNode }) {
 const { user, account } = useAuth();
 const [activating, setActivating] = useState(false);
 const { toast } = useToast();
 const [state, setState] = useState<'loading'|'enabled'|'prompt'|'blocked'|'unsupported'|'error'|'disabled'>('loading');
 const register = useCallback(async (prompt: boolean) => {
  if (!user || !account?.active || account.must_change_password) { setState('disabled'); return; }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !key) { setState('unsupported'); return; }
  try {
   const permission = prompt ? await Notification.requestPermission() : Notification.permission;
   if (permission !== 'granted') {
    const blocked = permission === 'denied';
    setState(blocked ? 'blocked' : 'prompt');
    if (prompt && blocked) toast({ title: 'Permissão bloqueada pelo navegador', description: 'Libere notificações nas configurações do site e tente novamente.', variant: 'destructive' });
    return;
   }
   await navigator.serviceWorker.register('/sw.js');
   const registration = await navigator.serviceWorker.ready;
   const existing = await registration.pushManager.getSubscription();
   if (!prompt && !existing) { setState('disabled'); return; }
   const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
   const { data } = await supabase!.auth.getSession();
   if (!data.session) throw Error('Sem sessão');
   const response = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(subscription.toJSON()) });
   if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw Error(result?.error || 'Não foi possível salvar a inscrição do dispositivo.');
   }
   setState('enabled');
   if (prompt) toast({ title: 'Notificações ativadas', description: 'Este dispositivo receberá os avisos do aplicativo.' });
  } catch (error) {
   console.error('Falha ao ativar notificações push', error);
   setState('error');
   if (prompt) toast({ title: 'Não foi possível ativar', description: error instanceof Error ? error.message : 'Confira a permissão do navegador e tente novamente.', variant: 'destructive' });
  }
 }, [user, account, toast]);
 const disable = useCallback(async () => {
  setActivating(true);
  try {
   const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
   const subscription = await registration?.pushManager.getSubscription();
   const { data } = await supabase!.auth.getSession();
   if (subscription) {
    if (!data.session) throw Error('Sem sessão');
    const response = await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
    if (!response.ok) throw Error('Falha ao remover inscrição');
   }
   if (subscription && !await subscription.unsubscribe()) throw Error('Falha ao desativar');
   setState('disabled');
   toast({ title: 'Notificações desativadas' });
  } catch { toast({ title: 'Não foi possível desativar as notificações', variant: 'destructive' }); }
  finally { setActivating(false); }
 }, [toast]);
 useEffect(() => { void register(false); }, [register]);
 const toggle = async () => {
  if (activating || state === 'loading') return;
  if (state === 'unsupported') { toast({ title: 'Notificações push indisponíveis neste navegador', variant: 'destructive' }); return; }
  if (state === 'enabled') await disable();
  else { setActivating(true); try { await register(true); } finally { setActivating(false); } }
 };
 return <PushContext.Provider value={{ enabled: state === 'enabled', busy: activating || state === 'loading', toggle }}>{children}</PushContext.Provider>;
}
