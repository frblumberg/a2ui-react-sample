import {describe, expect, it} from 'vitest';
import {BASIC_CATALOG_ID, BRAND_CATALOG_ID, type A2uiMessage} from '@sample/shared';
import {SurfaceRegistry, validateA2uiMessage} from '../services/gateway/src/validate';

const V = 'v0.9' as const;
const opts = (registry = new SurfaceRegistry()) => ({session: 's', allowedCatalogIds: [BASIC_CATALOG_ID], registry});

describe('Gateway-Validierung', () => {
  it('akzeptiert eine gültige Surface', () => {
    const o = opts();
    expect(validateA2uiMessage({version: V, createSurface: {surfaceId: 'a', catalogId: BASIC_CATALOG_ID}}, o).ok).toBe(true);
    const upd: A2uiMessage = {version: V, updateComponents: {surfaceId: 'a', components: [
      {id: 'root', component: 'Column', children: ['t']},
      {id: 't', component: 'Text', text: 'Hallo'},
    ]}};
    expect(validateA2uiMessage(upd, o).ok).toBe(true);
    expect(validateA2uiMessage({version: V, updateDataModel: {surfaceId: 'a', path: '/x', value: 1}}, o).ok).toBe(true);
  });

  it('lehnt nicht ausgehandelte Kataloge ab', () => {
    const r = validateA2uiMessage({version: V, createSurface: {surfaceId: 'a', catalogId: BRAND_CATALOG_ID}}, opts());
    expect(r).toMatchObject({ok: false});
  });

  it('lehnt Verweise ins Leere und doppelte IDs ab', () => {
    const o = opts();
    validateA2uiMessage({version: V, createSurface: {surfaceId: 'a', catalogId: BASIC_CATALOG_ID}}, o);
    const dangling = validateA2uiMessage({version: V, updateComponents: {surfaceId: 'a', components: [{id: 'root', component: 'Column', children: ['fehlt']}]}}, o);
    expect(dangling).toMatchObject({ok: false});
    const dup = validateA2uiMessage({version: V, updateComponents: {surfaceId: 'a', components: [
      {id: 'root', component: 'Text', text: 'a'}, {id: 'root', component: 'Text', text: 'b'},
    ]}}, o);
    expect(dup).toMatchObject({ok: false});
  });

  it('lehnt Updates für unbekannte Surfaces und falsche Versionen ab', () => {
    expect(validateA2uiMessage({version: V, updateDataModel: {surfaceId: 'x', value: 1}}, opts()).ok).toBe(false);
    expect(validateA2uiMessage({version: 'v0.8', deleteSurface: {surfaceId: 'x'}} as unknown as A2uiMessage, opts()).ok).toBe(false);
  });
});
