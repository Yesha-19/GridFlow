import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { generateHourlyProfile } from '../../utils/mockData';
import { getRiskBand } from '../../utils/riskUtils';

// NOTE: the hourly breakdown is presentation-layer enrichment derived from the
// single risk score for now. Once the backend exposes a per-hour forecast on
// /api/predict, swap generateHourlyProfile() for that field directly.
export default function AnalyticsPanel({ event, prediction }) {
  const profile = useMemo(
    () => (event && prediction ? generateHourlyProfile(event, prediction) : []),
    [event, prediction]
  );

  if (!profile.length) return null;

  const startHour = new Date(event.startTime).getHours();
  const peakHour = profile.reduce((a, b) => (b.value > a.value ? b : a), profile[0]);

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          24-Hour Congestion Outlook
        </h3>
        <span className="ml-auto font-mono text-[11px] text-console-muted">
          Peak {String(peakHour.hour).padStart(2, '0')}:00
        </span>
      </div>

      <div className="mt-5 h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={profile}
            margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#161F36" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#7C8AA8"
              tick={{ fill: '#7C8AA8', fontSize: 10, fontFamily: 'Space Grotesk' }}
              tickLine={false}
              axisLine={{ stroke: '#232E4A' }}
              ticks={[0, 6, 12, 18, 23]}
              tickFormatter={(h) => `${String(h).padStart(2, '0')}:00`}
            />
            <YAxis
              stroke="#7C8AA8"
              domain={[0, 100]}
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
              formatter={(v) => [`${v}%`, 'Congestion Risk']}
              labelFormatter={(h) => `Time: ${String(h).padStart(2, '0')}:00`}
            />
            <ReferenceLine
              x={startHour}
              stroke="#4C8DFF"
              strokeDasharray="3 3"
              label={{
                value: 'start',
                position: 'top',
                fill: '#4C8DFF',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Congestion Risk"
              stroke="#4C8DFF"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.hour === startHour) {
                  return (
                    <circle key={`dot-${payload.hour}`} cx={cx} cy={cy} r={5} fill="#4C8DFF" stroke="#0F1729" strokeWidth={1.5} />
                  );
                }
                return (
                  <circle key={`dot-${payload.hour}`} cx={cx} cy={cy} r={3} fill="#4C8DFF" />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-console-muted">
        <Legend color="bg-risk-low" label="Low" />
        <Legend color="bg-risk-moderate" label="Moderate" />
        <Legend color="bg-risk-high" label="High" />
        <Legend color="bg-risk-critical" label="Critical" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
