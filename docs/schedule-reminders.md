# Lembretes de escala

Aplicar a migração [202611260001_own_playlists_and_reminders.sql](../supabase/migrations/202611260001_own_playlists_and_reminders.sql) no Supabase usando o fluxo de migrations ou SQL Editor. O deploy da aplicação na Vercel não aplica migrations do banco.

A rotina `weekly-schedule-reminders` executa diariamente às 09:00 no fuso America/Sao_Paulo, via pg_cron. Considera a semana de segunda a domingo e apenas reuniões ainda não passadas e não canceladas. Não depende de o aplicativo estar aberto.

- Abertura: um aviso por usuário, reunião, período e dia enquanto o repertório estiver vazio. Para assim que houver músicas.
- Pregação: um aviso por usuário, reunião e período na semana correspondente. Novos responsáveis recebem seu próprio aviso na próxima execução.
- As duas categorias têm controles globais exclusivos do administrador nas configurações.
- Os avisos usam a caixa de notificações existente e o mesmo mecanismo de entrega push; push depende de inscrição ativa e da configuração de entrega existente.

A rotina possui registro privado para evitar duplicações em reexecuções concorrentes. Sua instalação não envia avisos imediatamente: a primeira execução ocorre no próximo horário agendado.
