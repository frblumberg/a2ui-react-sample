import type {GatewayEvent, TurnRequest} from '@sample/shared';

/**
 * Schickt einen Gesprächsschritt ans Gateway und liefert die Antwort-Events,
 * sobald sie eintreffen (NDJSON-Stream: eine JSON-Zeile je Event).
 */
export async function* sendTurn(req: TurnRequest, signal?: AbortSignal): AsyncGenerator<GatewayEvent> {
  const res = await fetch('/api/agent/turn', {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-demo-user': 'demo'},
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Gateway antwortet mit ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const {done, value} = await reader.read();
    buffer += decoder.decode(value, {stream: !done});
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) yield JSON.parse(line) as GatewayEvent;
    }
    if (done) break;
  }
}
