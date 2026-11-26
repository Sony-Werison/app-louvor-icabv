'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
function keyBytes(base64: string) { const raw = atob((base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
export function PushPermission() {
 const { user, account } = useAuth();
 const [dismissed, setDismissed] = useState(false);
 const [manualOpen, setManualOpen] = useState(false);
 const [activating, setActivating] = useState(false);
 const { toast } = useToast();
 useEffect(() => {
  setDismissed(false);
  setManualOpen(false);
  const open = () => { setDismissed(false); setManualOpen(true); };
  window.addEventListener('louvor:open-push-settings', open);
  return () => window.removeEventListener('louvor:open-push-settings', open);
 }, [user?.id]);
 const [state, setState] = useState<'loading'|'enabled'|'prompt'|'blocked'|'unsupported'|'error'|'disabled'>('loading');
 const register = useCallback(async (prompt: boolean) => {
  if (!user || !account?.active || account.must_change_password) return;
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
   const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
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
   if (subscription && data.session) await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
   await subscription?.unsubscribe();
   setState('disabled');
   toast({ title: 'Notificações desativadas' });
  } catch { toast({ title: 'Não foi possível desativar as notificações', variant: 'destructive' }); }
  finally { setActivating(false); }
 }, [toast]);
 useEffect(() => { void register(false); }, [register]);
 if (!user || !account?.active || account.must_change_password || state === 'loading') return null;
 const shouldShowPrompt = state !== 'enabled' && !dismissed;
 if (state === 'enabled' && !manualOpen || state !== 'enabled' && !shouldShowPrompt && !manualOpen) return null;
 return <Dialog open={manualOpen || shouldShowPrompt} onOpenChange={open => { if (!open) { setManualOpen(false); setDismissed(true); } }}>
  <DialogContent className="w-[calc(100%-2rem)] rounded-lg sm:max-w-md">
   <DialogHeader>
    <DialogTitle>{state === 'enabled' ? 'Notificações ativadas' : 'Ative as notificações'}</DialogTitle>
    <DialogDescription>
     {state === 'enabled' ? 'Este dispositivo está inscrito para receber notificações push.' : state === 'blocked' ? 'As notificações estão bloqueadas neste navegador. Abra as configurações do site pelo ícone ao lado do endereço, permita notificações e tente ativá-las novamente.' : state === 'unsupported' ? 'As notificações push não estão disponíveis neste navegador. No iPhone, adicione o aplicativo à Tela de Início e abra-o por lá.' : state === 'error' ? 'Não foi possível concluir a inscrição deste dispositivo. Confira a permissão do navegador e tente novamente.' : 'Receba avisos sobre suas escalas, trocas e novos repertórios diretamente neste dispositivo.'}
    </DialogDescription>
   </DialogHeader>
   <DialogFooter className="gap-2 sm:gap-2">
    <Button variant="outline" onClick={() => { setManualOpen(false); setDismissed(true); }}>{state === 'enabled' ? 'Fechar' : 'Agora não'}</Button>
    {state === 'enabled' && manualOpen && <><Button variant="destructive" disabled={activating} onClick={() => void disable()}>{activating ? 'Desativando...' : 'Desativar notificações'}</Button><Button disabled={activating} onClick={async () => { setActivating(true); const { error } = await supabase!.rpc('send_test_notification'); setActivating(false); toast(error ? { title: 'Não foi possível enviar o teste', variant: 'destructive' } : { title: 'Notificação de teste enviada', description: 'Confira as notificações deste dispositivo.' }); }}>{activating ? 'Enviando...' : 'Testar notificação'}</Button></>}
    {(state === 'blocked' || state === 'prompt' || state === 'error' || state === 'disabled') && <Button disabled={activating} onClick={async () => { setActivating(true); await register(true); setActivating(false); }}>{activating ? 'Ativando...' : 'Ativar notificações'}</Button>}
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
