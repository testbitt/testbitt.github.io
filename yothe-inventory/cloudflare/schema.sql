-- Yothe Inventory Cloudflare D1 schema
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','user')),
 branch TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS datasets (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('bom','wip','itemsale','stockmovement','stockcount','itemmaster')),
 branch TEXT NOT NULL DEFAULT '',
 owner_id TEXT NOT NULL REFERENCES users(id),
 rows_json TEXT NOT NULL,
 row_count INTEGER NOT NULL DEFAULT 0,
 original_file TEXT NOT NULL DEFAULT '',
 report_date TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_datasets_kind_branch ON datasets(kind,branch,updated_at);
CREATE TABLE IF NOT EXISTS audit_logs (
 id TEXT PRIMARY KEY,
 user_id TEXT,
 action TEXT NOT NULL,
 kind TEXT NOT NULL DEFAULT '',
 branch TEXT NOT NULL DEFAULT '',
 detail TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
