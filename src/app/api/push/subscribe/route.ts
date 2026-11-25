import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccount, accountErrorResponse, AuthError } from '@/lib/server-auth';
const schema = z.object({ endpoint: z.string().url().max(2048), keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }) });
export async function POST(request: Request) {
 try {
  const { admin, user, account } = await requireAccount(request);
  if (account.must_change_password) throw new AuthError('Defina sua senha antes de ativar notificações.', 403);
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success || !input.data.endpoint.startsWith('https://')) throw new AuthError('Inscrição inválida.', 400);
  const host = new URL(input.data.endpoint).hostname;
  if (!['fcm.googleapis.com', 'updates.push.services.mozilla.com'].includes(host) && !host.endsWith('.push.apple.com') && host !== 'web.push.apple.com') throw new AuthError('Serviço de notificações não reconhecido.', 400);
  const { error } = await admin.from('push_subscriptions').upsert({ endpoint: input.data.endpoint, user_id: user.id, keys: input.data.keys }, { onConflict: 'endpoint' });
  if (error) throw new AuthError('Não foi possível ativar as notificações.', 503);
  return NextResponse.json({ ok: true });
 } catch (error) { return accountErrorResponse(error); }
}
export async function DELETE(request: Request) {
 try {
  const { admin, user } = await requireAccount(request);
  const endpoint = (await request.json().catch(() => null))?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 2048) throw new AuthError('Inscrição inválida.', 400);
  const { error } = await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);
  if (error) throw new AuthError('Não foi possível desativar as notificações.', 503);
  return NextResponse.json({ ok: true });
 } catch (error) { return accountErrorResponse(error); }
}
