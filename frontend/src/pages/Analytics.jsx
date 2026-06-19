import React, { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, MapPin, Calendar, Users, Target,
  Activity, Zap, Award, Loader2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { getRiskBand } from '../utils/riskUtils';
import { getAnalytics } from '../services/analyticsApi';

/**
 * Analytics page — city-wide congestion insights and model performance.
 */
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-signal" size={32} />
      </div>
    );
  }

  const { analytics, accuracyTrend } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-signal" />
        <h1 className="font-display text-xl font-semibold text-console-text">
          City Analytics
        </h1>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-console-muted">
          Bengaluru Traffic Intelligence
        </span>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-console-muted">
        Comprehensive overview of event-driven congestion patterns, model performance,
        and resource deployment efficiency across the city.
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon={<Calendar size={16} />}
          label="Total Events Tracked"
          value={analytics.totalEvents.toLocaleString()}
          trend="+12%"
        />
        <KPICard
          icon={<Target size={16} />}
          label="Model Accuracy"
          value={`${analytics.avgAccuracy}%`}
          trend="+4.2%"
          trendColor="text-risk-low"
        />
        <KPICard
          icon={<Zap size={16} />}
          label="Avg Response Time"
          value={`${analytics.avgResponseTime}min`}
          trend="-3min"
          trendColor="text-risk-low"
        />
        <KPICard
          icon={<Award size={16} />}
          label="Prediction Confidence"
          value="89%"
          trend="+6%"
          trendColor="text-risk-low"
        />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Top Congestion Zones */}
        <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-risk-high" />
            <h3 className="font-display text-sm font-semibold text-console-text">
              Top Congestion Hotspots
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {analytics.topCongestionZones.map((zone, i) => {
              const band = getRiskBand(zone.score);
              const barWidth = `${zone.score}%`;
              return (
                <div key={zone.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-console-text">
                      <span className="font-mono text-console-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {zone.name}
                    </span>
                    <span className={`font-mono font-semibold ${band.textClass}`}>
                      {zone.score}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-console-raised">
                    <div
                      className={`h-1.5 rounded-full ${band.bgClass} transition-all duration-700`}
                      style={{ width: barWidth }}
                    />
                  </div>
                  <div className="mt-0.5 text-right text-[9px] text-console-muted">
                    {zone.events} events
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-signal" />
            <h3 className="font-display text-sm font-semibold text-console-text">
              Event Type Breakdown
            </h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {analytics.eventTypeBreakdown.map((item) => {
              const band = getRiskBand(item.avgScore);
              const maxCount = Math.max(...analytics.eventTypeBreakdown.map(e => e.count));
              const barWidth = `${(item.count / maxCount) * 100}%`;
              return (
                <div
                  key={item.type}
                  className="flex items-center gap-3 rounded-md border border-console-border bg-console-raised/40 px-3 py-2.5"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-console-text">{item.type}</span>
                      <span className="font-mono text-[11px] text-console-muted">
                        {item.count} events
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full rounded-full bg-console-raised">
                      <div
                        className={`h-1 rounded-full ${band.bgClass}`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${band.textClass}`}>
                    {item.avgScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="mt-5 rounded-xl border border-console-border bg-console-panel/80 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-signal" />
          <h3 className="font-display text-sm font-semibold text-console-text">
            Monthly Event Volume & Congestion
          </h3>
        </div>
        <div className="mt-5 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={analytics.monthlyTrend}
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
                yAxisId="left"
                stroke="#4C8DFF"
                tick={{ fill: '#7C8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#232E4A' }}
                label={{ value: 'Events', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fill: '#4C8DFF', fontSize: 10, fontFamily: 'Space Grotesk' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#FF7A45"
                tick={{ fill: '#7C8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#232E4A' }}
                label={{ value: 'Congestion Score', angle: 90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle', fill: '#FF7A45', fontSize: 10, fontFamily: 'Space Grotesk' } }}
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
                labelStyle={{ color: '#7C8AA8', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'Space Grotesk, sans-serif', paddingTop: '5px' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="events"
                name="Event Volume"
                stroke="#4C8DFF"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1, fill: '#4C8DFF' }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgScore"
                name="Congestion Score"
                stroke="#FF7A45"
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1, fill: '#FF7A45' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy over time */}
      <div className="mt-5 rounded-xl border border-console-border bg-console-panel/80 p-5">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-risk-low" />
          <h3 className="font-display text-sm font-semibold text-console-text">
            Model Accuracy Improvement
          </h3>
          <span className="ml-auto font-mono text-xs text-risk-low">
            {accuracyTrend[accuracyTrend.length - 1].accuracy}% current
          </span>
        </div>
        <div className="mt-4 h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={accuracyTrend}
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
                dot={{ r: 4, strokeWidth: 1, fill: '#4C8DFF' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, trendColor = 'text-signal' }) {
  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-4">
      <div className="flex items-center gap-2 text-console-muted">{icon}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-console-text">{value}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-console-muted">{label}</span>
        {trend && (
          <span className={`font-mono text-[10px] font-semibold ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
