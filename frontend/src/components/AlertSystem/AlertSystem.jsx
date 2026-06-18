import React, { useMemo } from 'react';
import { Bell, AlertTriangle, Info, Shield, Radio } from 'lucide-react';
import { generateAlertFeed } from '../../utils/mockData';

const ALERT_STYLES = {
  critical: {
    icon: AlertTriangle,
    border: 'border-risk-critical/30',
    bg: 'bg-risk-critical/5',
    iconColor: 'text-risk-critical',
    dot: 'bg-risk-critical',
  },
  high: {
    icon: AlertTriangle,
    border: 'border-risk-high/30',
    bg: 'bg-risk-high/5',
    iconColor: 'text-risk-high',
    dot: 'bg-risk-high',
  },
  moderate: {
    icon: Shield,
    border: 'border-risk-moderate/30',
    bg: 'bg-risk-moderate/5',
    iconColor: 'text-risk-moderate',
    dot: 'bg-risk-moderate',
  },
  info: {
    icon: Info,
    border: 'border-signal/20',
    bg: 'bg-signal/5',
    iconColor: 'text-signal',
    dot: 'bg-signal',
  },
  low: {
    icon: Info,
    border: 'border-risk-low/20',
    bg: 'bg-risk-low/5',
    iconColor: 'text-risk-low',
    dot: 'bg-risk-low',
  },
};

/**
 * AlertSystem — real-time notification feed showing deployment status.
 */
export default function AlertSystem({ event, prediction }) {
  const alerts = useMemo(
    () => (event && prediction ? generateAlertFeed(event, prediction) : []),
    [event, prediction]
  );

  if (!alerts.length) return null;

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <Radio size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          Live Alert Feed
        </h3>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-console-muted">
            Live
          </span>
        </span>
      </div>

      <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto scrollbar-console">
        {alerts.map((alert) => {
          const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
          const Icon = style.icon;
          const timeAgo = getTimeAgo(alert.timestamp);

          return (
            <div
              key={alert.id}
              className={`rounded-lg border ${style.border} ${style.bg} p-3 transition-all duration-300 hover:brightness-110`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-console-text">
                      {alert.title}
                    </span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-console-muted">
                    {alert.message}
                  </p>
                  <span className="mt-1 block font-mono text-[9px] text-console-muted/70">
                    {timeAgo}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
