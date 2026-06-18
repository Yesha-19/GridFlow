import React from 'react';
import { Link } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { useEventContext } from '../context/EventContext.jsx';
import DashboardView from '../components/Dashboard/Dashboard.jsx';

export default function DashboardPage() {
  const { currentEvent, prediction, resources, routing, historicalComparison, hasForecast, reset } = useEventContext();

  if (!hasForecast) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal">
          <Radar size={22} />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-console-text">
          No active forecast
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-console-muted">
          Run a forecast from the console to populate the risk dashboard, resource
          plan, and route map.
        </p>
        <Link
          to="/"
          className="mt-5 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-signal/90"
        >
          Go to console
        </Link>
      </div>
    );
  }

  return (
    <DashboardView
      event={currentEvent}
      prediction={prediction}
      resources={resources}
      routing={routing}
      historicalComparison={historicalComparison}
      onReset={reset}
    />
  );
}
