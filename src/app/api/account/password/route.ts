import { NextResponse } from 'next/server';
import { z } from 'zod';
import { accountErrorResponse, AuthError, requireAccount } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { admin, user, token } = await requireAccount(request);
    const parsed = z.object({ password: z.string().min(10).max(128) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuthError('Use uma senha com 10 a 128 caracteres.', 400);
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT', cache: 'no-store',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: parsed.data.password }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AuthError(error.code === 'same_password' ? 'Escolha uma senha diferente da provisória.' : 'Não foi possível alterar a senha. Entre novamente e tente outra senha.', 400);
    }
    const { error: saveError } = await admin.from('member_accounts').update({ must_change_password: false }).eq('user_id', user.id);
    if (saveError) throw new AuthError('A senha mudou, mas não foi possível liberar o acesso. Entre com a nova senha e contate o administrador.', 503);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return accountErrorResponse(error); }
}
