import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { accountErrorResponse, AuthError, requireAccount } from '@/lib/server-auth';

const inputSchema = z.object({ memberId: z.string().min(1).max(200), email: z.string().trim().email().max(254).optional() });

export async function GET(request: Request) {
  try {
    const { admin } = await requireAccount(request, true);
    const { data, error } = await admin.from('member_accounts').select('user_id,member_id,login_email,role,must_change_password,active');
    if (error) throw new AuthError('Não foi possível listar os acessos.', 503);
    return NextResponse.json({ accounts: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return accountErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const { admin } = await requireAccount(request, true);
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuthError('Informe o membro e um e-mail válido.', 400);
    const { memberId, email } = parsed.data;
    const { data: member, error } = await admin.from('members').select('id,name,email,roles').eq('id', memberId).maybeSingle();
    if (error || !member) throw new AuthError('Membro não encontrado.', 404);
    const { data: existing, error: lookupError } = await admin.from('member_accounts').select('user_id').eq('member_id', memberId).maybeSingle();
    if (lookupError) throw new AuthError('Não foi possível verificar o vínculo da conta.', 503);
    if (existing) throw new AuthError('Este membro já possui uma conta. O acesso existente foi preservado.', 409);
    const loginEmail = (email || member.email || `${member.id.toLowerCase().replace(/[^a-z0-9-]/g, '')}@acesso.icabv.app`).toLowerCase();
    if (!z.string().email().safeParse(loginEmail).success) throw new AuthError('Informe um e-mail válido.', 400);
    const password = randomBytes(18).toString('base64url');
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: loginEmail, password, email_confirm: true, user_metadata: { name: member.name },
    });
    if (createError || !created.user) throw new AuthError('O e-mail já possui conta ou não foi possível criar o acesso. Nenhuma senha existente foi alterada.', 409);
    const { error: linkError } = await admin.from('member_accounts').insert({
      user_id: created.user.id, member_id: member.id, login_email: loginEmail,
      role: Array.isArray(member.roles) && member.roles.includes('Abertura') ? 'abertura' : 'viewer',
      must_change_password: true,
    });
    if (linkError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new AuthError('Não foi possível vincular a conta ao membro. Tente novamente.', 409);
    }
    return NextResponse.json({ email: loginEmail, temporaryPassword: password }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return accountErrorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await requireAccount(request, true);
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AuthError('Informe um membro válido.', 400);
    const { data: account, error } = await admin.from('member_accounts').select('*').eq('member_id', parsed.data.memberId).maybeSingle();
    if (error || !account) throw new AuthError('Conta não encontrada.', 404);
    if (account.role === 'admin') throw new AuthError('A senha administrativa deve ser alterada pela própria conta.', 403);
    const password = randomBytes(18).toString('base64url');
    const { error: lockError } = await admin.from('member_accounts').update({ must_change_password: true }).eq('user_id', account.user_id);
    if (lockError) throw new AuthError('Não foi possível preparar a redefinição.', 503);
    const { error: resetError } = await admin.auth.admin.updateUserById(account.user_id, { password });
    if (resetError) throw new AuthError('Não foi possível redefinir a senha. Tente novamente.', 503);
    return NextResponse.json({ email: account.login_email, temporaryPassword: password }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return accountErrorResponse(error); }
}
