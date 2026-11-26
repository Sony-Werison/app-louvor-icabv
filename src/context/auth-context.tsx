'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { Role, MemberAccount } from '@/types';

type Permission = 'edit:schedule' | 'edit:members' | 'edit:songs' | 'manage:playlists' | 'manage:settings';
type Result = { success: boolean; error?: string };
interface AuthContextType {
  user: { id: string; email: string } | null;
  account: MemberAccount | null;
  role: Role;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canManagePlaylist: (leaderId: string) => boolean;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  changePassword: (password: string) => Promise<Result>;
  shareMessage: string;
  reminderMessage: string;
  updateReminderMessage: (message: string) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const permissions: Record<Role, Permission[]> = {
  admin: ['edit:schedule', 'edit:members', 'edit:songs', 'manage:playlists', 'manage:settings'],
  abertura: ['manage:playlists'], viewer: [],
};
const defaultReminder = 'Olá, [NOME]! Você está escalado para [PERIODO]. Entre com sua conta pessoal no aplicativo e prepare o repertório. Obrigado!';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [account, setAccount] = useState<MemberAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountError, setAccountError] = useState('');
  const [reminderMessage, setReminderMessage] = useState(defaultReminder);
  const version = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  const applyUser = useCallback(async (authUser: User | null) => {
    const current = ++version.current;
    setUser(authUser?.email ? { id: authUser.id, email: authUser.email } : null);
    setAccount(null); setAccountError('');
    if (!authUser || !supabase) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase.from('member_accounts').select('*').eq('user_id', authUser.id).maybeSingle();
      if (current !== version.current) return;
      if (error || !data?.active) setAccountError('Não foi possível carregar um acesso ativo. Tente novamente ou contate o administrador.');
      else setAccount(data as MemberAccount);
    } catch {
      if (current === version.current) setAccountError('Falha de conexão ao verificar sua conta.');
    } finally {
      if (current === version.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }
    const client = supabase;
    let disposed = false;
    localStorage.removeItem('userRole'); localStorage.removeItem('user'); localStorage.removeItem('appPasswords');
    client.auth.getSession().then(({ data }) => { if (!disposed) void applyUser(data.session?.user ?? null); })
      .catch(() => { if (!disposed) setIsLoading(false); });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (!disposed) void applyUser(session?.user ?? null); }, 0);
    });
    return () => { disposed = true; ++version.current; data.subscription.unsubscribe(); };
  }, [applyUser]);

  useEffect(() => {
    if (!supabase) return;
    let disposed = false;
    supabase.rpc('get_public_reminder').then(({ data }) => {
      if (!disposed && typeof data === 'string' && !data.includes('[SENHA]')) setReminderMessage(data);
    });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (account?.must_change_password && pathname !== '/alterar-senha') router.replace('/alterar-senha');
  }, [account, pathname, router]);

  const refreshAccount = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    await applyUser(data.user);
  }, [applyUser]);

  const login = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Serviço de autenticação indisponível.' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return { success: false, error: 'E-mail ou senha inválidos.' };
      const profile = await supabase.from('member_accounts').select('active').eq('user_id', data.user.id).maybeSingle();
      if (profile.error || !profile.data?.active) {
        await supabase.auth.signOut();
        return { success: false, error: 'Esta conta não possui acesso ativo. Contate o administrador.' };
      }
      await applyUser(data.user);
      return { success: true };
    } catch { return { success: false, error: 'Não foi possível conectar. Tente novamente.' }; }
  };

  const logout = async () => {
    if (supabase) {
      try {
        const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
        const subscription = await registration?.pushManager.getSubscription();
        const { data } = await supabase.auth.getSession();
        if (subscription && data.session) {
          try { await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ endpoint: subscription.endpoint }) }); }
          finally { await subscription.unsubscribe(); }
        }
      } catch { /* Logout must still be available when the push service is unavailable. */ }
      await supabase.auth.signOut();
    }
    ++version.current; setUser(null); setAccount(null); setAccountError('');
  };

  const changePassword = async (password: string): Promise<Result> => {
    try {
      const { data } = await supabase!.auth.getSession();
      if (!data.session) return { success: false, error: 'Entre novamente para alterar a senha.' };
      const response = await fetch('/api/account/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, error: result.error };
      await refreshAccount();
      return { success: true };
    } catch { return { success: false, error: 'Não foi possível alterar a senha. Tente novamente.' }; }
  };

  const role: Role = account?.active ? account.role : 'viewer';
  const can = useCallback((permission: Permission) => !!account?.active && !account.must_change_password && permissions[account.role].includes(permission), [account]);
  const canManagePlaylist = useCallback((leaderId: string) => !!account?.active && !account.must_change_password &&
    account.member_id === leaderId, [account]);

  const updateReminderMessage = async (message: string) => {
    if (!supabase || !can('manage:settings')) throw new Error('Sem permissão para alterar configurações.');
    const { error } = await supabase.from('app_settings').update({ reminder_message: message }).eq('id', 'settings');
    if (error) throw new Error('Não foi possível salvar a mensagem.');
    setReminderMessage(message);
  };

  return <AuthContext.Provider value={{ user, account, role, isLoading, can, canManagePlaylist, login, logout, refreshAccount, changePassword,
    shareMessage: 'Lista dos louvores para [PERIODO].', reminderMessage, updateReminderMessage }}>
    {isLoading ? <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div> :
      account?.must_change_password && pathname !== '/alterar-senha' ? <p className="p-6">Defina sua senha pessoal para continuar.</p> :
      <>{accountError && <div role="alert" className="border-b p-4 text-sm text-destructive">{accountError} <button onClick={() => void refreshAccount()} className="underline">Tentar novamente</button> · <button onClick={() => void logout()} className="underline">Sair</button></div>}{children}</>}
  </AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
