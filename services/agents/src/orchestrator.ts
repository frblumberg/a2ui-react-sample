import {BASIC_CATALOG_ID, BRAND_CATALOG_ID, supportedCatalogIds, type ClientCapabilities, type TurnRequest} from '@sample/shared';
import {meterAgent} from './agents/meterAgent';
import {tariffAgent} from './agents/tariffAgent';
import {createMockTools, type Tools} from './mcp/tools';
import type {AgentContext, AgentEvent, DomainAgent, SessionState} from './types';
import {bind, brandHeader, c, msg} from './ui';
import {say, trace, ui} from './util';

const NAME = 'Orchestrator';

/** Reihenfolge = Präferenz bei der Katalog-Aushandlung. */
const CATALOG_PREFERENCE = [
  {id: BRAND_CATALOG_ID, label: 'Marken-Katalog'},
  {id: BASIC_CATALOG_ID, label: 'Basis-Katalog'},
];

/**
 * Intent-Erkennung. Platzhalter für ein LLM (z. B. Function Calling über die
 * Agent Cards der Fach-Agenten). Bewusst deterministisch, damit das Sample
 * ohne API-Key läuft und testbar bleibt.
 */
export function classifyIntent(text: string): string | null {
  if (/z(ä|ae)hler|ablesen|stand\b/i.test(text)) return meterAgent.name;
  if (/tarif|wechsel|preis|vergleich/i.test(text)) return tariffAgent.name;
  return null;
}

export class Orchestrator {
  private readonly sessions = new Map<string, SessionState>();
  private readonly agents = new Map<string, DomainAgent>([meterAgent, tariffAgent].map((a) => [a.name, a]));

  constructor(private readonly tools: Tools = createMockTools()) {}

  negotiateCatalog(caps: ClientCapabilities | undefined): string | null {
    const supported = supportedCatalogIds(caps);
    return CATALOG_PREFERENCE.find((c) => supported.includes(c.id))?.id ?? null;
  }

  async *handleTurn(req: TurnRequest): AsyncGenerator<AgentEvent> {
    const session = this.session(req.sessionId);
    const catalogId = this.negotiateCatalog(req.capabilities);
    const label = CATALOG_PREFERENCE.find((c) => c.id === catalogId)?.label;
    yield trace(`Katalog-Aushandlung → ${label ?? 'kein gemeinsamer Katalog, nur Text'}`);

    if (req.input.type === 'action') {
      const action = req.input.action;
      if (action.name === 'startIntent') {
        const agent = this.agents.get(String(action.context.agent));
        if (agent) yield* this.delegateText(session, catalogId, agent, '');
        return;
      }
      const owner = session.surfaceOwner.get(action.surfaceId);
      const agent = owner ? this.agents.get(owner) : undefined;
      if (!agent) {
        yield {kind: 'error', message: `Keine Zuständigkeit für Surface „${action.surfaceId}“ gefunden.`};
        return;
      }
      yield trace(`A2A → ${agent.name}: Aktion „${action.name}“`);
      yield* agent.onAction(this.context(session, catalogId, agent.name), action);
      return;
    }

    const text = req.input.text.trim();
    const detected = classifyIntent(text);
    if (detected && detected !== session.awaitingTextFor) session.awaitingTextFor = undefined;
    const intent = detected ?? session.awaitingTextFor ?? null;
    const agent = intent ? this.agents.get(intent) : undefined;
    if (!agent) {
      yield* this.help(session, catalogId);
      return;
    }
    yield trace(`Intent erkannt → ${agent.description}`);
    yield* this.delegateText(session, catalogId, agent, text);
  }

  private async *delegateText(session: SessionState, catalogId: string | null, agent: DomainAgent, text: string): AsyncGenerator<AgentEvent> {
    yield trace(`A2A → ${agent.name}`);
    yield* agent.onText(this.context(session, catalogId, agent.name), text);
  }

  private async *help(session: SessionState, catalogId: string | null): AsyncGenerator<AgentEvent> {
    const options = [...this.agents.values()].map((a) => a.description);
    if (!catalogId) {
      yield say(NAME, `Ich kann dir hierbei helfen:\n${options.map((o) => `• ${o}`).join('\n')}\nSchreib z. B. „Zählerstand melden“.`);
      return;
    }
    const sid = `help-${++session.surfaceCounter}`;
    session.surfaceOwner.set(sid, NAME);
    yield say(NAME, 'Das habe ich nicht ganz verstanden. Womit kann ich helfen?');
    yield ui(msg.createSurface(sid, catalogId, false));
    yield ui(msg.updateComponents(sid, [
      c.card('root', 'col'),
      c.column('col', ['header', 'opts']),
      ...brandHeader(catalogId, 'header', 'Was möchtest du tun?', bind('/hint')),
      c.row('opts', ['go-meter', 'go-tariff']),
      ...c.button('go-meter', 'Zählerstand melden', {name: 'startIntent', context: {agent: meterAgent.name}}, 'primary'),
      ...c.button('go-tariff', 'Tarife vergleichen', {name: 'startIntent', context: {agent: tariffAgent.name}}),
    ]));
    yield ui(msg.updateDataModel(sid, {hint: 'Wähle eine Option'}));
  }

  private context(session: SessionState, catalogId: string | null, agentName: string): AgentContext {
    return {
      session,
      catalogId,
      tools: this.tools,
      newSurfaceId: (prefix) => `${prefix}-${++session.surfaceCounter}`,
      state: () => {
        let s = session.agentState.get(agentName);
        if (!s) session.agentState.set(agentName, (s = {}));
        return s;
      },
    };
  }

  private session(id: string): SessionState {
    let s = this.sessions.get(id);
    if (!s) {
      s = {id, surfaceCounter: 0, surfaceOwner: new Map(), agentState: new Map()};
      this.sessions.set(id, s);
    }
    return s;
  }
}
