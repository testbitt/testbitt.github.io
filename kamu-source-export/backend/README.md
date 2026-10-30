# Backend

Included Edge Functions:
- kamu-inventory-api
- kamu-inventory-admin-data
- kamu-inventory-history

Runtime: Supabase Edge Functions / Deno / supabase-js.
Required server-side environment: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
Functions use custom session tokens, so deploy with verify_jwt disabled.
Public registration is disabled; new users are Admin-created only.
Change the Admin password/hash before exposing a new server.
