import type { APIRoute } from 'astro';

export const prerender = false;

type PresenceRoomStub = {
  ping(sessionId: string, leaving: boolean): Promise<number>;
  count(): Promise<number>;
};

type PresenceNamespace = {
  getByName(name: string): PresenceRoomStub;
};

type RateLimiter = {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
};

type Env = {
  PRESENCE?: PresenceNamespace;
  PRESENCE_RATE_LIMITER?: RateLimiter;
};

function getEnv(locals: App.Locals | any): Env {
  const runtime = (locals as any)?.runtime;
  return (runtime?.env ?? {}) as Env;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isValidSessionId(id: string | null | undefined): id is string {
  return !!id && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

// Reject requests whose Origin header doesn't match the request's own
// origin. A missing Origin (some browsers omit it for same-origin requests,
// and sendBeacon doesn't always send one) is allowed through -- this is a
// lightweight anti-abuse check, not an auth boundary.
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function checkRateLimit(env: Env, clientAddress: string | undefined): Promise<boolean> {
  if (!env.PRESENCE_RATE_LIMITER) return true;
  // clientAddress can be empty (e.g. missing cf-connecting-ip in local dev);
  // fall back to a shared key so those requests still share one bucket
  // rather than bypassing the limiter entirely.
  const key = clientAddress || 'unknown';
  try {
    const { success } = await env.PRESENCE_RATE_LIMITER.limit({ key });
    return success;
  } catch (err) {
    console.error('presence rate limit error', err);
    // If the rate limiter itself errors, fail open rather than take the
    // feature down over it.
    return true;
  }
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = getEnv(locals);

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: 'bad_origin' }, 403);
  }

  if (!(await checkRateLimit(env, clientAddress))) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  if (!env.PRESENCE) {
    // Graceful fallback so the site never breaks if the binding isn't wired.
    return jsonResponse({ count: 1 });
  }

  let sessionId: string | undefined;
  let leaving = false;
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      leaving?: boolean;
    };
    sessionId = body.sessionId;
    leaving = !!body.leaving;
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!isValidSessionId(sessionId)) {
    return jsonResponse({ error: 'invalid_session' }, 400);
  }

  try {
    const room = env.PRESENCE.getByName('global');
    const count = await room.ping(sessionId, leaving);
    return jsonResponse({ count });
  } catch (err) {
    console.error('presence error', err);
    return jsonResponse({ count: 1, error: 'upstream' });
  }
};

export const GET: APIRoute = async ({ locals, clientAddress }) => {
  const env = getEnv(locals);

  if (!(await checkRateLimit(env, clientAddress))) {
    return jsonResponse({ error: 'rate_limited' }, 429);
  }

  if (!env.PRESENCE) {
    return jsonResponse({ count: 1 });
  }

  try {
    const room = env.PRESENCE.getByName('global');
    const count = await room.count();
    return jsonResponse({ count });
  } catch (err) {
    console.error('presence GET error', err);
    return jsonResponse({ count: 1, error: 'upstream' });
  }
};
