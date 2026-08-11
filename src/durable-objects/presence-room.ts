// A single Durable Object instance that tracks recently-seen anonymous
// session IDs in memory, so /api/presence can report a live "online now"
// count without any external database. State lives only in this instance's
// memory -- it's discarded the moment Cloudflare evicts/restarts the
// object, which is fine: presence is meant to be ephemeral, never persisted.

// A session counts as "online" if it pinged within this window. The client
// pings every 20s (see public/player.js), so this gives headroom for a
// missed tick or network hiccup without letting stale sessions linger.
const ONLINE_WINDOW_MS = 45_000;

// Per-session server-side throttle: a ping for the same session ID within
// this window of the last one is a no-op. Stops a single client (buggy or
// malicious) from inflating write volume even if it gets past rate limiting.
const MIN_PING_INTERVAL_MS = 5_000;

// Defensive cap on distinct sessions tracked at once. Without this, a flood
// of forged session IDs (each passing IP rate limiting from a different
// address) could grow this object's memory without bound.
const MAX_SESSIONS = 5_000;

import { DurableObject } from 'cloudflare:workers';

export class PresenceRoom extends DurableObject {
  private sessions = new Map<string, number>();

  private prune(now: number) {
    const cutoff = now - ONLINE_WINDOW_MS;
    for (const [id, lastSeen] of this.sessions) {
      if (lastSeen < cutoff) this.sessions.delete(id);
    }
  }

  async ping(sessionId: string, leaving: boolean): Promise<number> {
    const now = Date.now();
    this.prune(now);

    if (leaving) {
      this.sessions.delete(sessionId);
      return this.sessions.size;
    }

    const lastSeen = this.sessions.get(sessionId);
    const isNew = lastSeen === undefined;
    if (isNew && this.sessions.size >= MAX_SESSIONS) {
      // At capacity -- drop the ping rather than grow unbounded.
      return this.sessions.size;
    }
    if (isNew || now - lastSeen >= MIN_PING_INTERVAL_MS) {
      this.sessions.set(sessionId, now);
    }
    return this.sessions.size;
  }

  async count(): Promise<number> {
    this.prune(Date.now());
    return this.sessions.size;
  }
}
