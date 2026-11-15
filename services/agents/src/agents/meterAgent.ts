import type {A2uiAction} from '@sample/shared';
import type {Meter} from '../mcp/tools';
import type {AgentContext, AgentEvent, DomainAgent} from '../types';
import {bind, brandHeader, c, checks, fmt, msg, statusBanner} from '../ui';
import {callTool, parseReading, say, ui} from '../util';

const NAME = 'MeterAgent';

function formComponents(catalogId: string) {
  return [
    c.card('root', 'col'),
    c.column('col', ['header', 'last', 'reading', 'actions']),
    ...brandHeader(catalogId, 'header', 'Zählerstand melden', bind('/meter/label')),
    c.text('last', bind('/meter/lastText'), 'caption'),
    {
      id: 'reading',
      component: 'TextField',
      label: 'Aktueller Zählerstand in kWh',
      value: bind('/reading'),
      variant: 'number',
      checks: [
        checks.required('/reading', 'Bitte den Zählerstand eintragen.'),
        checks.regex('/reading', '^[0-9]{1,7}$', 'Nur ganze Zahlen ohne Punkt, z. B. 12480.'),
      ],
    },
    c.row('actions', ['submit'], {justify: 'end'}),
    // Checks am Button: Der Renderer deaktiviert ihn, solange die Eingabe ungültig ist.
    ...c.button('submit', 'Zählerstand senden', {name: 'submitMeterReading', context: {meterId: bind('/meter/id'), value: bind('/reading')}}, 'primary', [
      checks.required('/reading', 'Pflichtfeld'),
      checks.regex('/reading', '^[0-9]{1,7}$', 'Ungültige Zahl'),
    ]),
  ];
}

async function* submit(ctx: AgentContext, meter: Meter, value: number | null, surfaceId: string | null): AsyncGenerator<AgentEvent> {
  // Nie dem Client vertrauen: serverseitig erneut prüfen.
  if (value === null || value < meter.lastReading) {
    const why = value === null
      ? 'Das sieht nicht nach einem Zählerstand aus.'
      : `Der Wert liegt unter dem letzten Stand (${fmt.number(meter.lastReading)} ${meter.unit}).`;
    if (surfaceId && ctx.catalogId) {
      yield ui(msg.updateComponents(surfaceId, [
        ...statusBanner(ctx.catalogId, 'hint', `${why} Bitte prüfe die Eingabe.`, 'warning'),
        c.column('col', ['header', 'last', 'hint', 'reading', 'actions']),
      ]));
    } else {
      yield say(NAME, `${why} Wie lautet der aktuelle Stand?`);
      ctx.session.awaitingTextFor = NAME;
    }
    return;
  }

  const result = yield* callTool(ctx, 'billing.submitMeterReading', {meterId: meter.id, value});
  const summary = `Verbrauch seit ${fmt.date(meter.lastReadingDate)}: ${fmt.number(result.consumption)} ${meter.unit} · Beleg ${result.receiptId}`;

  if (surfaceId && ctx.catalogId) {
    yield ui(msg.updateDataModel(surfaceId, {summary}, '/result'));
    yield ui(msg.updateComponents(surfaceId, [
      ...statusBanner(ctx.catalogId, 'done', `Danke! ${fmt.number(value)} ${meter.unit} sind übernommen.`, 'success'),
      c.text('summary', bind('/result/summary'), 'caption'),
      c.column('col', ['header', 'done', 'summary']),
    ]));
  }
  yield say(NAME, `Erledigt: Zählerstand ${fmt.number(value)} ${meter.unit} gespeichert. ${summary}.`);
}

export const meterAgent: DomainAgent = {
  name: NAME,
  description: 'Erfasst und prüft Zählerstände (Strom, Gas).',

  async *onText(ctx, text) {
    const st = ctx.state();
    const customer = yield* callTool(ctx, 'crm.getCustomer', {sessionId: ctx.session.id});
    const meter = customer.meters[0];
    st.meter = meter;

    // Text-Modus: Wir haben nach dem Stand gefragt und bekommen eine Zahl.
    if (ctx.session.awaitingTextFor === NAME) {
      const value = parseReading(text);
      if (value !== null) {
        ctx.session.awaitingTextFor = undefined;
        yield* submit(ctx, meter, value, null);
        return;
      }
    }

    const lastText = `Letzter Stand: ${fmt.number(meter.lastReading)} ${meter.unit} am ${fmt.date(meter.lastReadingDate)}`;

    if (!ctx.catalogId) {
      ctx.session.awaitingTextFor = NAME;
      yield say(NAME, `Hallo ${customer.firstName}! ${lastText} (Zähler ${meter.id}). Wie lautet der aktuelle Zählerstand?`);
      return;
    }

    const sid = ctx.newSurfaceId('meter');
    ctx.session.surfaceOwner.set(sid, NAME);
    yield say(NAME, `Hallo ${customer.firstName}! Trag deinen aktuellen Zählerstand einfach hier ein.`);
    yield ui(msg.createSurface(sid, ctx.catalogId, true));
    yield ui(msg.updateComponents(sid, formComponents(ctx.catalogId)));
    yield ui(msg.updateDataModel(sid, {
      meter: {id: meter.id, label: `${meter.medium} · Zähler ${meter.id}`, lastText},
      reading: '',
    }));
  },

  async *onAction(ctx, action: A2uiAction) {
    if (action.name !== 'submitMeterReading') {
      yield {kind: 'error', message: `${NAME} kennt die Aktion „${action.name}“ nicht.`};
      return;
    }
    const meter = ctx.state().meter as Meter | undefined;
    if (!meter) {
      yield {kind: 'error', message: 'Sitzung abgelaufen – bitte neu starten.'};
      return;
    }
    yield* submit(ctx, meter, parseReading(String(action.context.value ?? '')), action.surfaceId);
  },
};
