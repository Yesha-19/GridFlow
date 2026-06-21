import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPinned, Radar, ShieldHalf } from 'lucide-react';
import EventForm from '../components/EventForm/EventForm.jsx';
import { useEventContext } from '../context/EventContext.jsx';

const STEPS = [
  {
    icon: Radar,
    title: 'Forecast',
    body: 'Feed in event type, venue, and expected attendance — the model scores congestion risk before crowds gather.',
  },
  {
    icon: ShieldHalf,
    title: 'Recommend',
    body: 'Get a manpower, barricade, and CCTV deployment plan sized to the predicted risk, not a flat checklist.',
  },
  {
    icon: MapPinned,
    title: 'Deploy',
    body: 'See affected roads and ready-made diversions on the map, so routing decisions ship before gridflow does.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { runForecast, status, error } = useEventContext();

  async function handleSubmit(eventPayload) {
    try {
      await runForecast(eventPayload);
      navigate('/dashboard');
    } catch {
      // error is surfaced via context.error below; nothing further to do here.
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-console-border bg-console-panel px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-signal">
            <Radar size={12} /> Gridflow System
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-console-text sm:text-5xl">
            See the jam<br /> before it forms.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-console-muted">
            Gridflow forecasts how a rally, festival, or VIP movement will load the
            surrounding road network — and tells your team exactly how much
            manpower, how many barricades, and which diversions to stage in
            advance.
          </p>

          <div className="mt-8 space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal/15 text-signal">
                    <step.icon size={15} />
                  </span>
                  {i < STEPS.length - 1 && <span className="mt-1 h-full w-px bg-console-border" />}
                </div>
                <div className="pb-2">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-console-muted">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="font-display text-sm font-semibold text-console-text">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-console-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-risk-critical/40 bg-risk-critical/10 px-3 py-2 text-xs text-risk-critical">
              <AlertTriangle size={14} />
              Forecast failed: {error}. Please try again.
            </div>
          )}
          <EventForm onSubmit={handleSubmit} status={status} />
        </div>
      </section>
    </div>
  );
}
