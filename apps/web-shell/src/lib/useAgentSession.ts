import {useCallback, useEffect, useRef, useState} from 'react';
import {MessageProcessor, type ActionPayload} from '@a2ui/web_core/v0_9';
import type {ReactCatalogComponent} from '@a2ui/react/v0_9';
import {brandCatalog, basicCatalog} from '@sample/brand-catalog';
import type {TurnInput} from '@sample/shared';
import {sendTurn} from './gatewayClient';

export type TimelineItem =
  | {key: string; type: 'user'; text: string}
  | {key: string; type: 'agent'; text: string; agent: string}
  | {key: string; type: 'surface'; surfaceId: string}
  | {key: string; type: 'trace'; step: string}
  | {key: string; type: 'error'; text: string};

let counter = 0;
const key = () => `i${++counter}`;
const sessionId = crypto.randomUUID();

/**
 * Verbindet Gespräch, Gateway und A2UI-MessageProcessor:
 * - Agenten-Nachrichten → processor.processMessages()
 * - Nutzeraktionen in Surfaces → actionHandler → neuer Turn ans Gateway
 */
export function useAgentSession(opts: {a2uiEnabled: boolean}) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [busy, setBusy] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const runRef = useRef<(input: TurnInput) => Promise<void>>(async () => {});

  const [processor] = useState(
    () =>
      new MessageProcessor<ReactCatalogComponent>([brandCatalog, basicCatalog], (action: ActionPayload) => {
        // sendDataModel: Hat der Agent es bei createSurface verlangt, schicken wir
        // das Datenmodell der Surface mit (DSGVO: nur nötige Felder hineinlegen!).
        const surfaces = processor.getClientDataModel('v0.9')?.surfaces as Record<string, Record<string, unknown>> | undefined;
        void runRef.current({
          type: 'action',
          action: {
            name: action.name,
            surfaceId: action.surfaceId,
            sourceComponentId: action.sourceComponentId,
            timestamp: action.timestamp,
            context: action.context,
          },
          dataModel: surfaces?.[action.surfaceId],
        });
      }),
  );

  useEffect(() => {
    const sub = processor.onSurfaceDeleted((id) => setItems((xs) => xs.filter((x) => !(x.type === 'surface' && x.surfaceId === id))));
    return () => sub.unsubscribe();
  }, [processor]);

  const push = (item: TimelineItem) => setItems((xs) => [...xs, item]);

  const run = useCallback(
    async (input: TurnInput) => {
      setBusy(true);
      const supported = optsRef.current.a2uiEnabled ? [brandCatalog.id, basicCatalog.id] : [];
      try {
        for await (const ev of sendTurn({sessionId, input, capabilities: {'v0.9': {supportedCatalogIds: supported}}})) {
          if (ev.kind === 'text') push({key: key(), type: 'agent', text: ev.text, agent: ev.agent});
          else if (ev.kind === 'trace') push({key: key(), type: 'trace', step: ev.step});
          else if (ev.kind === 'error') push({key: key(), type: 'error', text: ev.message});
          else if (ev.kind === 'a2ui') {
            try {
              // Der Processor validiert gegen das v0.9-Schema und den Katalog.
              processor.processMessages([ev.message] as never);
              if ('createSurface' in ev.message) push({key: key(), type: 'surface', surfaceId: ev.message.createSurface.surfaceId});
            } catch (err) {
              push({key: key(), type: 'error', text: `A2UI-Nachricht abgelehnt: ${(err as Error).message}`});
            }
          }
        }
      } catch (err) {
        push({key: key(), type: 'error', text: `Gateway nicht erreichbar (${(err as Error).message}). Läuft „npm run dev“?`});
      } finally {
        setBusy(false);
      }
    },
    [processor],
  );
  runRef.current = run;

  const sendText = useCallback(
    (text: string) => {
      push({key: key(), type: 'user', text});
      return run({type: 'text', text});
    },
    [run],
  );

  return {items, busy, processor, sendText};
}
