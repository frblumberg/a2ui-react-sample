import {createServer, type Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import type {GatewayEvent} from '@sample/shared';
import type {AgentEvent} from '@sample/agents';
import {createGateway} from '../services/gateway/src/app';
import {BRAND, turn} from './helpers';

process.env.AUDIT_LOG = 'off';

async function post(base: string, body: unknown): Promise<GatewayEvent[]> {
  const res = await fetch(`${base}/api/agent/turn`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
  expect(res.status).toBe(200);
  return (await res.text()).trim().split('\n').map((l) => JSON.parse(l));
}

describe('Gateway (HTTP, NDJSON)', () => {
  let server: Server;
  let base = '';
  beforeAll(async () => {
    server = createServer(createGateway());
    await new Promise<void>((r) => server.listen(0, r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => server.close());

  it('streamt Trace, Text und A2UI und endet mit done', async () => {
    const evs = await post(base, turn('g1', {type: 'text', text: 'Zählerstand melden'}));
    expect(evs.at(-1)).toEqual({kind: 'done'});
    expect(evs.filter((e) => e.kind === 'a2ui').length).toBe(3);
  });

  it('lehnt kaputte Anfragen ab', async () => {
    const res = await fetch(`${base}/api/agent/turn`, {method: 'POST', body: '{"sessionId":1}'});
    expect(res.status).toBe(400);
  });

  it('ersetzt ungültige UI durch Text-Fallback', async () => {
    // Agent, der einen nicht ausgehandelten Katalog benutzt
    const rogue = {
      async *handleTurn(): AsyncGenerator<AgentEvent> {
        yield {kind: 'a2ui', message: {version: 'v0.9', createSurface: {surfaceId: 'x', catalogId: 'https://evil.example/catalog.json'}}};
      },
    };
    const s = createServer(createGateway(rogue as never));
    await new Promise<void>((r) => s.listen(0, r));
    const url = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    const evs = await post(url, turn('g2', {type: 'text', text: 'x'}, BRAND));
    s.close();
    expect(evs.some((e) => e.kind === 'a2ui')).toBe(false);
    expect(evs.some((e) => e.kind === 'text' && e.agent === 'Gateway')).toBe(true);
  });
});
