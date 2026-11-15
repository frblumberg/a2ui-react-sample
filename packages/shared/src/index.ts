/**
 * Gemeinsame Typen für Web-Shell, Gateway und Agenten.
 *
 * Die A2UI-Typen bilden bewusst nur den Teil von Protokoll v0.9 ab, den das
 * Sample nutzt. Die maßgebliche Validierung übernimmt im Client der
 * MessageProcessor aus @a2ui/web_core.
 */

export const A2UI_VERSION = 'v0.9' as const;

/** Katalog der A2UI-Basiskomponenten (Fallback). */
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

/**
 * Unser Marken-Katalog: Basiskomponenten + Design-System-Komponenten.
 * Platzhalter-URL – im echten Projekt auf die Katalog-Registry zeigen lassen.
 */
export const BRAND_CATALOG_ID = 'https://design-system.example.com/a2ui/v0_9/brand-catalog.json';

// ---------------------------------------------------------------- A2UI v0.9

export type PathBinding = {path: string};
export type FunctionCall = {call: string; args?: Record<string, unknown>; returnType?: string};
export type DynamicValue = string | number | boolean | PathBinding | FunctionCall;

export interface A2uiComponent {
  id: string;
  component: string;
  [prop: string]: unknown;
}

export type A2uiMessage =
  | {version: typeof A2UI_VERSION; createSurface: {surfaceId: string; catalogId: string; sendDataModel?: boolean}}
  | {version: typeof A2UI_VERSION; updateComponents: {surfaceId: string; components: A2uiComponent[]}}
  | {version: typeof A2UI_VERSION; updateDataModel: {surfaceId: string; path?: string; value?: unknown}}
  | {version: typeof A2UI_VERSION; deleteSurface: {surfaceId: string}};

/** Client → Agent: Nutzeraktion aus einer Surface (A2UI `action`). */
export interface A2uiAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  timestamp: string;
  context: Record<string, unknown>;
}

/** Was der Client über sich mitteilt – Grundlage der Katalog-Aushandlung. */
export interface ClientCapabilities {
  'v0.9'?: {supportedCatalogIds: string[]};
}

// ------------------------------------------------------------ Gateway-API

export type TurnInput =
  | {type: 'text'; text: string}
  | {type: 'action'; action: A2uiAction; dataModel?: Record<string, unknown>};

export interface TurnRequest {
  sessionId: string;
  input: TurnInput;
  capabilities: ClientCapabilities;
}

/**
 * Events, die das Gateway als NDJSON (eine JSON-Zeile pro Event) streamt.
 * Angelehnt an AG-UI; in Produktion würden A2UI-Nachrichten z. B. als
 * AG-UI-CUSTOM-Events transportiert.
 */
export type GatewayEvent =
  | {kind: 'text'; text: string; agent: string}
  | {kind: 'a2ui'; message: A2uiMessage}
  | {kind: 'trace'; step: string}
  | {kind: 'error'; message: string}
  | {kind: 'done'};

export function supportedCatalogIds(caps: ClientCapabilities | undefined): string[] {
  return caps?.['v0.9']?.supportedCatalogIds ?? [];
}
