// The Movie Database (TMDB) lookups for the watch list: posters, year, and
// where it's streaming in the US (streaming data is from JustWatch via TMDB).
// Accepts either a v3 "API Key" or a v4 "API Read Access Token".
const BASE = 'https://api.themoviedb.org/3'
export const poster = (path, size = 'w92') => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null)

async function get(key, path, params = {}) {
  const bearer = key.length > 60
  const q = new URLSearchParams({ ...params, ...(bearer ? {} : { api_key: key }) })
  const res = await fetch(`${BASE}${path}?${q}`, {
    headers: bearer ? { Authorization: `Bearer ${key}`, accept: 'application/json' } : { accept: 'application/json' },
  })
  if (res.status === 401) throw new Error('TMDB didn’t accept that key. Check it in Settings.')
  if (!res.ok) throw new Error(`TMDB lookup failed (${res.status}).`)
  return res.json()
}

// Movies and shows matching a title, best first.
export async function search(key, query) {
  const data = await get(key, '/search/multi', { query, include_adult: 'false', language: 'en-US', page: '1' })
  return (data.results || [])
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 6)
    .map((r) => ({
      tmdbId: r.id,
      mediaType: r.media_type,
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || '').slice(0, 4),
      poster: r.poster_path || null,
    }))
}

// Subscription services in the US ("Netflix, Max"); falls back to rent/buy if none.
export async function providers(key, mediaType, id) {
  const data = await get(key, `/${mediaType}/${id}/watch/providers`)
  const us = data.results?.US
  if (!us) return ''
  const list = us.flatrate || us.free || us.ads || []
  if (list.length) return list.slice(0, 3).map((p) => p.provider_name).join(', ')
  if (us.rent?.length) return `Rent: ${us.rent.slice(0, 2).map((p) => p.provider_name).join(', ')}`
  return ''
}

// TMDB names movie and TV genres a little differently; fold the pairs together
// so a sci-fi movie and a sci-fi show land in the same group.
const GENRE_ALIAS = {
  'Science Fiction': 'Sci-Fi', 'Sci-Fi & Fantasy': 'Sci-Fi', 'Action & Adventure': 'Action',
  'War & Politics': 'War', 'TV Movie': 'Movie night',
}
// Genre names for a title, e.g. ['Drama', 'Sci-Fi'].
export async function genres(key, mediaType, id) {
  const data = await get(key, `/${mediaType}/${id}`, { language: 'en-US' })
  return [...new Set((data.genres || []).map((g) => GENRE_ALIAS[g.name] || g.name))]
}

// Everything to store on a watch item for a chosen match.
export async function details(key, match) {
  let where = '', g = []
  try { where = await providers(key, match.mediaType, match.tmdbId) } catch { /* keep going without it */ }
  try { g = await genres(key, match.mediaType, match.tmdbId) } catch { /* same */ }
  return {
    tmdbId: match.tmdbId, mediaType: match.mediaType, poster: match.poster || null, year: match.year || '',
    kind: match.mediaType === 'tv' ? 'show' : 'movie', where, genres: g,
  }
}

// After adding a title by name: fill poster/where only when TMDB has an exact title match.
export async function autoMatch(be, key, id, title) {
  if (!key) return
  try {
    const hits = await search(key, title)
    const m = hits.find((h) => h.title.toLowerCase() === title.trim().toLowerCase())
    if (m) {
      const d = await details(key, m)
      await be.update('watch', id, d)
    }
  } catch { /* lookups are a bonus; ignore failures */ }
}
