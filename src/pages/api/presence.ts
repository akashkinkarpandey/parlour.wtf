import type { APIRoute } from 'astro';

export const prerender = false;

// Sessions expire after 30 seconds of no ping.
const TTL_MS = 30_000;

type Env = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

function getEnv(locals: App.Locals | any): Env {
  const runtime = (locals as any)?.runtime;
  const cfEnv = runtime?.env ?? {};
  return {
    UPSTASH_REDIS_REST_URL:
      cfEnv.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:
      cfEnv.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function pipeline(env: Env, commands: (string | number)[][]) {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    throw new Error(`upstash ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as Array<{ result?: unknown; error?: string }>;
}

const KEY = 'parlour:presence';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function updatePresence(env: Env, sessionId: string, remove = false) {
  const now = Date.now();
  const cutoff = now - TTL_MS;
  const commands: (string | number)[][] = [
    ['ZREMRANGEBYSCORE', KEY, '-inf', String(cutoff)],
  ];
  if (remove) {
    commands.push(['ZREM', KEY, sessionId]);
  } else {
    commands.push(['ZADD', KEY, String(now), sessionId]);
    commands.push(['PEXPIRE', KEY, String(TTL_MS * 4)]);
  }
  commands.push(['ZCARD', KEY]);

  const results = await pipeline(env, commands);
  const zcard = results[results.length - 1]?.result;
  const count = typeof zcard === 'number' ? zcard : Number(zcard ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function isValidSessionId(id: string | null | undefined): id is string {
  return !!id && /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // Graceful fallback so the site never breaks if the KV isn't wired yet.
    return jsonResponse({ count: 1, configured: false });
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
    const count = await updatePresence(env, sessionId, leaving);
    return jsonResponse({ count, configured: true });
  } catch (err) {
    console.error('presence error', err);
    return jsonResponse({ count: 1, configured: false, error: 'upstream' });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  const env = getEnv(locals);
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return jsonResponse({ count: 1, configured: false });
  }
  try {
    const now = Date.now();
    const cutoff = now - TTL_MS;
    const results = await pipeline(env, [
      ['ZREMRANGEBYSCORE', KEY, '-inf', String(cutoff)],
      ['ZCARD', KEY],
    ]);
    const zcard = results[1]?.result;
    const count = typeof zcard === 'number' ? zcard : Number(zcard ?? 0);
    return jsonResponse({ count, configured: true });
  } catch (err) {
    console.error('presence GET error', err);
    return jsonResponse({ count: 1, configured: false, error: 'upstream' });
  }
};
