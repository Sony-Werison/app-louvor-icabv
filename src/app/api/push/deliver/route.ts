import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import * as webpush from 'web-push';
import { serviceClient } from '@/lib/server-auth';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 const expected = process.env.PUSH_WEBHOOK_SECRET;
 const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '');
 if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return new NextResponse(null,{status:401});
 const id = (await request.json().catch(() => null))?.id;
 if (!Number.isSafeInteger(id) || id <= 0) return new NextResponse(null,{status:400});
 const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey = process.env.VAPID_PRIVATE_KEY;
 if (!publicKey || !privateKey) return new NextResponse(null,{status:503});
 const client = serviceClient();
 const { data: notification, error } = await client.from('notifications').select('id,user_id,title,body,href').eq('id',id).maybeSingle();
 if (error) return new NextResponse(null,{status:503});
 if (!notification) return new NextResponse(null,{status:404});
 const { data: subscriptions, error: subError } = await client.from('push_subscriptions').select('endpoint,keys').eq('user_id',notification.user_id);
 if (subError) return new NextResponse(null,{status:503});
 webpush.setVapidDetails('mailto:admin@icabv.app',publicKey,privateKey);
 let failures = false;
 await Promise.all((subscriptions || []).map(async sub => {
  try { await webpush.sendNotification({endpoint:sub.endpoint,keys:sub.keys},JSON.stringify({title:notification.title,body:notification.body,href:notification.href,tag:`notice-${id}`})); }
  catch (error: any) { if (error.statusCode === 404 || error.statusCode === 410) await client.from('push_subscriptions').delete().eq('endpoint',sub.endpoint); else failures = true; }
 }));
 return new NextResponse(null,{status:failures ? 502 : 204});
}
