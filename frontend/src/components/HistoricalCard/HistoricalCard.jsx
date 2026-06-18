import React from 'react';
import { History, TrendingUp, Users, Cone } from 'lucide-react';
import { getRiskBand, formatDateTime } from '../../utils/riskUtils';

/**
 * Historical Comparison Card — shows similar past events and their outcomes.
 * "Similar events at this location caused 67% congestion spike."
 */
export default function HistoricalCard({ historicalComparison }) {
  if (!historicalComparison || historicalComparison.length === 0) return null;

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <History size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          Historical Comparison
        </h3>
        <span className="ml-auto rounded-full bg-signal/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal">
          {historicalComparison.length} matches
        </span>
      </div>
      <p className="mt-1 text-xs text-console-muted">
        Based on event type, location, and crowd size similarity.
      </p>

      <div className="mt-4 space-y-3">
        {historicalComparison.map((item, i) => {
          const band = getRiskBand(item.congestionSpike);
          return (
            <div
              key={i}
              className="rounded-lg border border-console-border bg-console-raised/40 p-3 transition-colors hover:bg-console-raised/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-console-text">{item.eventName}</p>
                  <p className="mt-0.5 text-[11px] text-console-muted">
                    {formatDateTime(item.date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${band.softBgClass} ${band.textClass}`}
                >
                  {item.similarity}% match
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniStat
                  icon={<TrendingUp size={12} />}
                  label="Congestion"
                  value={`${item.congestionSpike}%`}
                  color={band.textClass}
                />
                <MiniStat
                  icon={<Users size={12} />}
                  label="Officers"
                  value={item.officersNeeded}
                />
                <MiniStat
                  icon={<Cone size={12} />}
                  label="Barricades"
                  value={item.barricadesUsed}
                />
              </div>

              {/* Congestion spike bar */}
              <div className="mt-2.5">
                <div className="h-1.5 w-full rounded-full bg-console-raised">
                  <div
                    className={`h-1.5 rounded-full ${band.bgClass} transition-all duration-700`}
                    style={{ width: `${Math.min(100, item.congestionSpike)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, color = 'text-console-text' }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-console-muted">
        {icon}
      </div>
      <div className={`mt-0.5 font-mono text-sm font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-console-muted">{label}</div>
    </div>
  );
}
