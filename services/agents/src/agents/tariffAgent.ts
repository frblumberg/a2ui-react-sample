import type {Tariff} from '../mcp/tools';
import type {DomainAgent} from '../types';
import {bind, brandHeader, c, fmt, msg, statusBanner} from '../ui';
import {callTool, say, ui} from '../util';

const NAME = 'TariffAgent';
const priceText = (t: Tariff) => `${fmt.euro(t.pricePerMonth)} / Monat · ${t.workPriceCt.toLocaleString('de-DE')} ct/kWh`;

function listComponents(catalogId: string) {
  return [
    c.card('root', 'col'),
    c.column('col', ['header', 'intro', 'list']),
    ...brandHeader(catalogId, 'header', 'Tarife vergleichen', bind('/subtitle')),
    c.text('intro', 'Wähle einen Tarif – vor dem Wechsel fragen wir noch einmal nach.', 'caption'),
    // Template: eine Karte je Eintrag in /tariffs. Pfade ohne "/" sind relativ zum Eintrag.
    c.list('list', '/tariffs', 'tariff-item'),
    c.card('tariff-item', 'tariff-row'),
    c.row('tariff-row', ['tariff-info', 'tariff-pick'], {justify: 'spaceBetween', align: 'center'}),
    c.column('tariff-info', ['t-name', 't-price', 't-note']),
    c.text('t-name', bind('name'), 'h4'),
    c.text('t-price', bind('priceText')),
    c.text('t-note', bind('note'), 'caption'),
    ...c.button('tariff-pick', 'Auswählen', {name: 'selectTariff', context: {tariffId: bind('id')}}),
  ];
}

export const tariffAgent: DomainAgent = {
  name: NAME,
  description: 'Vergleicht Tarife und bereitet Tarifwechsel vor (mit Bestätigung).',

  async *onText(ctx) {
    const st = ctx.state();
    const customer = yield* callTool(ctx, 'crm.getCustomer', {sessionId: ctx.session.id});
    const tariffs = yield* callTool(ctx, 'content.listTariffs', {postalCode: customer.postalCode});
    st.tariffs = tariffs;
    st.contractId = customer.contractId;
    st.pending = undefined;

    if (!ctx.catalogId) {
      const lines = tariffs.map((t) => `• ${t.name}: ${priceText(t)} (${t.note})`).join('\n');
      yield say(NAME, `Diese Tarife gibt es für PLZ ${customer.postalCode}:\n${lines}\nEinen Wechsel kann ich nur mit Bestätigung im interaktiven Formular auslösen.`);
      return;
    }

    const sid = ctx.newSurfaceId('tariffs');
    ctx.session.surfaceOwner.set(sid, NAME);
    st.surfaceId = sid;
    yield say(NAME, `Für PLZ ${customer.postalCode} habe ich ${tariffs.length} Tarife gefunden.`);
    yield ui(msg.createSurface(sid, ctx.catalogId, false));
    yield ui(msg.updateComponents(sid, listComponents(ctx.catalogId)));
    yield ui(msg.updateDataModel(sid, {
      subtitle: `Vertrag ${customer.contractId} · PLZ ${customer.postalCode}`,
      tariffs: tariffs.map((t) => ({id: t.id, name: t.name, priceText: priceText(t), note: t.note})),
    }));
  },

  async *onAction(ctx, action) {
    const st = ctx.state();
    const tariffs = (st.tariffs as Tariff[] | undefined) ?? [];
    const sid = action.surfaceId;
    const catalogId = ctx.catalogId;
    if (!catalogId) return;

    if (action.name === 'selectTariff') {
      const t = tariffs.find((x) => x.id === action.context.tariffId);
      if (!t) {
        yield {kind: 'error', message: 'Unbekannter Tarif.'};
        return;
      }
      st.pending = t.id;
      // Guardrail: verbindliche Aktionen nur nach ausdrücklicher Bestätigung.
      yield ui(msg.updateComponents(sid, [
        ...statusBanner(catalogId, 'confirm-banner', `Verbindlicher Wechsel zu „${t.name}“ (${priceText(t)}). Bitte bestätige ausdrücklich.`, 'warning'),
        c.row('confirm-row', ['cancel', 'confirm'], {justify: 'end'}),
        ...c.button('cancel', 'Zurück', {name: 'cancelTariffChange'}, 'borderless'),
        ...c.button('confirm', 'Verbindlich wechseln', {name: 'confirmTariffChange', context: {tariffId: t.id}}, 'primary'),
        c.column('col', ['header', 'confirm-banner', 'confirm-row']),
      ]));
      return;
    }

    if (action.name === 'cancelTariffChange') {
      st.pending = undefined;
      yield ui(msg.updateComponents(sid, [c.column('col', ['header', 'intro', 'list'])]));
      return;
    }

    if (action.name === 'confirmTariffChange') {
      const t = tariffs.find((x) => x.id === action.context.tariffId);
      if (!t || st.pending !== t.id) {
        yield {kind: 'error', message: 'Bestätigung passt nicht zur Auswahl – bitte erneut wählen.'};
        return;
      }
      const res = yield* callTool(ctx, 'contracts.requestTariffChange', {contractId: String(st.contractId), tariffId: t.id});
      st.pending = undefined;
      yield ui(msg.updateComponents(sid, [
        ...statusBanner(catalogId, 'done', `Wechsel zu „${t.name}“ beauftragt – gültig ab ${fmt.date(res.effectiveFrom)}.`, 'success'),
        c.text('done-ref', `Vorgang ${res.caseId}. Die Bestätigung kommt per E-Mail.`, 'caption'),
        c.column('col', ['header', 'done', 'done-ref']),
      ]));
      yield say(NAME, `Dein Wechsel zu „${t.name}“ ist beauftragt (Vorgang ${res.caseId}).`);
      return;
    }

    yield {kind: 'error', message: `${NAME} kennt die Aktion „${action.name}“ nicht.`};
  },
};
