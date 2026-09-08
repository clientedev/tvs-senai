# Configuração da TV Corporativa

O projeto não depende mais do Supabase. O banco PostgreSQL de desenvolvimento é
provisionado pelo Replit e fica disponível em `DATABASE_URL`.

Para executar localmente fora do Replit, configure:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=uma-chave-longa-e-aleatoria
```

O schema e o usuário inicial já foram criados no banco de desenvolvimento.
