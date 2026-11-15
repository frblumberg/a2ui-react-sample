// @vitest-environment jsdom
import {describe, expect, it} from 'vitest';
import {MessageProcessor} from '@a2ui/web_core/v0_9';
import {BASIC_CATALOG_ID, BRAND_CATALOG_ID} from '@sample/shared';
import {Orchestrator} from '@sample/agents';
import {brandCatalog, basicCatalog} from '@sample/brand-catalog';
import {BASIC, BRAND, NONE, a2ui, action, collect, componentsOf, surfaceIdOf, texts, turn} from './helpers';

/** Spielt Agenten-Nachrichten durch den offiziellen v0.9-Processor (Schema + Katalog). */
function render(msgs: ReturnType<typeof a2ui>) {
  const p = new MessageProcessor([brandCatalog, basicCatalog]);
  p.processMessages(msgs as never);
  return p;
}

describe('Katalog-Aushandlung', () => {
  const o = new Orchestrator();
  it('bevorzugt den Marken-Katalog', () => expect(o.negotiateCatalog(BRAND)).toBe(BRAND_CATALOG_ID));
  it('fällt auf den Basis-Katalog zurück', () => expect(o.negotiateCatalog(BASIC)).toBe(BASIC_CATALOG_ID));
  it('ohne gemeinsamen Katalog: nur Text', () => expect(o.negotiateCatalog(NONE)).toBeNull());
});

describe('Zählerstand (MeterAgent)', () => {
  it('liefert ein Formular, das der offizielle Renderer akzeptiert', async () => {
    const evs = await collect(new Orchestrator().handleTurn(turn('s1', {type: 'text', text: 'Zählerstand melden'})));
    const msgs = a2ui(evs);
    const p = render(msgs);
    const sid = surfaceIdOf(msgs);
    expect(p.getSurface(sid)).toBeDefined();
    expect(componentsOf(msgs).map((c) => c.component)).toContain('BrandHeader');
    expect(evs.some((e) => e.kind === 'trace' && e.step.includes('A2A → MeterAgent'))).toBe(true);
  });

  it('nutzt mit Basis-Katalog keine Marken-Komponenten', async () => {
    const msgs = a2ui(await collect(new Orchestrator().handleTurn(turn('s1', {type: 'text', text: 'Zählerstand'}, BASIC))));
    render(msgs);
    const kinds = componentsOf(msgs).map((c) => c.component);
    expect(kinds).not.toContain('BrandHeader');
    expect(kinds).toContain('TextField');
  });

  it('prüft serverseitig und bestätigt einen gültigen Stand', async () => {
    const o = new Orchestrator();
    const first = a2ui(await collect(o.handleTurn(turn('s1', {type: 'text', text: 'Zählerstand melden'}))));
    const sid = surfaceIdOf(first);

    const tooLow = await collect(o.handleTurn(turn('s1', action(sid, 'submitMeterReading', {value: '100'}))));
    expect(componentsOf(a2ui(tooLow)).find((c) => c.id === 'hint')).toMatchObject({component: 'StatusBanner', tone: 'warning'});

    const ok = await collect(o.handleTurn(turn('s1', action(sid, 'submitMeterReading', {value: '12480'}))));
    expect(componentsOf(a2ui(ok)).find((c) => c.id === 'done')).toMatchObject({tone: 'success'});
    expect(texts(ok).join()).toContain('12.480');
    render([...first, ...a2ui(tooLow), ...a2ui(ok)]);
  });

  it('funktioniert ohne A2UI rein über Text', async () => {
    const o = new Orchestrator();
    const ask = await collect(o.handleTurn(turn('s2', {type: 'text', text: 'Zählerstand melden'}, NONE)));
    expect(a2ui(ask)).toHaveLength(0);
    const done = await collect(o.handleTurn(turn('s2', {type: 'text', text: '12.500'}, NONE)));
    expect(texts(done).join()).toContain('12.500 kWh gespeichert');
  });
});

describe('Tarifwechsel (TariffAgent)', () => {
  it('verlangt vor dem Wechsel eine ausdrückliche Bestätigung', async () => {
    const o = new Orchestrator();
    const list = a2ui(await collect(o.handleTurn(turn('s3', {type: 'text', text: 'Tarife vergleichen'}))));
    const sid = surfaceIdOf(list);

    const select = a2ui(await collect(o.handleTurn(turn('s3', action(sid, 'selectTariff', {tariffId: 'oeko-fix24'})))));
    expect(componentsOf(select).map((c) => c.id)).toEqual(expect.arrayContaining(['confirm-banner', 'confirm']));

    // Bestätigung für einen anderen Tarif als ausgewählt → abgelehnt
    const wrong = await collect(o.handleTurn(turn('s3', action(sid, 'confirmTariffChange', {tariffId: 'dynamisch'}))));
    expect(wrong.some((e) => e.kind === 'error')).toBe(true);

    const confirm = await collect(o.handleTurn(turn('s3', action(sid, 'confirmTariffChange', {tariffId: 'oeko-fix24'}))));
    expect(texts(confirm).join()).toContain('Ökostrom Fix 24');
    render([...list, ...select, ...a2ui(confirm)]);
  });
});

describe('Orchestrator', () => {
  it('zeigt bei unklarer Anfrage eine Auswahl', async () => {
    const msgs = a2ui(await collect(new Orchestrator().handleTurn(turn('s4', {type: 'text', text: 'Moin'}))));
    render(msgs);
    expect(componentsOf(msgs).filter((c) => c.component === 'Button')).toHaveLength(2);
  });
});
