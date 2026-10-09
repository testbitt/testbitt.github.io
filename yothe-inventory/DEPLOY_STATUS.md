# Yothe' Inventory Stock Checker — GitHub Pages + Supabase

Dedicated folder for Yothe' only; KAMU code and database must remain untouched.

## Status (2026-10-09)
- GitHub Pages: frontend deployment preparation
- Supabase project: not yet created; existing Supabase projects belong to other apps and MUST NOT be reused
- Production Login, Upload, Inventory Audit: not live until a dedicated Supabase project, RLS policies, app config, and end-to-end checks are completed

## Security and required behaviors
- Supabase Auth; restrict admin role in protected membership table (not editable user metadata)
- RLS on every public data table; user uploads isolated by auth.uid(); admin shared BOM, WIP, unit conversions
- Never store a service-role key or passwords in GitHub Pages
- Safe replacement of file imports and verified inventory audit computation, no guessed branch mappings

## Previous source
YOTHE_Vercel_Neon_v0.6_fixed.zip is an earlier server-side project and CANNOT run directly on GitHub Pages; its Node API needs replacement with Supabase Auth and RLS-backed APIs.
