# Yothe Inventory — Cloudflare Free Backend

Existing GitHub Pages frontend: https://testbitt.github.io/yothe-inventory/

## State
Frontend currently uses per-device IndexedDB/localStorage. **It is not synchronized**, and the Cloudflare backend in this folder is **source code only**. Do not claim that the system is cloud-connected until Worker deployed and frontend API integration completed.

## One-time setup (Cloudflare Free)
1. In Cloudflare dashboard create D1 database named `yothe-inventory`.
2. Edit `wrangler.toml` with actual D1 database ID.
3. Run `npx wrangler d1 execute yothe-inventory --remote --file=schema.sql` in this directory.
4. Set Worker secrets: `npx wrangler secret put SESSION_SECRET` (random long secret) and `npx wrangler secret put ADMIN_SETUP_PIN` (enter user's privately specified initial setup PIN; **never commit it**).
5. Deploy `npx wrangler deploy`; note the Worker HTTPS URL.
6. Bootstrap first admin using `POST /bootstrap` once with setup PIN and a **new admin password of at least 12 chars**. Other users can be created only by authenticated admin. Recommended: rotate/remove ADMIN_SETUP_PIN after bootstrap.
7. Add API client to frontend, store token only for user session, replace all IndexedDB/localStorage persistence with authenticated backend requests and implement spreadsheet upload -> array rows -> POST /datasets, and GET /datasets/:id on reload.
8. Validate authorization for user roles and branches; test upload, reload on another computer and data visibility boundaries.

## APIs
POST /bootstrap {pin, username, password}
POST /login {username,password} -> bearer token
GET /me
GET /users, POST /users, PUT /users/:id (admin-only)
GET /datasets?kind=bom
POST /datasets {kind,branch,rows,filename,reportDate} (BOM/WIP/itemmaster admin only)
GET /datasets/:id, DELETE /datasets/:id
GET /health

Note: This API is a foundation, not final production authentication: implement login rate limiting and secure session revocation prior to going fully public; Worker Free + D1 quotas apply. D1 stores rows as JSON and needs partitioning/pagination for large volumes.
