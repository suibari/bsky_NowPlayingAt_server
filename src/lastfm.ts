export interface Scrobble {
  artist: string;
  title: string;
  album: string;
  playedAt: number | null; // ms epoch。Last.fm の date.uts より。不明なら null
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

export async function getLatestScrobble(
  username: string,
): Promise<{ scrobble: Scrobble | null; isListening: boolean }> {
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
        return { scrobble: null, isListening: false };
      }

      const tracks: any[] = data?.recenttracks?.track ?? [];
      let isListening = false;
      for (const t of tracks) {
        if (t?.['@attr']?.nowplaying) {
          isListening = true;
          continue;
        }
        return {
          scrobble: {
            artist: t.artist['#text'],
            title: t.name,
            album: t.album['#text'],
            playedAt: t.date?.uts ? Number(t.date.uts) * 1000 : null,
          },
          isListening,
        };
      }
      return { scrobble: null, isListening };
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
    return { scrobble: null, isListening: false };
  }
  return { scrobble: null, isListening: false };
}
