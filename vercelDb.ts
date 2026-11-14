import { Pool } from 'pg';

export type StorageEngineType = 'vercel-postgres' | 'vercel-kv' | 'local-json';

export interface StoredFileRecord {
  id: string;
  kind: string;
  filename: string;
  mime: string;
  contentBase64: string;
  textSidecar?: string;
}

export interface StoredSessionRecord {
  role: string;
  sid: string;
  nama: string;
  expires: number;
}

function getPostgresUrl(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  ).trim();
}

function getKvConfig(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (url && token) return { url: url.replace(/\/+$/, ''), token };
  return null;
}

export function detectStorageEngine(): {
  engine: StorageEngineType;
  label: string;
  isVercelCloud: boolean;
} {
  if (getPostgresUrl()) {
    return {
      engine: 'vercel-postgres',
      label: 'Vercel Postgres (PostgreSQL)',
      isVercelCloud: true
    };
  }
  if (getKvConfig()) {
    return {
      engine: 'vercel-kv',
      label: 'Vercel KV (Redis)',
      isVercelCloud: true
    };
  }
  return {
    engine: 'local-json',
    label: 'Penyimpanan Server Lokal (data/database.json)',
    isVercelCloud: false
  };
}

let pgPool: Pool | null = null;
let pgSchemaReady = false;
let pgSchemaPromise: Promise<void> | null = null;

function getPool(): Pool {
  if (pgPool) return pgPool;
  const connStr = getPostgresUrl();
  const isLocal = /localhost|127\.0\.0\.1/.test(connStr);
  pgPool = new Pool({
    connectionString: connStr,
    max: 3,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  return pgPool;
}

async function ensurePgSchema(): Promise<void> {
  if (pgSchemaReady) return;
  if (pgSchemaPromise) return pgSchemaPromise;
  pgSchemaPromise = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mk_app_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS mk_app_sessions (
        token TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        sid TEXT NOT NULL DEFAULT '',
        nama TEXT NOT NULL DEFAULT '',
        expires BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mk_app_files (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime TEXT NOT NULL,
        content_base64 TEXT NOT NULL,
        text_sidecar TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    pgSchemaReady = true;
  })().catch(err => {
    pgSchemaPromise = null;
    throw err;
  });
  return pgSchemaPromise;
}

async function kvCommand<T = any>(cmd: (string | number)[]): Promise<T | null> {
  const cfg = getKvConfig();
  if (!cfg) return null;
  const resp = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmd)
  });
  if (!resp.ok) {
    throw new Error(`Vercel KV HTTP ${resp.status}`);
  }
  const json: any = await resp.json();
  if (json.error) throw new Error(String(json.error));
  return json.result ?? null;
}

export async function loadRemoteState(): Promise<any | null> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    const res = await getPool().query('SELECT data FROM mk_app_state WHERE id = $1 LIMIT 1', ['main']);
    return res.rows[0]?.data ?? null;
  }
  if (engine === 'vercel-kv') {
    const raw = await kvCommand<string>(['GET', 'mk:app_state']);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return null;
}

export async function saveRemoteState(data: any): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO mk_app_state (id, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['main', JSON.stringify(data)]
    );
    return;
  }
  if (engine === 'vercel-kv') {
    await kvCommand(['SET', 'mk:app_state', JSON.stringify(data)]);
  }
}

export async function saveRemoteSession(token: string, session: StoredSessionRecord): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO mk_app_sessions (token, role, sid, nama, expires)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token) DO UPDATE SET
         role = EXCLUDED.role,
         sid = EXCLUDED.sid,
         nama = EXCLUDED.nama,
         expires = EXCLUDED.expires`,
      [token, session.role, session.sid, session.nama, session.expires]
    );
    return;
  }
  if (engine === 'vercel-kv') {
    const ttlSec = Math.max(60, Math.ceil((session.expires - Date.now()) / 1000));
    await kvCommand(['SET', `mk:session:${token}`, JSON.stringify(session), 'EX', ttlSec]);
  }
}

export async function loadRemoteSession(token: string): Promise<StoredSessionRecord | null> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    const res = await getPool().query(
      'SELECT role, sid, nama, expires FROM mk_app_sessions WHERE token = $1 LIMIT 1',
      [token]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      role: String(row.role),
      sid: String(row.sid || ''),
      nama: String(row.nama || ''),
      expires: Number(row.expires)
    };
  }
  if (engine === 'vercel-kv') {
    const raw = await kvCommand<string>(['GET', `mk:session:${token}`]);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return null;
}

export async function deleteRemoteSession(token: string): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query('DELETE FROM mk_app_sessions WHERE token = $1', [token]);
    return;
  }
  if (engine === 'vercel-kv') {
    await kvCommand(['DEL', `mk:session:${token}`]);
  }
}

export async function saveRemoteFile(rec: StoredFileRecord): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query(
      `INSERT INTO mk_app_files (id, kind, filename, mime, content_base64, text_sidecar)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         filename = EXCLUDED.filename,
         mime = EXCLUDED.mime,
         content_base64 = EXCLUDED.content_base64,
         text_sidecar = EXCLUDED.text_sidecar`,
      [rec.id, rec.kind, rec.filename, rec.mime, rec.contentBase64, rec.textSidecar || '']
    );
    return;
  }
  if (engine === 'vercel-kv') {
    await kvCommand(['SET', `mk:file:${rec.id}`, JSON.stringify(rec)]);
  }
}

export async function loadRemoteFile(id: string): Promise<StoredFileRecord | null> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    const res = await getPool().query(
      'SELECT id, kind, filename, mime, content_base64, text_sidecar FROM mk_app_files WHERE id = $1 LIMIT 1',
      [id]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      kind: String(row.kind),
      filename: String(row.filename),
      mime: String(row.mime),
      contentBase64: String(row.content_base64),
      textSidecar: String(row.text_sidecar || '')
    };
  }
  if (engine === 'vercel-kv') {
    const raw = await kvCommand<string>(['GET', `mk:file:${id}`]);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return null;
}

export async function deleteRemoteFile(id: string): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query('DELETE FROM mk_app_files WHERE id = $1', [id]);
    return;
  }
  if (engine === 'vercel-kv') {
    await kvCommand(['DEL', `mk:file:${id}`]);
  }
}

export async function clearAllRemoteFiles(): Promise<void> {
  const { engine } = detectStorageEngine();
  if (engine === 'vercel-postgres') {
    await ensurePgSchema();
    await getPool().query('DELETE FROM mk_app_files');
  }
}
