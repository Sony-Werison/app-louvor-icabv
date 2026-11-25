// Run only for an explicitly authorized provisioning operation. No messages are sent.
// Existing accounts/passwords are preserved. Credentials are written only to an ignored local file.
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const { data: members, error } = await client.from('members').select('id,name,email,roles').order('name');
if (error) throw Error(error.message);
const { data: accounts, error: accountError } = await client.from('member_accounts').select('*');
if (accountError) throw Error(accountError.message);
const credentials = [];
await mkdir('.local-private', { recursive: true });
const previousCredentials = await readFile('.local-private/acessos-provisorios.txt', 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '';
  throw error;
});
const save = () => writeFile('.local-private/acessos-provisorios.txt',
  previousCredentials + (previousCredentials ? '\n\n' : '') +
  'ACESSOS PROVISÓRIOS — LOUVOR ICABV\n\nEntregue somente os dados individuais a cada membro.\n' +
  'A troca da senha é obrigatória no primeiro acesso. As identificações @acesso.icabv.app não recebem e-mails.\n' +
  'A conta administrativa existente e sua senha foram preservadas.\n\n' +
  credentials.map(item => `${item.name}\nE-mail de acesso: ${item.email}\nSenha provisória: ${item.password}\n`).join('\n'), { mode: 0o600 });
for (const member of members) {
  if (accounts.some(account => account.member_id === member.id)) { console.log('Conta existente preservada: ' + member.name); continue; }
  if (member.id.startsWith('account-test-') || member.id.startsWith('ui-account-test-')) continue;
  const email = (member.email || `${member.id.toLowerCase().replace(/[^a-z0-9-]/g, '')}@acesso.icabv.app`).toLowerCase();
  const password = randomBytes(18).toString('base64url');
  const { data: created, error: createError } = await client.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: member.name } });
  if (createError) throw Error(`Não foi possível criar a conta de ${member.name}. Contas anteriores foram preservadas; consulte o arquivo privado.`);
  const { error: linkError } = await client.from('member_accounts').insert({ user_id: created.user.id, member_id: member.id,
    login_email: email, role: member.roles.includes('Abertura') ? 'abertura' : 'viewer', must_change_password: true });
  if (linkError) { await client.auth.admin.deleteUser(created.user.id); throw Error('Falha no vínculo de ' + member.name); }
  credentials.push({ name: member.name, email, password });
  await save();
  console.log('Conta criada e vinculada: ' + member.name);
}
console.log(`Concluído: ${credentials.length} novos acessos. Senhas não foram impressas.`);
