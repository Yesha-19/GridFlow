import React, { useMemo } from 'react';
import {
  BarChart3, TrendingUp, MapPin, Calendar, Users, Target,
  Activity, Zap, Award
} from 'lucide-react';
import { generateCityAnalytics, generateAccuracyTrend } from '../utils/mockData';
import { getRiskBand } from '../utils/riskUtils';

/**
 * Analytics page — city-wide congestion insights and model performance.
 */
export default function Analytics() {
  const analytics = useMemo(() => generateCityAnalytics(), []);
  const accuracyTrend = useMemo(() => generateAccuracyTrend(), []);

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
        <div className="mt-5 flex h-40 items-end gap-1">
          {analytics.monthlyTrend.map(({ month, events, avgScore }) => {
            const band = getRiskBand(avgScore);
            const height = `${(events / 100) * 100}%`;
            return (
              <div key={month} className="group relative flex-1">
                <div
                  className={`rounded-t-sm ${band.bgClass} opacity-70 transition-all duration-500 group-hover:opacity-100`}
                  style={{ height }}
                />
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded bg-console-bg px-1.5 py-0.5 text-[9px] text-console-text opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  {events} events · Score {avgScore}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-console-muted">
          {analytics.monthlyTrend.map(t => (
            <span key={t.month} className="flex-1 text-center">{t.month}</span>
          ))}
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
        <div className="mt-4 flex h-28 items-end gap-1">
          {accuracyTrend.map(({ month, accuracy }) => {
            const height = ((accuracy - 60) / 40) * 100;
            return (
              <div key={month} className="group relative flex-1">
                <div
                  className="rounded-t-sm bg-gradient-to-t from-signal/60 to-signal transition-all duration-500 group-hover:from-signal/80 group-hover:to-signal"
                  style={{ height: `${Math.max(4, height)}%` }}
                />
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-console-text opacity-0 transition-opacity group-hover:opacity-100">
                  {accuracy}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-console-muted">
          {accuracyTrend.filter((_, i) => i % 2 === 0).map(t => (
            <span key={t.month}>{t.month}</span>
          ))}
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
