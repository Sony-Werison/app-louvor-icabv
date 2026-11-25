'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export default function ChangePasswordPage() {
  const { user, account, changePassword, logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setMessage('');
    if (password.length < 10 || password !== confirmation) {
      setMessage('Use pelo menos 10 caracteres e confirme a mesma senha.'); return;
    }
    setSaving(true);
    try {
      const result = await changePassword(password);
      if (!result.success) { setMessage(result.error || 'Não foi possível alterar a senha.'); return; }
      setPassword(''); setConfirmation(''); router.replace('/');
    } finally { setSaving(false); }
  }
  return <div className="mx-auto max-w-md space-y-4 p-6">
    <h1 className="text-2xl font-bold">{account?.must_change_password ? 'Defina sua senha pessoal' : 'Alterar senha'}</h1>
    {!user ? <p><Link href="/login" className="underline">Entre na sua conta</Link> para alterar a senha.</p> :
      <><p className="text-sm text-muted-foreground">{account?.must_change_password ? 'Substitua a senha provisória para liberar seu acesso.' : 'Escolha uma senha com pelo menos 10 caracteres.'}</p>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirme a nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></div>
          <Button disabled={saving}>Salvar senha</Button>
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        </form><Button variant="ghost" onClick={() => void logout()}>Sair da conta</Button>
      </>}
  </div>;
}
