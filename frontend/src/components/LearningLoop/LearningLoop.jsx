import React, { useMemo } from 'react';
import { Brain, TrendingUp, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
        <div className="mt-2 h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#161F36" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#7C8AA8"
                tick={{ fill: '#7C8AA8', fontSize: 10, fontFamily: 'Space Grotesk' }}
                tickLine={false}
                axisLine={{ stroke: '#232E4A' }}
              />
              <YAxis
                stroke="#7C8AA8"
                domain={[60, 100]}
                tick={{ fill: '#7C8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#232E4A' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1729',
                  borderColor: '#232E4A',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#E6ECF8',
                }}
                formatter={(v) => [`${v}%`, 'Accuracy']}
                labelStyle={{ color: '#7C8AA8', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke="#4C8DFF"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1, fill: '#4C8DFF' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
