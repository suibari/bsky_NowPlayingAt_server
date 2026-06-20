// PostgREST access for reading enabled users and updating scrobble state

const POSTGREST_URL = process.env.POSTGREST_URL!;
const POSTGREST_KEY = process.env.POSTGREST_SERVICE_KEY!;

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${POSTGREST_KEY}`,
});

export interface EnabledUser {
  did: string;
  bsky_handle: string;
  lastfm_username: string;
  last_scrobble_key: string | null;
}

export async function getAllEnabledUsers(): Promise<EnabledUser[]> {
  const res = await fetch(`${POSTGREST_URL}/nowplayingat_sessions?enabled=eq.true`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`PostgREST error: ${res.status}`);
  return res.json();
}

export async function updateLastScrobble(did: string, key: string): Promise<void> {
  await fetch(`${POSTGREST_URL}/nowplayingat_sessions?did=eq.${encodeURIComponent(did)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ last_scrobble_key: key, last_scrobble_ts: new Date().toISOString() }),
  });
}
