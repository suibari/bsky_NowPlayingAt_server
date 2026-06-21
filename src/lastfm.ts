export interface Scrobble {
  artist: string;
  title: string;
  album: string;
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

export async function getLatestScrobble(username: string): Promise<Scrobble | null> {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', 'user.getRecentTracks');
  url.searchParams.set('user', username);
  url.searchParams.set('api_key', process.env.LASTFM_API_KEY!);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '2');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url.toString());

    if (res.ok) {
      const data = await res.json();
      if (data.error) {
        console.warn(`[lastfm] API error for ${username}: ${data.message}`);
        return null;
      }

      const tracks: any[] = data?.recenttracks?.track ?? [];
      for (const t of tracks) {
        // Skip currently-playing (not yet scrobbled)
        if (t?.['@attr']?.nowplaying) continue;
        return {
          artist: t.artist['#text'],
          title: t.name,
          album: t.album['#text'],
        };
      }
      return null;
    }

    const bodyText = await res.text().catch(() => '(unreadable)');
    let detail = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.error != null) detail = `API error ${parsed.error}: ${parsed.message}`;
    } catch {}

    if (res.status === 500 && attempt < MAX_ATTEMPTS) {
      console.warn(`[lastfm] HTTP 500 for user ${username} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${RETRY_DELAY_MS}ms — ${detail}`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      continue;
    }

    console.warn(`[lastfm] HTTP ${res.status} for user ${username} — ${detail}`);
    return null;
  }
  return null;
}
