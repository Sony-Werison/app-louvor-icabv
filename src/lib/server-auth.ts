import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AuthError('O cadastro de acessos não está configurado no servidor.', 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAccount(request: Request, adminOnly = false) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AuthError('Entre na sua conta para continuar.', 401);
  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new AuthError('Sua sessão expirou. Entre novamente.', 401);
  const { data: account, error: accountError } = await admin.from('member_accounts').select('*').eq('user_id', data.user.id).maybeSingle();
  if (accountError) throw new AuthError('Não foi possível verificar as permissões.', 503);
  if (!account?.active) throw new AuthError('Esta conta não possui um acesso ativo. Contate o administrador.', 403);
  if (adminOnly && (account.role !== 'admin' || account.must_change_password)) {
    throw new AuthError('Acesso restrito a administradores com senha definitiva.', 403);
  }
  return { admin, user: data.user, account, token };
}

export function accountErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof AuthError ? error.message : 'Não foi possível concluir a operação.' },
    { status: error instanceof AuthError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
