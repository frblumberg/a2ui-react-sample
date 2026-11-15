import {useEffect, useRef, useState, type CSSProperties, type FormEvent} from 'react';
import {BrandContext, brands} from '@sample/brand-catalog';
import {SurfaceView} from './components/SurfaceView';
import {useAgentSession} from './lib/useAgentSession';

const SUGGESTIONS = ['Zählerstand melden', 'Tarife vergleichen', 'Hallo, was kannst du?'];

export function App() {
  const [brandId, setBrandId] = useState('marke-a');
  const [a2uiEnabled, setA2uiEnabled] = useState(true);
  const [showTrace, setShowTrace] = useState(true);
  const [draft, setDraft] = useState('');
  const {items, busy, processor, sendText} = useAgentSession({a2uiEnabled});
  const endRef = useRef<HTMLDivElement>(null);
  const brand = brands[brandId];

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
  }, [items.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    void sendText(text);
  };

  return (
    <BrandContext.Provider value={brand}>
      <div className="shell" style={brand.tokens as CSSProperties}>
        <header className="topbar">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true" />
            <div>
              <div className="brand__name">{brand.name}</div>
              <div className="brand__claim">{brand.claim}</div>
            </div>
          </div>
          <div className="controls">
            <label>
              Marke
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                {Object.values(brands).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="toggle" title="Ohne A2UI meldet der Client keine Kataloge – der Agent antwortet nur mit Text.">
              <input type="checkbox" checked={a2uiEnabled} onChange={(e) => setA2uiEnabled(e.target.checked)} />
              A2UI
            </label>
            <label className="toggle">
              <input type="checkbox" checked={showTrace} onChange={(e) => setShowTrace(e.target.checked)} />
              Ablauf
            </label>
          </div>
        </header>

        <main className="timeline" aria-live="polite">
          {items.length === 0 && (
            <div className="empty">
              <h1>Kundenservice-Agent</h1>
              <p>Probier eine der Vorschläge unten. Die Formulare kommen als A2UI-JSON vom Agenten und werden hier mit den Komponenten des Design Systems gerendert.</p>
            </div>
          )}
          {items.map((item) => {
            switch (item.type) {
              case 'user':
                return <div key={item.key} className="bubble bubble--user">{item.text}</div>;
              case 'agent':
                return (
                  <div key={item.key} className="bubble bubble--agent">
                    <span className="bubble__agent">{item.agent}</span>
                    {item.text}
                  </div>
                );
              case 'surface':
                return <SurfaceView key={item.key} processor={processor} surfaceId={item.surfaceId} />;
              case 'trace':
                return showTrace ? <div key={item.key} className="trace">↳ {item.step}</div> : null;
              case 'error':
                return <div key={item.key} className="bubble bubble--error">{item.text}</div>;
            }
          })}
          {busy && <div className="typing" aria-label="Agent schreibt">•••</div>}
          <div ref={endRef} />
        </main>

        <footer className="composer">
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => void sendText(s)}>{s}</button>
            ))}
          </div>
          <form onSubmit={submit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nachricht an den Agenten …" aria-label="Nachricht" />
            <button type="submit" disabled={busy || !draft.trim()}>Senden</button>
          </form>
        </footer>
      </div>
    </BrandContext.Provider>
  );
}
