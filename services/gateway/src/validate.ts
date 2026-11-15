import {A2UI_VERSION, type A2uiComponent, type A2uiMessage} from '@sample/shared';

/**
 * Leichtgewichtige Prüfung jeder Agenten-Nachricht, bevor sie den Client
 * erreicht. Ergänzt (ersetzt nicht) die Schema-Validierung im Renderer.
 *
 * Geprüft wird, was ein Gateway zentral durchsetzen sollte:
 *  - Protokollversion und genau ein Nachrichtentyp
 *  - nur ausgehandelte Kataloge
 *  - eindeutige IDs, keine Verweise ins Leere, eine Obergrenze je Surface
 */

const TYPES = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'] as const;
export const MAX_COMPONENTS_PER_SURFACE = 200;

export type ValidationResult = {ok: true} | {ok: false; reason: string};

/** Merkt sich je Session, welche Surfaces und Komponenten-IDs existieren. */
export class SurfaceRegistry {
  private readonly surfaces = new Map<string, Set<string>>();
  private key(session: string, surfaceId: string) {
    return `${session}::${surfaceId}`;
  }
  has(session: string, surfaceId: string) {
    return this.surfaces.has(this.key(session, surfaceId));
  }
  create(session: string, surfaceId: string) {
    this.surfaces.set(this.key(session, surfaceId), new Set());
  }
  ids(session: string, surfaceId: string) {
    return this.surfaces.get(this.key(session, surfaceId));
  }
  delete(session: string, surfaceId: string) {
    this.surfaces.delete(this.key(session, surfaceId));
  }
}

function childRefs(comp: A2uiComponent): string[] {
  const refs: string[] = [];
  if (typeof comp.child === 'string') refs.push(comp.child);
  if (Array.isArray(comp.children)) refs.push(...(comp.children as unknown[]).filter((x): x is string => typeof x === 'string'));
  else if (comp.children && typeof comp.children === 'object' && typeof (comp.children as {componentId?: unknown}).componentId === 'string') {
    refs.push((comp.children as {componentId: string}).componentId);
  }
  return refs;
}

export function validateA2uiMessage(
  message: A2uiMessage,
  opts: {session: string; allowedCatalogIds: string[]; registry: SurfaceRegistry},
): ValidationResult {
  const m = message as Record<string, unknown>;
  if (!m || typeof m !== 'object') return {ok: false, reason: 'Nachricht ist kein Objekt'};
  if (m.version !== A2UI_VERSION) return {ok: false, reason: `Version „${String(m.version)}“ nicht unterstützt`};
  const present = TYPES.filter((t) => t in m);
  if (present.length !== 1 || Object.keys(m).length !== 2) return {ok: false, reason: 'Genau ein Nachrichtentyp erwartet'};
  const {registry, session} = opts;

  if ('createSurface' in message) {
    const {surfaceId, catalogId} = message.createSurface;
    if (!surfaceId) return {ok: false, reason: 'surfaceId fehlt'};
    if (registry.has(session, surfaceId)) return {ok: false, reason: `Surface „${surfaceId}“ existiert bereits`};
    if (!opts.allowedCatalogIds.includes(catalogId)) return {ok: false, reason: `Katalog „${catalogId}“ wurde nicht ausgehandelt`};
    registry.create(session, surfaceId);
    return {ok: true};
  }

  const surfaceId = (Object.values(m).find((v) => v && typeof v === 'object') as {surfaceId?: string}).surfaceId ?? '';
  const known = registry.ids(session, surfaceId);
  if (!known) return {ok: false, reason: `Unbekannte Surface „${surfaceId}“`};

  if ('deleteSurface' in message) {
    registry.delete(session, surfaceId);
    return {ok: true};
  }

  if ('updateComponents' in message) {
    const comps = message.updateComponents.components;
    if (!Array.isArray(comps) || comps.length === 0) return {ok: false, reason: 'components leer'};
    const seen = new Set<string>();
    for (const comp of comps) {
      if (!comp || typeof comp.id !== 'string' || typeof comp.component !== 'string') return {ok: false, reason: 'Komponente ohne id/component'};
      if (seen.has(comp.id)) return {ok: false, reason: `Doppelte ID „${comp.id}“`};
      seen.add(comp.id);
    }
    const all = new Set([...known, ...seen]);
    for (const comp of comps) {
      const missing = childRefs(comp).find((ref) => !all.has(ref));
      if (missing) return {ok: false, reason: `„${comp.id}“ verweist auf unbekannte Komponente „${missing}“`};
    }
    if (all.size > MAX_COMPONENTS_PER_SURFACE) return {ok: false, reason: 'Zu viele Komponenten in der Surface'};
    if (!all.has('root')) return {ok: false, reason: 'Surface braucht eine Komponente mit id „root“'};
    seen.forEach((id) => known.add(id));
    return {ok: true};
  }

  // updateDataModel
  const path = message.updateDataModel.path ?? '/';
  if (typeof path !== 'string' || !path.startsWith('/')) return {ok: false, reason: 'path muss ein JSON-Pointer sein'};
  return {ok: true};
}
