import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface EnabledUser {
  did: string;
  bsky_handle: string;
  lastfm_username: string;
  last_scrobble_key: string | null;
}

export async function getAllEnabledUsers(): Promise<EnabledUser[]> {
  const res = await pool.query<EnabledUser>(
    'SELECT did, bsky_handle, lastfm_username, last_scrobble_key FROM nowplayingat.sessions WHERE enabled = true'
  );
  return res.rows;
}

export async function updateLastScrobble(did: string, key: string): Promise<void> {
  await pool.query(
    'UPDATE nowplayingat.sessions SET last_scrobble_key = $1, last_scrobble_ts = now() WHERE did = $2',
    [key, did]
  );
}
