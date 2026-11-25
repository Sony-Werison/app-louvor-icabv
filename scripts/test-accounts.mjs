// Integration test against localhost and the configured Supabase project.
// Creates only isolated fixtures; removes every fixture in finally. No email is sent.
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const base = process.env.TEST_APP_URL || 'http://localhost:9003';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Tests must target the local app');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert(url && publicKey && process.env.SUPABASE_SERVICE_ROLE_KEY, 'Configure .env.local first');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const client = () => createClient(url, publicKey, options);
const tag = `account-test-${randomUUID()}`;
const memberIds = [`${tag}-admin`, `${tag}-leader`, `${tag}-viewer`, `${tag}-other`];
const users = [];
let checks = 0;
const check = (condition, message) => { assert(condition, message); ++checks; console.log('OK: ' + message); };
const ok = result => { if (result.error) throw new Error(result.error.message); return result.data; };
async function api(path, method, token, body) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error(`HTTP ${response.status}: endpoint did not return JSON`); }
  return { status: response.status, data };
}
async function signIn(email, password) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  assert(!error && data.session, 'Fixture sign-in succeeds');
  return { c, token: data.session.access_token, userId: data.user.id };
}
try {
  ok(await admin.from('members').insert(memberIds.map((id, index) => ({ id, name: `Teste de acesso ${index}`, email: '', roles: index === 2 ? ['Multimídia'] : ['Abertura'] }))));
  const adminEmail = `${tag}@acesso.icabv.app`;
  const adminPassword = randomBytes(24).toString('base64url');
  const created = ok(await admin.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true }));
  users.push(created.user.id);
  ok(await admin.from('member_accounts').insert({ user_id: created.user.id, member_id: memberIds[0], login_email: adminEmail, role: 'admin', must_change_password: false }));
  const administrator = await signIn(adminEmail, adminPassword);
  const anonymous = client();
  check((await api('/api/members/account', 'POST', null, { memberId: memberIds[1] })).status === 401, 'anonymous account creation denied');
  const provisioned = await api('/api/members/account', 'POST', administrator.token, { memberId: memberIds[1] });
  check(provisioned.status === 201 && !!provisioned.data.temporaryPassword, 'administrator provisions an individual member account');
  const leader = await signIn(provisioned.data.email, provisioned.data.temporaryPassword);
  users.push(leader.userId);
  const account = ok(await leader.c.from('member_accounts').select('*').single());
  check(account.member_id === memberIds[1] && account.role === 'abertura' && account.must_change_password, 'account linked to the correct member with mandatory password change');
  check((await api('/api/members/account', 'POST', administrator.token, { memberId: memberIds[1] })).status === 409, 'duplicate provisioning preserves the existing account');
  check((await api('/api/members/account', 'POST', leader.token, { memberId: memberIds[3] })).status === 403, 'member cannot provision accounts');
  ok(await leader.c.auth.updateUser({ data: { app_role: 'admin', role: 'admin' } }));
  check((await api('/api/members/account', 'GET', leader.token)).status === 403, 'user-editable metadata cannot grant administrator privileges');
  check(!!(await leader.c.from('member_accounts').update({ role: 'admin', must_change_password: false }).eq('user_id', leader.userId)).error, 'direct privilege/password-gate tampering denied');
  const song = ok(await admin.from('songs').select('id').limit(1))[0];
  assert(song, 'Catalog contains a song for playlist tests');
  const date = new Date('2200-01-01T10:00:00Z'); date.setUTCDate(date.getUTCDate() + Math.floor(Math.random() * 100000));
  ok(await admin.from('monthly_schedules').insert({ id: tag, date: date.toISOString(), assignments: { abertura_manha: [memberIds[1]], abertura_noite: [memberIds[3]] }, playlist_manha: [], playlist_noite: [] }));
  const playlistArgs = { p_schedule_id: tag, p_period: 'manha', p_playlist: [song.id] };
  check(!!(await leader.c.rpc('update_own_playlist', playlistArgs)).error, 'temporary password cannot modify playlists');
  check(!!(await anonymous.rpc('update_own_playlist', playlistArgs)).error, 'anonymous playlist writes denied');
  check((await api('/api/account/password', 'POST', leader.token, { password: 'short' })).status === 400, 'weak password rejected');
  const newPassword = `Nova#${randomBytes(18).toString('base64url')}`;
  const changed = await api('/api/account/password', 'POST', leader.token, { password: newPassword });
  check(changed.status === 200, 'member changes temporary password through their own authenticated session');
  const oldLogin = await client().auth.signInWithPassword({ email: provisioned.data.email, password: provisioned.data.temporaryPassword });
  check(!!oldLogin.error, 'temporary password no longer signs in');
  const signedIn = await signIn(provisioned.data.email, newPassword);
  check(!ok(await signedIn.c.from('member_accounts').select('*').single()).must_change_password, 'password change unlocks the account');
  check(!(await signedIn.c.rpc('update_own_playlist', playlistArgs)).error, 'assigned leader saves their own playlist');
  check(!!(await signedIn.c.rpc('update_own_playlist', { ...playlistArgs, p_period: 'noite' })).error, 'leader cannot edit another member playlist');
  check(!!(await signedIn.c.rpc('update_own_playlist', { ...playlistArgs, p_period: null })).error, 'null period rejected');
  check(!!(await signedIn.c.rpc('update_own_playlist', { ...playlistArgs, p_playlist: ['nonexistent-song'] })).error, 'unknown song rejected');
  const forbiddenSchedule = await signedIn.c.from('monthly_schedules').update({ assignments: {} }).eq('id', tag).select();
  check(!!forbiddenSchedule.error || !forbiddenSchedule.data?.length, 'member cannot change schedule assignments directly');
  const forbiddenMember = await signedIn.c.from('members').update({ name: 'Unauthorized' }).eq('id', memberIds[3]).select();
  check(!!forbiddenMember.error || !forbiddenMember.data?.length, 'member cannot edit another member');
  check(!ok(await signedIn.c.from('app_settings').select('*')).length, 'shared password/settings table is inaccessible to members');
  check(!(await anonymous.rpc('get_public_reminder')).error, 'public reminder remains readable without exposing settings');
  const current = ok(await admin.from('monthly_schedules').select('*').eq('id', tag).single());
  check(current.assignments.abertura_noite[0] === memberIds[3] && current.playlist_noite.length === 0 && current.playlist_manha[0] === song.id, 'saving a playlist preserves assignments and the other service');
  const viewResult = await api('/api/members/account', 'POST', administrator.token, { memberId: memberIds[2] });
  check(viewResult.status === 201, 'administrator provisions a reader');
  const viewer = await signIn(viewResult.data.email, viewResult.data.temporaryPassword); users.push(viewer.userId);
  ok(await admin.from('member_accounts').update({ must_change_password: false }).eq('user_id', viewer.userId));
  check(!!(await viewer.c.rpc('update_own_playlist', playlistArgs)).error, 'reader cannot edit playlists');
  check(!(await administrator.c.rpc('update_own_playlist', { ...playlistArgs, p_period: 'noite' })).error, 'administrator can manage any playlist');
  const reset = await api('/api/members/account', 'PATCH', administrator.token, { memberId: memberIds[1] });
  check(reset.status === 200, 'administrator can issue another temporary password');
  check(!!(await signedIn.c.rpc('update_own_playlist', playlistArgs)).error, 'password reset immediately locks writes even with an existing token');
  const resetLogin = await signIn(reset.data.email, reset.data.temporaryPassword);
  check(ok(await resetLogin.c.from('member_accounts').select('*').single()).must_change_password, 'reset password requires first-access change again');
  ok(await admin.from('member_accounts').update({ active: false }).eq('user_id', leader.userId));
  check((await api('/api/account/password', 'POST', resetLogin.token, { password: newPassword })).status === 403, 'disabled account rejected even with a valid token');
  const protectedAdmin = await api('/api/members/account', 'PATCH', administrator.token, { memberId: memberIds[0] });
  check(protectedAdmin.status === 403, 'administrative account password is not reset through member provisioning');
  console.log(`Completed ${checks} access-control checks.`);
} finally {
  const errors = [];
  const removeSchedule = await admin.from('monthly_schedules').delete().eq('id', tag); if (removeSchedule.error) errors.push(removeSchedule.error.message);
  // Also discover users that may have been created just before a failing assertion.
  const linked = await admin.from('member_accounts').select('user_id').in('member_id', memberIds);
  for (const row of linked.data || []) if (!users.includes(row.user_id)) users.push(row.user_id);
  for (const id of users) { const result = await admin.auth.admin.deleteUser(id); if (result.error) errors.push(result.error.message); }
  const removeMembers = await admin.from('members').delete().in('id', memberIds); if (removeMembers.error) errors.push(removeMembers.error.message);
  if (errors.length) throw new Error('Fixture cleanup failed: ' + errors.join('; '));
  console.log('All temporary accounts and fixture schedules/members removed.');
}
