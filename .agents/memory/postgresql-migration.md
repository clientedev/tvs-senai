---
name: PostgreSQL migration
description: Durable decisions behind removing the external backend dependency.
---

The imported app intentionally preserves the existing client call shape behind a
small compatibility layer so the admin and TV screens do not need a broad
rewrite. The implementation behind it is now the Next.js API, Replit-managed
PostgreSQL, signed HTTP-only sessions, and local uploads.

**Why:** This was the fastest low-risk path to remove the external backend
dependency while retaining the imported UI and its existing data operations.

**How to apply:** New features should call the internal API/database layer
directly or extend the compatibility layer consistently; do not reintroduce an
external auth or realtime dependency just to support these screens.