import {BASIC_CATALOG_ID, BRAND_CATALOG_ID, type A2uiMessage, type TurnInput, type TurnRequest} from '@sample/shared';
import type {AgentEvent} from '@sample/agents';

export const caps = (ids: string[]) => ({'v0.9': {supportedCatalogIds: ids}});
export const BRAND = caps([BRAND_CATALOG_ID, BASIC_CATALOG_ID]);
export const BASIC = caps([BASIC_CATALOG_ID]);
export const NONE = caps([]);

export function turn(sessionId: string, input: TurnInput, capabilities = BRAND): TurnRequest {
  return {sessionId, input, capabilities};
}

export async function collect(gen: AsyncGenerator<AgentEvent>): Promise<AgentEvent[]> {
  const out: AgentEvent[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

export const a2ui = (evs: AgentEvent[]): A2uiMessage[] => evs.flatMap((e) => (e.kind === 'a2ui' ? [e.message] : []));
export const texts = (evs: AgentEvent[]) => evs.flatMap((e) => (e.kind === 'text' ? [e.text] : []));

export function action(surfaceId: string, name: string, context: Record<string, unknown> = {}): TurnInput {
  return {type: 'action', action: {name, surfaceId, sourceComponentId: 'test', timestamp: new Date().toISOString(), context}};
}

export function surfaceIdOf(msgs: A2uiMessage[]): string {
  const m = msgs.find((x) => 'createSurface' in x);
  if (!m || !('createSurface' in m)) throw new Error('keine Surface');
  return m.createSurface.surfaceId;
}

export function componentsOf(msgs: A2uiMessage[]) {
  return msgs.flatMap((m) => ('updateComponents' in m ? m.updateComponents.components : []));
}
