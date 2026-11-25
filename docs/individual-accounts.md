# Contas individuais

A migração `supabase/migrations/202611250001_individual_accounts.sql` foi aplicada ao projeto Supabase em 25/11/2026. Foram preservados 15 membros, 859 músicas e 75 registros de escala. A conta existente de Werison foi vinculada como administrador sem alterar sua senha; outros 14 membros receberam acessos provisórios.

## Operação

Entre em `/login` com e-mail de acesso e senha. O administrador gerencia acessos em Membros → opções do membro → Gerenciar acesso. É possível criar um acesso ou gerar nova senha provisória para um membro. A senha é exibida uma única vez e a troca no primeiro acesso é obrigatória. Identificações `@acesso.icabv.app` são apenas logins, não caixas de e-mail.

Os dados iniciais estão no arquivo local ignorado `.local-private/acessos-provisorios.txt`. Entregue somente o acesso correspondente a cada membro. Não publique esse arquivo nem backups privados.

## Permissões

- Administrador: gerencia cadastros, escalas, configurações e acessos.
- Abertura: altera repertório somente no período em que seu membro está escalado como dirigente.
- Visualizador: consulta os dados públicos.
- Conta inativa ou com senha provisória: sem permissões de escrita.

As permissões usam `member_accounts` no banco. Metadados editáveis de autenticação e valores locais do navegador não concedem privilégios. Os catálogos continuam com leitura pública, como no aplicativo original.

## Ambiente e publicação

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no servidor de hospedagem. A última variável é secreta e nunca deve receber prefixo `NEXT_PUBLIC_`. As rotas de gerenciamento exigem um servidor Next.js; exportação estática não atende esse fluxo. O ambiente local já está configurado em `.env.local`, ignorado pelo Git.

## Validação

`npm run typecheck` verifica tipos e `npm run build` compila produção. Com o aplicativo local em execução, `npm run test:accounts` testa autenticação, criação, vínculos, troca de senha, redefinição, contas inativas, isolamento de repertórios e RLS. O teste cria registros temporários identificados e os remove ao terminar; não envia mensagens. Foram aprovadas 30 verificações e o fluxo pela interface de criação, primeiro login e troca obrigatória também foi validado.
