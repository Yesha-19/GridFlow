import React from 'react';
import { Camera, Cone, ShieldHalf, Siren, Users2 } from 'lucide-react';
import { formatNumber } from '../../utils/riskUtils';
import { RISK_LEVELS } from '../../utils/constants';

const RESOURCE_TILES = [
  { key: 'policePersonnel', label: 'Police personnel', icon: ShieldHalf },
  { key: 'trafficWardens', label: 'Traffic wardens', icon: Users2 },
  { key: 'barricades', label: 'Barricades', icon: Cone },
  { key: 'cctvUnits', label: 'CCTV units', icon: Camera },
  { key: 'ambulanceStandby', label: 'Ambulance standby', icon: Siren },
];

export default function ResourcePanel({ resources }) {
  if (!resources) return null;

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5">
      <h3 className="font-display text-sm font-semibold text-console-text">
        Recommended Deployment
      </h3>
      <p className="mt-0.5 text-xs text-console-muted">
        Scaled to expected attendance and event risk profile.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {RESOURCE_TILES.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-md border border-console-border bg-console-raised/60 p-3"
          >
            <Icon size={16} className="text-signal" />
            <div className="mt-2 font-mono text-lg font-semibold text-console-text">
              {formatNumber(resources[key])}
            </div>
            <div className="text-[11px] text-console-muted">{label}</div>
          </div>
        ))}
      </div>

      {resources.deploymentZones?.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-medium text-console-muted">Priority deployment zones</h4>
          <ul className="mt-2 space-y-1.5">
            {resources.deploymentZones.map((zone, i) => {
              const band = RISK_LEVELS[zone.priority] ?? RISK_LEVELS.low;
              return (
                <li
                  key={zone.id}
                  className="flex items-center justify-between rounded-md border border-console-border bg-console-raised/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] text-console-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-console-text">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-console-muted">
                      {zone.personnelCount} pax
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${band.softBgClass} ${band.textClass}`}
                    >
                      {band.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
