import {A2UI_VERSION, BRAND_CATALOG_ID, type A2uiComponent, type A2uiMessage, type DynamicValue} from '@sample/shared';

/**
 * Kleine Builder für A2UI-v0.9-Nachrichten. Ein LLM-Agent würde dieses JSON
 * selbst erzeugen (Katalog + Beispiele im System-Prompt, Validierung über
 * das A2UI-Agent-SDK). Für ein deterministisches Sample bauen wir es im Code.
 */

export const msg = {
  createSurface(surfaceId: string, catalogId: string, sendDataModel = true): A2uiMessage {
    return {version: A2UI_VERSION, createSurface: {surfaceId, catalogId, sendDataModel}};
  },
  updateComponents(surfaceId: string, components: A2uiComponent[]): A2uiMessage {
    return {version: A2UI_VERSION, updateComponents: {surfaceId, components}};
  },
  updateDataModel(surfaceId: string, value: unknown, path = '/'): A2uiMessage {
    return {version: A2UI_VERSION, updateDataModel: {surfaceId, path, value}};
  },
  deleteSurface(surfaceId: string): A2uiMessage {
    return {version: A2UI_VERSION, deleteSurface: {surfaceId}};
  },
};

export const bind = (path: string) => ({path});

export const c = {
  column: (id: string, children: string[] | {path: string; componentId: string}, extra: Partial<A2uiComponent> = {}): A2uiComponent =>
    ({id, component: 'Column', children, ...extra}),
  row: (id: string, children: string[], extra: Partial<A2uiComponent> = {}): A2uiComponent => ({id, component: 'Row', children, ...extra}),
  list: (id: string, path: string, componentId: string): A2uiComponent => ({id, component: 'List', children: {path, componentId}}),
  card: (id: string, child: string): A2uiComponent => ({id, component: 'Card', child}),
  text: (id: string, text: DynamicValue, variant?: string): A2uiComponent => ({id, component: 'Text', text, ...(variant ? {variant} : {})}),
  divider: (id: string): A2uiComponent => ({id, component: 'Divider'}),
  button: (id: string, label: string, event: {name: string; context?: Record<string, DynamicValue>}, variant = 'default', checks?: unknown[]): A2uiComponent[] => [
    {id, component: 'Button', child: `${id}-label`, variant, action: {event}, ...(checks ? {checks} : {})},
    {id: `${id}-label`, component: 'Text', text: label},
  ],
};

/**
 * Design-System-Komponenten mit Fallback: Hat der Client nur den
 * Basiskatalog, bauen wir dieselbe Aussage aus Basiskomponenten.
 */
export function brandHeader(catalogId: string, id: string, title: DynamicValue, subtitle?: DynamicValue): A2uiComponent[] {
  if (catalogId === BRAND_CATALOG_ID) {
    return [{id, component: 'BrandHeader', title, ...(subtitle ? {subtitle} : {})}];
  }
  const kids = subtitle ? [`${id}-t`, `${id}-s`] : [`${id}-t`];
  return [
    c.column(id, kids),
    c.text(`${id}-t`, title, 'h3'),
    ...(subtitle ? [c.text(`${id}-s`, subtitle, 'caption')] : []),
  ];
}

export function statusBanner(catalogId: string, id: string, text: DynamicValue, tone: 'info' | 'success' | 'warning' = 'info'): A2uiComponent[] {
  if (catalogId === BRAND_CATALOG_ID) return [{id, component: 'StatusBanner', text, tone}];
  const prefix = tone === 'success' ? '✓ ' : tone === 'warning' ? '⚠ ' : 'ℹ ';
  return [c.text(id, typeof text === 'string' ? prefix + text : text, 'body')];
}

export const checks = {
  required: (path: string, message: string) => ({condition: {call: 'required', args: {value: bind(path)}}, message}),
  regex: (path: string, pattern: string, message: string) => ({condition: {call: 'regex', args: {value: bind(path), pattern}}, message}),
};

export const fmt = {
  number: (n: number) => n.toLocaleString('de-DE'),
  euro: (n: number) => n.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'}),
  date: (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
};
