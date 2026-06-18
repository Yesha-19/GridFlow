import React from 'react';
import { NavLink } from 'react-router-dom';
import { Radar, Activity, ClipboardList, BarChart3 } from 'lucide-react';
import { useEventContext } from '../../context/EventContext.jsx';

export default function NavBar() {
  const { hasForecast } = useEventContext();

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-signal bg-console-raised/50 rounded-md'
        : 'text-console-muted hover:text-console-text hover:bg-console-raised/30 rounded-md'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-console-border bg-console-bg/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal">
              <Radar size={18} className="text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-wider text-console-text">
                GRIDLOCK
              </span>
              <span className="ml-1 font-mono text-[10px] uppercase text-signal">
                2.0 MVP
              </span>
            </div>
          </NavLink>

          <div className="hidden items-center gap-2 sm:flex">
            <NavLink to="/" className={navClass} end>
              <Activity size={16} /> Console
            </NavLink>
            <NavLink
              to="/dashboard"
              className={navClass}
              onClick={(e) => {
                if (!hasForecast) {
                  e.preventDefault();
                }
              }}
              style={{
                opacity: hasForecast ? 1 : 0.5,
                cursor: hasForecast ? 'pointer' : 'not-allowed',
              }}
            >
              <Radar size={16} /> Dashboard
            </NavLink>
            <NavLink to="/validation" className={navClass}>
              <ClipboardList size={16} /> Validation
            </NavLink>
            <NavLink to="/analytics" className={navClass}>
              <BarChart3 size={16} /> Analytics
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-console-muted">
              System Online
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
