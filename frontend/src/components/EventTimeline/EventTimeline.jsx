import React from 'react';
import { Clock, Zap, Wind, CheckCircle2 } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';

const PHASES = [
  { key: 'setup', label: 'Setup & Staging', icon: Clock, offset: -60, color: 'text-signal' },
  { key: 'buildup', label: 'Crowd Build-up', icon: Zap, offset: 0, color: 'text-risk-moderate' },
  { key: 'peak', label: 'Peak Congestion', icon: Zap, offset: null, color: 'text-risk-critical' },
  { key: 'dispersal', label: 'Dispersal', icon: Wind, offset: null, color: 'text-risk-high' },
  { key: 'clear', label: 'All Clear', icon: CheckCircle2, offset: null, color: 'text-risk-low' },
];

/**
 * EventTimeline — animated timeline showing event progression phases.
 */
export default function EventTimeline({ event, prediction }) {
  const countdown = useCountdown(event?.startTime);

  if (!event || !prediction) return null;

  const peakOffset = prediction.peakOffsetMinutes || 40;
  const durationMin = (event.durationHours || 4) * 60;

  // Compute phase offsets
  const phases = PHASES.map((phase, i) => {
    let minutesFromStart;
    if (i === 0) minutesFromStart = -60;
    else if (i === 1) minutesFromStart = 0;
    else if (i === 2) minutesFromStart = peakOffset;
    else if (i === 3) minutesFromStart = peakOffset + Math.round(durationMin * 0.3);
    else minutesFromStart = durationMin + 30;

    return {
      ...phase,
      minutesFromStart,
      time: formatOffset(minutesFromStart),
    };
  });

  // Determine current phase based on countdown
  let currentPhaseIdx = 0;
  if (countdown.isPast) {
    const minutesPast = (countdown.hours * 60 + countdown.minutes);
    if (minutesPast > durationMin) currentPhaseIdx = 4;
    else if (minutesPast > peakOffset + durationMin * 0.3) currentPhaseIdx = 3;
    else if (minutesPast > peakOffset) currentPhaseIdx = 2;
    else currentPhaseIdx = 1;
  }

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-signal" />
        <h3 className="font-display text-sm font-semibold text-console-text">
          Event Timeline
        </h3>
        <span className="ml-auto font-mono text-[11px] text-console-muted">
          {countdown.isPast ? 'Event in progress' : `T-minus ${countdown.label}`}
        </span>
      </div>

      <div className="mt-5 relative">
        {/* Timeline track */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-console-border" />

        <div className="space-y-4">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = i === currentPhaseIdx;
            const isPast = i < currentPhaseIdx;
            const isFuture = i > currentPhaseIdx;

            return (
              <div key={phase.key} className="relative flex items-start gap-3 pl-0">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isActive
                      ? `${phase.color} border-current bg-console-bg shadow-glow`
                      : isPast
                      ? 'border-risk-low/50 bg-risk-low/10 text-risk-low'
                      : 'border-console-border bg-console-raised text-console-muted'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Icon size={14} className={isActive ? 'animate-pulse' : ''} />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-1 ${isFuture ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-console-text' : 'text-console-muted'
                      }`}
                    >
                      {phase.label}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-signal">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-console-muted">
                    {phase.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatOffset(minutes) {
  if (minutes < 0) return `${Math.abs(minutes)}min before start`;
  if (minutes === 0) return 'Event starts';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `+${h}h ${m}m after start`;
  return `+${m}min after start`;
}
