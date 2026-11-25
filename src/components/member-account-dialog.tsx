'use client';
import { useEffect, useState, type FormEvent } from 'react';
import type { Member, MemberAccount } from '@/types';
import { supabase } from '@/lib/supabase-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function MemberAccountDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const [email, setEmail] = useState(member.email || `${member.id.toLowerCase().replace(/[^a-z0-9-]/g, '')}@acesso.icabv.app`);
  const [account, setAccount] = useState<MemberAccount | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let disposed = false;
    supabase!.from('member_accounts').select('*').eq('member_id', member.id).maybeSingle().then(({ data, error }) => {
      if (!disposed) { setAccount(data); setError(error ? 'Não foi possível verificar o acesso. Feche e tente novamente.' : ''); setLoading(false); }
    });
    return () => { disposed = true; };
  }, [member.id]);
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await supabase!.auth.getSession();
      if (!data.session) throw new Error('Entre como administrador.');
      const response = await fetch('/api/members/account', {
        method: account ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ memberId: member.id, email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível criar o acesso.');
      setCredentials(result);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível conectar.'); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent><DialogHeader><DialogTitle>Acesso de {member.name}</DialogTitle>
      <DialogDescription>{credentials ? 'Guarde os dados para entregar ao membro. A senha não será exibida novamente.' : 'Gerencie a conta pessoal deste membro.'}</DialogDescription>
    </DialogHeader>
      {loading ? <p>Verificando acesso...</p> : credentials ? <div className="space-y-4">
        <div className="space-y-2 break-all rounded border p-3"><p>E-mail: {credentials.email}</p><p>Senha provisória: {credentials.temporaryPassword}</p></div>
        <p className="text-sm text-muted-foreground">No primeiro acesso, o membro deve definir sua própria senha. O e-mail provisório serve como identificação de acesso e não recebe mensagens.</p>
        <Button onClick={async () => { try { await navigator.clipboard.writeText(`E-mail: ${credentials.email}\nSenha provisória: ${credentials.temporaryPassword}\nAcesse o aplicativo e defina sua senha pessoal.`); setCopied(true); } catch { setError('Copie os dados manualmente.'); } }}>{copied ? 'Dados copiados' : 'Copiar dados de acesso'}</Button>
      </div> : <form onSubmit={save} className="space-y-4">
        {account ? <><p className="break-all text-sm">E-mail de acesso: <strong>{account.login_email}</strong></p><p className="text-sm text-muted-foreground">{account.must_change_password ? 'Aguardando a troca da senha provisória.' : 'Acesso ativo com senha pessoal.'}</p></> : <><div className="space-y-2"><Label htmlFor="account-email">E-mail de acesso</Label><Input id="account-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div><p className="text-sm text-muted-foreground">Você pode usar um e-mail real ou manter a identificação provisória sugerida. A senha será gerada automaticamente.</p></>}
        {account?.role === 'admin' ? <p className="text-sm">A conta administrativa existente foi preservada. Use “Alterar senha” na própria conta.</p> : <Button disabled={saving}>{saving ? 'Aguarde...' : account ? 'Gerar nova senha provisória' : 'Criar acesso individual'}</Button>}
      </form>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent>
  </Dialog>;
}
