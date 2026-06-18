import React, { useMemo } from 'react';
import { Brain, TrendingUp, RefreshCw } from 'lucide-react';
import { generateAccuracyTrend } from '../../utils/mockData';
import { getRiskBand } from '../../utils/riskUtils';

/**
 * LearningLoop — Post-event learning visualization.
 * Shows model accuracy improvement over time as a feedback loop.
 */
export default function LearningLoop() {
  const trend = useMemo(() => generateAccuracyTrend(), []);

  const latestAccuracy = trend[trend.length - 1]?.accuracy ?? 0;
  const improvement = (trend[trend.length - 1]?.accuracy ?? 0) - (trend[0]?.accuracy ?? 0);
  const maxAccuracy = Math.max(...trend.map(t => t.accuracy));

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <Brain size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          Post-Event Learning Loop
        </h3>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-risk-low/10 px-2 py-0.5 text-[10px] font-semibold text-risk-low">
          <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
          AUTO-UPDATING
        </span>
      </div>
      <p className="mt-1 text-xs text-console-muted">
        Model accuracy improves as more post-event outcomes are logged.
      </p>

      {/* Key metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile label="Current Accuracy" value={`${latestAccuracy}%`} color="text-risk-low" />
        <MetricTile label="Improvement" value={`+${improvement.toFixed(1)}%`} color="text-signal" />
        <MetricTile label="Peak Accuracy" value={`${maxAccuracy}%`} color="text-console-text" />
      </div>

      {/* Accuracy trend chart */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[10px] text-console-muted">
          <span>MODEL ACCURACY OVER TIME</span>
          <span className="flex items-center gap-1">
            <TrendingUp size={10} className="text-risk-low" />
            Trending up
          </span>
        </div>
        <div className="mt-2 flex h-24 items-end gap-[3px]">
          {trend.map(({ month, accuracy }, i) => {
            const height = ((accuracy - 60) / 40) * 100;
            const band = getRiskBand(accuracy);
            return (
              <div key={month} className="group relative flex-1">
                <div
                  className="rounded-t-sm bg-signal/70 transition-all duration-500 group-hover:bg-signal"
                  style={{ height: `${Math.max(4, height)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-console-bg px-1.5 py-0.5 text-[9px] text-console-text opacity-0 transition-opacity group-hover:opacity-100">
                  {accuracy}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-console-muted">
          {trend.filter((_, i) => i % 3 === 0).map(t => (
            <span key={t.month}>{t.month}</span>
          ))}
        </div>
      </div>

      {/* Learning events log */}
      <div className="mt-4 space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-console-muted">
          Recent weight updates
        </p>
        {[
          { event: 'Ganesh Chaturthi outcome logged', delta: '+0.8%', time: '2h ago' },
          { event: 'IPL match post-analysis complete', delta: '+0.5%', time: '1d ago' },
          { event: 'Rally prediction calibrated', delta: '+1.2%', time: '3d ago' },
        ].map((log, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md bg-console-raised/40 px-2.5 py-1.5 text-[11px]"
          >
            <span className="text-console-text">{log.event}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-risk-low">{log.delta}</span>
              <span className="text-console-muted">{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricTile({ label, value, color = 'text-console-text' }) {
  return (
    <div className="rounded-md border border-console-border bg-console-raised/60 p-2.5 text-center">
      <div className={`font-mono text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-console-muted">{label}</div>
    </div>
  );
}
