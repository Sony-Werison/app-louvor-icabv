'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/app-logo';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, account } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (account?.active) router.replace(account.must_change_password ? '/alterar-senha' : '/');
  }, [account, router]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.error || 'Não foi possível entrar.');
    } finally { setSaving(false); }
  }
  return <div className="flex items-center justify-center min-h-[calc(100svh-8rem)] p-4">
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center"><div className="flex justify-center mb-4"><AppLogo /></div>
        <CardTitle>Acesso dos membros</CardTitle><CardDescription>Entre com seu e-mail e senha pessoal.</CardDescription>
      </CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="login-email">E-mail de acesso</Label><Input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="login-password">Senha</Label><Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Entrar</Button>
        <p className="text-sm text-muted-foreground">Primeiro acesso? Solicite ao administrador seu e-mail de acesso e senha provisória. Você definirá uma nova senha ao entrar.</p>
      </form>
        <div className="mt-6 space-y-2 border-t pt-4 text-center">
          <Button asChild variant="outline" className="w-full"><Link href="/">Continuar como visitante</Link></Button>
          <p className="text-xs text-muted-foreground">Consulte escalas e músicas sem criar uma conta. Para editar, entre com seu acesso de membro.</p>
        </div>
      </CardContent>
    </Card>
  </div>;
}
