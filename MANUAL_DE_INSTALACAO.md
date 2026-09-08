# Manual de instalação

## Replit

1. Abra o projeto no Replit.
2. O PostgreSQL gerenciado já está disponível em `DATABASE_URL`.
3. Inicie o workflow **Start application**.
4. Acesse `/login` e entre com `admin@sp.senai.br` / `admin123`.

O app usa autenticação própria por cookie HTTP-only, PostgreSQL para os dados e
`public/uploads` para os arquivos enviados no painel. Nenhuma conta ou variável
do Supabase é necessária.

## Execução local

```bash
npm install
DATABASE_URL=postgresql://... SESSION_SECRET=chave-local npm run dev
```