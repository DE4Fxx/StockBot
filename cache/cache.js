import Database from 'better-sqlite3';

// Create DB connection
const db = new Database('./cache/cache.db');

// Create table (runs only once)
db.prepare(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`).run();

export function setCache(key, value) {
  const json = JSON.stringify(value);
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO cache (key, value, timestamp)
    VALUES (?, ?, ?)
  `).run(key, json, now);
}

export function getCache(key) {
  const row = db.prepare(`
    SELECT value, timestamp FROM cache WHERE key = ?
  `).get(key);
  if (!row) return null;
  return {
    value: JSON.parse(row.value),
    timestamp: row.timestamp,
  };
}

// For partial matches

export function getPartialMatchFromCache(key) {
  const pattern = `%${key}%`;
  const rows = db.prepare(`
    SELECT value, timestamp FROM cache WHERE key LIKE ?
  `).all(pattern);
  if (!rows.length) return null;
  return rows.map((row) => ({
    value: JSON.parse(row.value),
    timestamp: row.timestamp
  }));
}


export function deleteSummaryRowFromCache(key) {
  const info = db.prepare(`DELETE FROM cache WHERE key = ?`).run(key + ':SUMMARY');
  return info.changes > 0 ? 'Successfully deleted row from cache!' : null;
}

export function deleteNewsRowFromCache(key) {
  const info = db.prepare(`DELETE FROM cache WHERE key = ?`).run(key + ':NEWS');
  return info.changes > 0 ? 'Successfully deleted row from cache!' : null;
}

export function rawDeleteFromCache(key) {
  const info = db.prepare(`DELETE FROM cache WHERE key = ?`).run(key);
  return info.changes > 0 ? 'Successfully deleted row from cache!' : null;
}