import React, { useEffect, useState } from 'react';
import { Cloud, CloudLightning, CloudRain, Droplets, Wind, AlertTriangle, Sun } from 'lucide-react';
import { useEventContext } from '../../context/EventContext.jsx';
import { fetchBengaluruWeather } from '../../services/weatherApi';

export default function WeatherPanel() {
  const { weatherData, setWeatherData } = useEventContext();
  const [loading, setLoading] = useState(!weatherData);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const data = await fetchBengaluruWeather();
        if (active) {
          setWeatherData(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError('Failed to fetch weather');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (!weatherData) {
      loadWeather();
    }

    // Refresh weather telemetry every 10 minutes
    const interval = setInterval(loadWeather, 10 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [weatherData, setWeatherData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-console-border bg-console-panel/80 p-5 animate-pulse flex flex-col items-center justify-center h-40">
        <div className="text-console-muted text-xs font-mono">Loading weather telemetry...</div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="rounded-xl border border-console-border bg-console-panel/80 p-5 flex flex-col items-center justify-center h-40">
        <AlertTriangle className="text-risk-high h-6 w-6 mb-2" />
        <div className="text-console-text text-xs font-mono">{error}</div>
      </div>
    );
  }

  const { temp, condition, description, isRaining, humidity, windSpeed, isMock } = weatherData || {};

  // Map weather conditions to styling & icons
  const getWeatherIcon = (cond) => {
    switch (cond) {
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className="text-sky-400 h-10 w-10" />;
      case 'Thunderstorm':
        return <CloudLightning className="text-yellow-500 h-10 w-10 animate-pulse" />;
      case 'Clouds':
        return <Cloud className="text-slate-400 h-10 w-10" />;
      case 'Clear':
        return <Sun className="text-yellow-400 h-10 w-10 animate-[spin_10s_linear_infinite]" />;
      default:
        return <Sun className="text-yellow-400 h-10 w-10" />;
    }
  };

  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-5 relative overflow-hidden">
      <div className="flex items-center gap-2">
        <Cloud className="text-sky-400" size={16} />
        <h3 className="font-display text-sm font-semibold text-console-text">
          Weather Telemetry
        </h3>
        {isMock && (
          <span className="ml-auto rounded-full bg-console-bg px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-console-muted border border-console-border">
            Mock Mode
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWeatherIcon(condition)}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-bold text-console-text">
                {temp?.toFixed(1)}
              </span>
              <span className="font-mono text-lg text-console-muted">°C</span>
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold text-console-muted">
              {description}
            </div>
          </div>
        </div>
      </div>

      {/* Rain / Storm Warning Badge */}
      {isRaining && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-risk-critical/30 bg-risk-critical/10 px-3 py-2 text-xs text-risk-critical animate-pulse font-mono font-semibold">
          <AlertTriangle size={14} className="text-risk-critical" />
          <span>WARNING: Precipitation detected. High congestion multiplier active.</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-console-border bg-console-raised/60 px-2 py-2">
          <div className="flex items-center justify-center gap-1.5 text-console-muted">
            <Droplets size={12} className="text-blue-400" />
            <span className="text-[10px] uppercase tracking-wide">Humidity</span>
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-console-text">{humidity}%</div>
        </div>
        <div className="rounded-md border border-console-border bg-console-raised/60 px-2 py-2">
          <div className="flex items-center justify-center gap-1.5 text-console-muted">
            <Wind size={12} className="text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wide">Wind</span>
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-console-text">{windSpeed} m/s</div>
        </div>
      </div>
    </div>
  );
}
