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
   * YouTube playlist used for in-page playback (no login gate — unlike the
   * Spotify embed). Change the `list=` id to swap the on-site radio.
   */
  youtubePlaylistUrl:
    'https://www.youtube.com/playlist?list=PLwe4fFMaJo2c-Cj5DlnKEvbI3v29dBkP3',

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
      title: 'Tujhe Dekha To',
      artist: 'Lata Mangeshkar, Kumar Sanu',
      durationSec: 5 * 60 + 22,
      href: 'https://open.spotify.com/track/6nek1Nin9q48AVZcWs9e9D',
    },
    {
      title: 'Pehla Nasha',
      artist: 'Udit Narayan, Sadhana Sargam',
      durationSec: 4 * 60 + 55,
      href: 'https://open.spotify.com/track/2QRIvzk9M6dGwSfSLYSVIm',
    },
    {
      title: 'Kuch Kuch Hota Hai',
      artist: 'Udit Narayan, Alka Yagnik',
      durationSec: 5 * 60 + 25,
      href: 'https://open.spotify.com/track/1Ck4dQvCyfPFqBQdrx1V4A',
    },
    {
      title: 'Chura Ke Dil Mera',
      artist: 'Kumar Sanu, Alka Yagnik',
      durationSec: 5 * 60 + 12,
      href: 'https://open.spotify.com/track/2rB4hM4WkuXcRIrGMcU9uT',
    },
    {
      title: 'Dil To Pagal Hai',
      artist: 'Lata Mangeshkar, Udit Narayan',
      durationSec: 6 * 60 + 12,
      href: 'https://open.spotify.com/track/3vX2juCTaAOKX9AKl7CQXt',
    },
    {
      title: 'Tip Tip Barsa Paani',
      artist: 'Alka Yagnik, Udit Narayan',
      durationSec: 5 * 60 + 12,
      href: 'https://open.spotify.com/track/2fkjXHhHtNq8Xn0iM2Kj3P',
    },
    {
      title: 'Tadap Tadap',
      artist: 'K.K.',
      durationSec: 7 * 60 + 5,
      href: 'https://open.spotify.com/track/6JvVJfHqfwXPXVvW1n2v6e',
    },
    {
      title: 'Aankhon Ki Gustakhiyan',
      artist: 'Kumar Sanu, Alka Yagnik',
      durationSec: 6 * 60 + 30,
      href: 'https://open.spotify.com/track/6zC5uT8Sl5oPZbFm4b0EIe',
    },
    {
      title: 'Chaiyya Chaiyya',
      artist: 'Sukhwinder Singh, Sapna Awasthi',
      durationSec: 6 * 60 + 52,
      href: 'https://open.spotify.com/track/0eb7yz0KY0uEuvT4Zjq6NN',
    },
    {
      title: 'Kabhi Kabhi Aditi',
      artist: 'Rashid Ali',
      durationSec: 4 * 60 + 23,
      href: 'https://open.spotify.com/track/6Q5ADmBhqcAjnj5b6QYwsz',
    },
    {
      title: 'Tum Se Hi',
      artist: 'Mohit Chauhan',
      durationSec: 5 * 60 + 22,
      href: 'https://open.spotify.com/track/5Fk9CqADq5RmVOOecdrN1D',
    },
    {
      title: 'Kabhi Kabhie Mere Dil Mein',
      artist: 'Mukesh',
      durationSec: 5 * 60 + 26,
      href: 'https://open.spotify.com/track/1u60xqIP2n7uxg7YkKt9pZ',
    },
    {
      title: 'Aap Ki Aankhon Mein Kuch',
      artist: 'Kishore Kumar, Lata Mangeshkar',
      durationSec: 5 * 60 + 16,
      href: 'https://open.spotify.com/track/3fw3ojDzWZ4WmnV7f4mL8p',
    },
    {
      title: 'Ae Mere Humsafar',
      artist: 'Anuradha Paudwal, Kumar Sanu',
      durationSec: 5 * 60 + 40,
      href: 'https://open.spotify.com/track/1n3hgYobRIsN2P6UnFkqIm',
    },
  ] as const satisfies readonly Track[],
} as const;

export type SiteConfig = typeof site;
