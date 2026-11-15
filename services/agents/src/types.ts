import type {A2uiAction, A2uiMessage, GatewayEvent} from '@sample/shared';
import type {Tools} from './mcp/tools';

/** Events, die Agenten erzeugen (das Gateway ergänzt `done`). */
export type AgentEvent = Exclude<GatewayEvent, {kind: 'done'}>;

/** Gesprächszustand je Session (im Sample im Speicher, in Produktion z. B. Redis). */
export interface SessionState {
  id: string;
  surfaceCounter: number;
  /** Welcher Fach-Agent besitzt welche Surface – damit Actions richtig geroutet werden. */
  surfaceOwner: Map<string, string>;
  /** Freier Zustand je Fach-Agent. */
  agentState: Map<string, Record<string, unknown>>;
  /** Fach-Agent, der im Text-Modus auf eine Antwort wartet. */
  awaitingTextFor?: string;
}

export interface AgentContext {
  session: SessionState;
  /** Ausgehandelter Katalog – `null` heißt: Client kann kein A2UI → nur Text. */
  catalogId: string | null;
  tools: Tools;
  /** Neue, in der Session eindeutige Surface-ID. */
  newSurfaceId(prefix: string): string;
  state(): Record<string, unknown>;
}

/** Schnittstelle eines Fach-Agenten (in Produktion: eigener Service hinter A2A). */
export interface DomainAgent {
  name: string;
  /** Kurzbeschreibung – wäre in Produktion Teil der A2A Agent Card. */
  description: string;
  onText(ctx: AgentContext, text: string): AsyncGenerator<AgentEvent>;
  onAction(ctx: AgentContext, action: A2uiAction): AsyncGenerator<AgentEvent>;
}

export type {A2uiMessage};
