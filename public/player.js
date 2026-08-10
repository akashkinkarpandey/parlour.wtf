// Plain static file (not run through Astro/Vite) so it always renders as a
// genuine external <script src="/player.js">, never inlined into the page
// HTML -- that's what lets the Content-Security-Policy require script-src
// 'self' without 'unsafe-inline'. See public/_headers.
(function () {
  const cfg = JSON.parse(document.getElementById('site-cfg').textContent || '{}');
  const tracks = cfg.tracks || [];
  const epoch = Number(cfg.epochStart) || 0;
  const total = tracks.reduce((s, t) => s + t.durationSec, 0) || 1;

  const $ = (id) => document.getElementById(id);
  const elTitle = $('track-title');
  const elArtist = $('track-artist');
  const elElapsed = $('time-elapsed');
  const elTotal = $('time-total');
  const elBar = $('bar-fill');
  const elPlay = $('btn-play');
  const elArt = $('btn-art');
  const elPrev = $('btn-prev');
  const elNext = $('btn-next');
  const elCount = $('online-count');
  const elPlayer = $('player');
  const elEmbedMount = $('embed-mount');
  const iconPlay = $('icon-play');
  const iconPause = $('icon-pause');

  let userOffsetTracks = 0;
  let embedController = null;
  let embedReady = false;
  let embedIsPlaying = false;
  // Set once real audio has actually been confirmed playing at least
  // once. From then on the progress bar trusts the embed's own clock
  // instead of the shared-room simulation -- but unlike before, it
  // never gets hidden: it just shows the real (possibly paused) time.
  let realAudioConfirmed = false;
  // Set when the user hits play before the embed has finished
  // bootstrapping, so we can honor it the moment it's ready.
  let pendingPlay = false;
  // Index into YT_IDS of whatever's actually loaded in the embed.
  let playIndex = 0;
  // Guards against a track that neither errors nor ever reaches
  // PLAYING (a region block that doesn't fire onError, a stuck ad, a
  // dead stream) -- without this the UI just sits there silently
  // forever with the bar "moving" off the ambient clock and no sound.
  let playWatchdog = null;

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function currentTrack() {
    if (!tracks.length) return null;
    const elapsedTotal = ((Date.now() - epoch) / 1000) % total;
    let acc = 0;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (elapsedTotal < acc + t.durationSec) {
        return { i, into: elapsedTotal - acc };
      }
      acc += t.durationSec;
    }
    return { i: 0, into: 0 };
  }

  function activeIndex() {
    const cur = currentTrack();
    if (!cur) return 0;
    return (cur.i + userOffsetTracks + tracks.length * 1000) % tracks.length;
  }

  // Verified per-track video IDs, in the same order as `tracks` — not an
  // external playlist, so what plays always matches the title/artist.
  const YT_IDS = tracks.map(function (t) { return t.youtubeId; }).filter(Boolean);

  function clearWatchdog() {
    if (playWatchdog) {
      clearTimeout(playWatchdog);
      playWatchdog = null;
    }
  }

  // Arms a timer when playback is requested. If PLAYING isn't confirmed
  // by the time it fires, this track is dead -- skip forward instead of
  // leaving the ambient clock ticking over silence forever.
  function armWatchdog() {
    clearWatchdog();
    const targetIndex = playIndex;
    playWatchdog = setTimeout(function () {
      if (!embedIsPlaying && playIndex === targetIndex) {
        loadTrack(playIndex + 1, true);
      }
    }, 6000);
  }

  function setPlayIcon(isPlaying) {
    embedIsPlaying = isPlaying;
    if (isPlaying) {
      realAudioConfirmed = true;
      clearWatchdog();
    }
    if (iconPlay && iconPause) {
      iconPlay.classList.toggle('is-hidden', isPlaying);
      iconPause.classList.toggle('is-hidden', !isPlaying);
    }
    elPlay.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  // Single source of truth for what's on screen. Once real audio has
  // ever been confirmed, the embed's own clock drives the bar (accurate,
  // never disagrees with what's actually audible -- including while
  // paused). Before that, the shared epoch simulation drives it, so the
  // "room" still feels alive before anyone presses play.
  function render() {
    const idx = realAudioConfirmed ? playIndex : activeIndex();
    const t = tracks[idx];
    if (!t) return;
    elTitle.textContent = t.title;
    elArtist.textContent = t.artist;

    let into = 0;
    let durationSec = t.durationSec;
    if (realAudioConfirmed && embedController && embedController.getCurrentTime) {
      try {
        into = embedController.getCurrentTime() || 0;
        durationSec = embedController.getDuration() || t.durationSec;
      } catch (e) {}
    } else {
      // Don't show a fake "already X seconds in" position before the
      // user presses play -- real playback always starts a track from
      // 0:00, so showing anything else here would make the bar visibly
      // snap backwards the instant audio actually starts, which reads
      // as broken. The track *selection* still rotates on the shared
      // clock (via activeIndex above); only the numeric position doesn't.
      into = 0;
    }
    elTotal.textContent = fmt(durationSec);
    elElapsed.textContent = fmt(into);
    const pct = Math.min(100, Math.max(0, (into / durationSec) * 100));
    elBar.style.width = pct + '%';
  }

  /* YouTube IFrame API integration — no login gate, and gives us real
   * prev/next control over the playlist. */
  function ensureYouTubeScript() {
    if (window.__ytScriptRequested) return;
    window.__ytScriptRequested = true;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
  }

  // Bootstrap the embed as soon as the page loads (not on first click) so
  // that by the time the user actually presses play, the player already
  // exists and playVideo() runs synchronously inside the click handler.
  // Calling playVideo() only after an async script-load + player-init
  // chain breaks the browser's "direct user gesture" association, which
  // silently blocks audio — that's the "bar moves, no sound" bug.
  function mountYouTube() {
    if (!YT_IDS.length || !elEmbedMount || embedController) return;
    elEmbedMount.innerHTML = '';
    const holder = document.createElement('div');
    holder.id = 'yt-player';
    elEmbedMount.appendChild(holder);
    embedController = new window.YT.Player('yt-player', {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: function () {
          embedReady = true;
          playIndex = activeIndex();
          // Silently cue (not play) whatever track the shared clock
          // currently points at, so the first real playVideo() has
          // something already loaded to act on.
          try { embedController.cueVideoById(YT_IDS[playIndex]); } catch (e) {}
          if (pendingPlay) {
            pendingPlay = false;
            armWatchdog();
            try { embedController.playVideo(); } catch (e) {}
          }
        },
        onStateChange: function (e) {
          // YT.PlayerState: PLAYING===1, PAUSED===2, ENDED===0
          if (e.data === 1) {
            setPlayIcon(true);
            elPlayer.classList.add('is-live');
            render();
          } else if (e.data === 2) {
            setPlayIcon(false);
          } else if (e.data === 0) {
            loadTrack(playIndex + 1, true);
          }
        },
        // A track that turns out to be unplayable (e.g. embedding
        // disabled) shouldn't stall the radio — skip to the next one.
        onError: function () {
          loadTrack(playIndex + 1, true);
        },
      },
    });
  }

  window.onYouTubeIframeAPIReady = function () { mountYouTube(); };
  ensureYouTubeScript();

  // cueVideoById/loadVideoById on a single video ID — the standard,
  // reliable YT IFrame API calls (unlike the playlist-array methods,
  // which silently no-op when passed the wrong argument shape).
  function loadTrack(idx, autoplay) {
    if (!embedController || !YT_IDS.length) return;
    playIndex = ((idx % YT_IDS.length) + YT_IDS.length) % YT_IDS.length;
    render();
    try {
      if (autoplay) {
        armWatchdog();
        embedController.loadVideoById(YT_IDS[playIndex]);
      } else {
        embedController.cueVideoById(YT_IDS[playIndex]);
      }
    } catch (e) {}
  }

  function togglePlay() {
    if (embedController && embedReady) {
      try {
        const state = embedController.getPlayerState && embedController.getPlayerState();
        if (state === 1) {
          embedController.pauseVideo();
        } else {
          armWatchdog();
          embedController.playVideo();
        }
      } catch (e) {}
      return;
    }
    // Embed hasn't finished bootstrapping yet (slow connection) — queue
    // the intent and let onReady honor it the instant it can.
    pendingPlay = true;
    if (window.YT && window.YT.Player) mountYouTube();
    else ensureYouTubeScript();
  }

  function stepTrack(delta) {
    if (!embedController) { render(); return; }
    loadTrack(playIndex + delta, true);
  }

  elPlay && elPlay.addEventListener('click', togglePlay);
  elArt && elArt.addEventListener('click', togglePlay);

  elPrev && elPrev.addEventListener('click', function () {
    userOffsetTracks -= 1;
    stepTrack(-1);
  });
  elNext && elNext.addEventListener('click', function () {
    userOffsetTracks += 1;
    stepTrack(1);
  });

  render();
  setInterval(function () {
    // Self-heal: trust the embed's own reported state over our cached
    // flag every tick, since a missed/late onStateChange event
    // (buffering hiccups, ad breaks) would otherwise leave the play
    // icon and progress bar showing something that doesn't match
    // reality -- exactly the "play icon says playing, bar is moving,
    // no sound" desync.
    if (embedController && embedController.getPlayerState) {
      let state;
      try { state = embedController.getPlayerState(); } catch (e) { state = null; }
      if (state !== null) {
        const reallyPlaying = state === 1;
        if (reallyPlaying !== embedIsPlaying) setPlayIcon(reallyPlaying);
      }
    }
    render();
  }, 1000);

  /* Presence */
  const KEY = 'parlour_sid';
  function makeSid() {
    try {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return String(Math.random()).slice(2) + String(Date.now());
    }
  }
  let sid;
  try {
    sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = makeSid();
      localStorage.setItem(KEY, sid);
    }
  } catch {
    sid = makeSid();
  }

  async function ping(leaving) {
    try {
      if (leaving && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ sessionId: sid, leaving: true })], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/presence', blob);
        return;
      }
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
        keepalive: true,
      });
      const data = await res.json();
      if (typeof data.count === 'number' && elCount) {
        elCount.textContent = String(Math.max(1, data.count));
      }
    } catch {}
  }

  ping(false);
  // Skip ticks while the tab is hidden -- a backgrounded tab has no
  // listener to keep "online" for, and every tick is a Worker
  // invocation plus an Upstash command. visibilitychange below covers
  // the immediate re-ping the instant it's foregrounded again.
  setInterval(function () {
    if (document.visibilityState === 'visible') ping(false);
  }, 20_000);
  window.addEventListener('pagehide', function () { ping(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') ping(false);
  });
})();
