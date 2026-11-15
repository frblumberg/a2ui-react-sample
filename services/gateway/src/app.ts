import {randomUUID} from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {Orchestrator} from '@sample/agents';
import {supportedCatalogIds, type GatewayEvent, type TurnRequest} from '@sample/shared';
import {SurfaceRegistry, validateA2uiMessage} from './validate';

const MAX_BODY = 64 * 1024;
const RATE_LIMIT_PER_MIN = 30;

/** Audit-Log: eine JSON-Zeile je Ereignis (in Produktion → Log-Pipeline). */
export function audit(entry: Record<string, unknown>) {
  if (process.env.AUDIT_LOG === 'off') return;
  console.log(JSON.stringify({ts: new Date().toISOString(), ...entry}));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Body zu groß'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isTurnRequest(x: unknown): x is TurnRequest {
  const r = x as TurnRequest;
  if (!r || typeof r.sessionId !== 'string' || r.sessionId.length > 100 || !r.input) return false;
  if (r.input.type === 'text') return typeof r.input.text === 'string' && r.input.text.length <= 2000;
  if (r.input.type === 'action') return typeof r.input.action?.name === 'string' && typeof r.input.action?.surfaceId === 'string';
  return false;
}

export function createGateway(orchestrator = new Orchestrator()) {
  const registry = new SurfaceRegistry();
  const hits = new Map<string, number[]>();

  function rateLimited(key: string) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > RATE_LIMIT_PER_MIN;
  }

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200, {'content-type': 'application/json'}).end(JSON.stringify({ok: true}));
      return;
    }
    if (req.method !== 'POST' || req.url !== '/api/agent/turn') {
      res.writeHead(404).end();
      return;
    }

    // Auth-Platzhalter: In Produktion hier Token prüfen (z. B. OIDC) und
    // daraus die Kunden-ID ableiten – nie aus dem Request-Body übernehmen.
    const user = String(req.headers['x-demo-user'] ?? 'demo');
    if (rateLimited(user)) {
      res.writeHead(429, {'content-type': 'application/json'}).end(JSON.stringify({error: 'Zu viele Anfragen'}));
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (!isTurnRequest(body)) {
      res.writeHead(400, {'content-type': 'application/json'}).end(JSON.stringify({error: 'Ungültige Anfrage'}));
      return;
    }

    const turn = body;
    const session = `${user}:${turn.sessionId}`;
    const allowed = supportedCatalogIds(turn.capabilities);
    const turnId = randomUUID();
    audit({turnId, session, input: turn.input.type === 'text' ? 'text' : `action:${turn.input.action.name}`});

    res.writeHead(200, {'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache'});
    const send = (ev: GatewayEvent) => res.write(JSON.stringify(ev) + '\n');
    const blocked = new Set<string>();

    try {
      for await (const ev of orchestrator.handleTurn({...turn, sessionId: session})) {
        if (ev.kind !== 'a2ui') {
          send(ev);
          continue;
        }
        const surfaceId = Object.values(ev.message).find((v) => v && typeof v === 'object')?.surfaceId ?? '?';
        if (blocked.has(surfaceId)) continue;
        const check = validateA2uiMessage(ev.message, {session, allowedCatalogIds: allowed, registry});
        if (!check.ok) {
          // Guardrail: ungültige UI nie ausliefern → Text-Fallback.
          blocked.add(surfaceId);
          audit({turnId, session, blocked: surfaceId, reason: check.reason});
          send({kind: 'text', agent: 'Gateway', text: 'Die Oberfläche konnte nicht sicher dargestellt werden. Bitte versuche es noch einmal oder schreib mir dein Anliegen.'});
          continue;
        }
        const type = Object.keys(ev.message).find((k) => k !== 'version');
        audit({turnId, session, surfaceId, a2ui: type});
        send(ev);
      }
    } catch (err) {
      audit({turnId, session, error: String(err)});
      send({kind: 'error', message: 'Interner Fehler im Agenten.'});
    }
    send({kind: 'done'});
    res.end();
  };
}
