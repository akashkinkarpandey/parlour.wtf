// Central site configuration for Khoobsurati (parlour.wtf).
// Update the playlist URLs and track list here to reshape the site
// without touching layout code.

export type Track = {
  /** Display title */
  title: string;
  /** Artist(s) as one string, e.g. "Alka Yagnik, Kumar Sanu" */
  artist: string;
  /** Track length in seconds */
  durationSec: number;
  /**
   * Deep-link that plays the track on Spotify or YouTube (Music).
   * Falls back to the playlist URL if absent.
   */
  href?: string;
  /**
   * YouTube video ID that actually plays this exact song for in-page
   * playback. Verified per-track (not a shared playlist) so the audio
   * always matches `title`/`artist` above.
   */
  youtubeId: string;
};

export const site = {
  domain: 'parlour.wtf',
  name: 'Khoobsurati',
  nameDevanagari: 'खूबसूरती',
  tagline: 'अंदर से भी, बाहर से भी',
  taglineEnglish: 'beauty, from within and from without',
  title:
    'Khoobsurati — 90s Bollywood that played at your neighborhood parlour',
  description:
    'A ladies’ parlour, a chai, and 90s Bollywood on the radio. Beauty from within and without.',
  ogImage: '/og.jpg',

  // Curated playlists. Replace with your own once you’ve built them.
  spotifyPlaylistUrl:
    'https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFmNBRM',
  ytMusicPlaylistUrl:
    'https://music.youtube.com/playlist?list=PLwe4fFMaJo2c-Cj5DlnKEvbI3v29dBkP3',

  /**
   * Fixed epoch (ms) used to compute the currently-playing track so that
   * every visitor sees roughly the same song at the same time. Do not change
   * casually — it resets the shared listening room.
   */
  epochStart: Date.parse('2025-01-01T00:00:00Z'),

  /**
   * The looping playlist. Track times below are rough — they only need to
   * be close enough for the illusion of a synced room. Update the deep links
   * whenever a track’s canonical URL changes.
   */
  tracks: [
    {
      title: 'Kabhi Kabhi Aditi',
      artist: 'Rashid Ali',
      durationSec: 4 * 60 + 23,
      href: 'https://open.spotify.com/track/6Q5ADmBhqcAjnj5b6QYwsz',
      youtubeId: 'HIbzXaBdwZw',
    },
    {
      // Swapped from "Aap Ki Aankhon Mein Kuch" (1978) — outside the site's
      // 90s theme; this keeps the same singers and adds a mehndi/parlour tie-in.
      title: 'Mehndi Laga Ke Rakhna',
      artist: 'Lata Mangeshkar, Udit Narayan',
      durationSec: 6 * 60 + 45,
      youtubeId: 'whIiIMiIic4',
    },
    {
      // Swapped from "Kuch Kuch Hota Hai" — its YouTube ID only played a
      // 7-second clip, not the full song.
      title: 'Tujhe Dekha To',
      artist: 'Lata Mangeshkar, Kumar Sanu',
      durationSec: 5 * 60 + 2,
      href: 'https://open.spotify.com/track/6dFQ3W3xuG4ll7cNjIsN2Q',
      youtubeId: 'cNV5hLSa9H8',
    },
    {
      title: 'Chura Ke Dil Mera',
      artist: 'Kumar Sanu, Alka Yagnik',
      durationSec: 5 * 60 + 12,
      href: 'https://open.spotify.com/track/2rB4hM4WkuXcRIrGMcU9uT',
      youtubeId: 'K36hWxnVb1A',
    },
  ] as const satisfies readonly Track[],
} as const;

export type SiteConfig = typeof site;
