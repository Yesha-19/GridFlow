import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getForecast } from '../services/predictionApi';
import { getRoutingPlan } from '../services/routingApi';

const EventContext = createContext(null);

const STORAGE_KEY = 'gridlock:lastForecast';

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function EventProvider({ children }) {
  const persisted = loadPersisted();

  const [currentEvent, setCurrentEvent] = useState(persisted?.currentEvent ?? null);
  const [prediction, setPrediction] = useState(persisted?.prediction ?? null);
  const [resources, setResources] = useState(persisted?.resources ?? null);
  const [routing, setRouting] = useState(persisted?.routing ?? null);
  const [historicalComparison, setHistoricalComparison] = useState(persisted?.historicalComparison ?? null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const persist = useCallback((next) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sessionStorage can fail in private/incognito edge cases — non-fatal.
    }
  }, []);

  const runForecast = useCallback(
    async (eventPayload) => {
      setStatus('loading');
      setError(null);
      try {
        const { prediction: pred, resources: res, historicalComparison: hist } = await getForecast(eventPayload);
        const routingPlan = await getRoutingPlan(eventPayload, pred);

        setCurrentEvent(eventPayload);
        setPrediction(pred);
        setResources(res);
        setRouting(routingPlan);
        setHistoricalComparison(hist || []);
        setStatus('ready');

        persist({
          currentEvent: eventPayload,
          prediction: pred,
          resources: res,
          routing: routingPlan,
          historicalComparison: hist || [],
        });

        return { prediction: pred, resources: res, routing: routingPlan };
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Forecast failed');
        throw err;
      }
    },
    [persist]
  );

  const reset = useCallback(() => {
    setCurrentEvent(null);
    setPrediction(null);
    setResources(null);
    setRouting(null);
    setHistoricalComparison(null);
    setStatus('idle');
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      currentEvent,
      prediction,
      resources,
      routing,
      historicalComparison,
      status,
      error,
      runForecast,
      reset,
      hasForecast: Boolean(currentEvent && prediction),
    }),
    [currentEvent, prediction, resources, routing, historicalComparison, status, error, runForecast, reset]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return ctx;
}
