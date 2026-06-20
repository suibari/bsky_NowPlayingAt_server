export interface Scrobble {
  artist: string;
  title: string;
  album: string;
}

export async function getLatestScrobble(username: string): Promise<Scrobble | null> {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.searchParams.set('method', 'user.getRecentTracks');
  url.searchParams.set('user', username);
  url.searchParams.set('api_key', process.env.LASTFM_API_KEY!);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '2');

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn(`[lastfm] HTTP ${res.status} for user ${username}`);
    return null;
  }

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
