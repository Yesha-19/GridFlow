import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';

const TIERS = {
  LOW: {
    label: 'LOW',
    icon: CheckCircle,
    color: 'text-risk-low',
    bg: 'bg-risk-low/10',
    border: 'border-risk-low/30',
    glow: 'shadow-[0_0_12px_rgba(47,212,128,0.15)]',
    desc: 'Minimal disruption expected. Standard monitoring sufficient.',
  },
  MEDIUM: {
    label: 'MEDIUM',
    icon: ShieldAlert,
    color: 'text-risk-moderate',
    bg: 'bg-risk-moderate/10',
    border: 'border-risk-moderate/30',
    glow: 'shadow-[0_0_12px_rgba(245,184,61,0.15)]',
    desc: 'Moderate impact. Deploy traffic wardens at key junctions.',
  },
  HIGH: {
    label: 'HIGH',
    icon: AlertTriangle,
    color: 'text-risk-high',
    bg: 'bg-risk-high/10',
    border: 'border-risk-high/30',
    glow: 'shadow-[0_0_12px_rgba(255,122,69,0.2)]',
    desc: 'Significant congestion expected. Full deployment recommended.',
  },
  CRITICAL: {
    label: 'CRITICAL',
    icon: AlertOctagon,
    color: 'text-risk-critical',
    bg: 'bg-risk-critical/10',
    border: 'border-risk-critical/30',
    glow: 'shadow-[0_0_16px_rgba(255,77,94,0.25)]',
    desc: 'Severe gridlock likely. Emergency protocols activated.',
  },
};

/**
 * Severity Badge — prominent tier display for officers.
 * "Officers think in tiers, not decimals."
 */
export default function SeverityBadge({ score, size = 'default' }) {
  let tierKey = 'LOW';
  if (score >= 80) tierKey = 'CRITICAL';
  else if (score >= 60) tierKey = 'HIGH';
  else if (score >= 35) tierKey = 'MEDIUM';

  const tier = TIERS[tierKey];
  const Icon = tier.icon;

  if (size === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${tier.bg} ${tier.color} ${tier.border} border`}
      >
        <Icon size={12} />
        {tier.label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border ${tier.border} ${tier.bg} ${tier.glow} p-4 transition-all duration-500`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tier.bg} ${tier.color}`}>
          <Icon size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-display text-lg font-bold tracking-wider ${tier.color}`}>
              {tier.label}
            </span>
            <span className="font-mono text-xs text-console-muted">
              SEVERITY
            </span>
          </div>
          <p className="mt-0.5 text-xs text-console-muted">{tier.desc}</p>
        </div>
      </div>
    </div>
  );
}
