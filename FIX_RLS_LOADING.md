# Solução para carregamento da TV

O app não usa RLS ou Supabase. As telas públicas consultam a API Next.js, que
lê o PostgreSQL diretamente e permite apenas o heartbeat `last_seen` da TV sem
login. As alterações administrativas exigem a sessão do painel.

Se uma TV não carregar:

1. Confirme que a URL contém `?token=...`.
2. Confira se o token existe em **Administração > TVs**.
3. Abra o console do navegador e verifique se o workflow está ativo.
4. Limpe o cache local da TV e tente novamente.