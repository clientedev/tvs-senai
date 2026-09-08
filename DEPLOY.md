# Guia de publicação

Este projeto usa Next.js, PostgreSQL gerenciado pelo Replit e autenticação
própria. Não são necessárias contas ou variáveis do Supabase.

## Replit

1. Mantenha `DATABASE_URL` configurado pelo banco do Replit.
2. Configure `SESSION_SECRET` com uma chave longa e aleatória.
3. Use o workflow `Start application` para validar o app na porta 5000.
4. Publique pelo fluxo de publicação do Replit.

O schema de desenvolvimento já foi criado no PostgreSQL. Ao publicar, revise a
sincronização do schema no fluxo de publicação.

## Produção

- Nunca mantenha a senha inicial `admin123`.
- `public/uploads` é armazenamento local do app; para múltiplas instâncias,
  substitua o endpoint de upload por armazenamento persistente.
- Use HTTPS para os links exibidos nas TVs.