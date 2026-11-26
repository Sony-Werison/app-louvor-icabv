'use client';
import { useEffect, useState, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { supabase } from '@/lib/supabase-client';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

type Request = { id: number; requester: string; requester_member: string; recipient_member: string; schedule_id: string; column_id: string; target_schedule_id: string; target_column_id: string };
export function ArrangedSwaps({ source }: { source?: { scheduleId: string; column: string; slot: number } }) {
 const { user, account } = useAuth();
 const { monthlySchedules, members, scheduleColumns } = useSchedule();
 const { toast } = useToast();
 const [own, setOwn] = useState(source ? JSON.stringify([source.scheduleId,source.column,source.slot]) : '');
 const [target, setTarget] = useState('');
 const [requests, setRequests] = useState<Request[]>([]);
 const [busy, setBusy] = useState(false);
 const load = useCallback(async () => {
  if (!supabase || !user) return;
  const { data, error } = await supabase.from('arranged_swaps').select('*').eq('state','pending').order('created_at',{ascending:false});
  if (error) toast({title:'Não foi possível carregar as trocas combinadas',variant:'destructive'});
  else setRequests(data || []);
 },[user,toast]);
 useEffect(() => { void load(); },[load]);
 if (!account?.active || account.must_change_password || !user) return null;
 const assignments = monthlySchedules.filter(s => s.date >= startOfDay(new Date())).flatMap(s => scheduleColumns.filter(c => c.role && (c.id.endsWith('_manha') ? s.status_manha !== 'cancelled' && s.status_manha !== 'not_applicable' : c.id.endsWith('_noite') ? s.status_noite !== 'cancelled' && s.status_noite !== 'not_applicable' : true)).flatMap(c => (s.assignments[c.id] || []).flatMap((memberId,slot) => memberId && !memberId.startsWith('guest:') ? [{schedule:s,column:c,memberId,slot,key:JSON.stringify([s.id,c.id,slot])}] : [])));
 const mine = assignments.filter(a => a.memberId === account.member_id);
 const selected = mine.find(a => a.key === own);
 const choices = selected ? assignments.filter(a => a.schedule.id !== selected.schedule.id && a.column.role === selected.column.role && a.memberId !== account.member_id) : [];
 const label = (id: string, column: string) => { const s=monthlySchedules.find(s=>s.id===id); return `${s ? format(s.date,'dd/MM/yyyy') : 'Data indisponível'} — ${scheduleColumns.find(c=>c.id===column)?.label || column}`; };
 const name = (id:string) => members.find(m=>m.id===id)?.name || 'Membro';
 const propose = async () => {
  if (!supabase || !selected || !choices.some(a=>a.key===target)) return;
  setBusy(true);
  try {
   const [id,column,slot] = JSON.parse(target);
   const {error} = await supabase.rpc('request_arranged_swap',{p_schedule:selected.schedule.id,p_column:selected.column.id,p_slot:selected.slot,p_target:id,p_target_column:column,p_target_slot:slot});
   if(error) throw error;
   toast({title:'Proposta enviada',description:'A escala só será alterada após a confirmação da outra pessoa.'}); setTarget(''); await load();
  } catch(error) { toast({title:'Não foi possível propor a troca',description:error instanceof Error ? error.message : (error as {message?:string})?.message || 'Confira as atribuições e o acesso da outra pessoa.',variant:'destructive'}); }
  finally {setBusy(false);}
 };
 const respond = async(id:number,action:string) => {
  if(!supabase) return; setBusy(true);
  try {const {error}=await supabase.rpc('respond_arranged_swap',{p_id:id,p_action:action}); if(error)throw error; if(action==='accept') window.location.reload(); else await load();}
  catch(error){toast({title:'Não foi possível responder',description:(error as {message?:string})?.message || 'Tente novamente.',variant:'destructive'});}
  finally{setBusy(false);}
 };
 return <section className="min-w-0 space-y-4 rounded-lg border p-4"><h2 className="font-semibold">Troca combinada</h2><p className="text-sm text-muted-foreground">Escolha a reunião da outra pessoa. Ela receberá um aviso para confirmar antes de qualquer alteração na escala.</p>
 {source ? <p className="text-sm">Sua atribuição: {label(source.scheduleId,source.column)}</p> : <label className="block text-sm">Sua atribuição<select className="mt-1 w-full rounded border bg-background p-2" value={own} onChange={e=>{setOwn(e.target.value);setTarget('');}}><option value="">Selecione sua reunião</option>{mine.map(a=><option key={a.key} value={a.key}>{label(a.schedule.id,a.column.id)}</option>)}</select></label>}
 <label className="block text-sm">Reunião para trocar<select className="mt-1 w-full min-w-0 rounded border bg-background p-2" disabled={!selected||busy} value={target} onChange={e=>setTarget(e.target.value)}><option value="">Selecione a reunião da outra pessoa</option>{choices.map(a=><option key={a.key} value={a.key}>{label(a.schedule.id,a.column.id)} — {name(a.memberId)}</option>)}</select></label><Button disabled={!target||busy} onClick={()=>void propose()}>Enviar para confirmação</Button>
 {requests.map(r=><div key={r.id} className="space-y-2 border-t pt-3 text-sm"><p>{name(r.requester_member)}: {label(r.schedule_id,r.column_id)} ↔ {name(r.recipient_member)}: {label(r.target_schedule_id,r.target_column_id)}</p>{r.requester===user.id ? <><p>Aguardando confirmação da outra pessoa.</p><Button size="sm" variant="outline" disabled={busy} onClick={()=>void respond(r.id,'cancel')}>Cancelar proposta</Button></> : <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={()=>void respond(r.id,'accept')}>Confirmar troca</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>void respond(r.id,'decline')}>Recusar</Button></div>}</div>)}
 </section>;
}
