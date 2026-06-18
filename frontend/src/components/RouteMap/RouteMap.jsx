import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Layers, Tent } from 'lucide-react';
import { getRiskBand } from '../../utils/riskUtils';
import { createVenueIcon, createZoneIcon } from '../../utils/mapIcons';
import { generateHeatmapData, generateCrowdFlowData } from '../../utils/mockData';
import { useEventContext } from '../../context/EventContext.jsx';
import HeatmapLayer from './HeatmapLayer';

// Component to handle map re-centering
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function RouteMap({ event, prediction, resources, routing }) {
  const { isSnapping } = useEventContext();
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCrowd, setShowCrowd] = useState(false);
  const [showZones, setShowZones] = useState(true);

  if (!event || !routing) return null;

  const center = [event.latitude, event.longitude];
  const { affectedRoutes, diversionRoutes, closureZone } = routing;
  const band = getRiskBand(prediction?.congestionRiskScore ?? 50);

  // Generate heatmap and crowd data once per event
  const heatmapData = React.useMemo(() => generateHeatmapData(event, prediction), [event, prediction]);
  const crowdData = React.useMemo(() => generateCrowdFlowData(event, prediction), [event, prediction]);

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-console-border bg-console-panel/80">
      <div className="flex items-center justify-between border-b border-console-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-signal" />
          <h3 className="font-display text-sm font-semibold text-console-text">
            Tactical Map
          </h3>
          {isSnapping && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-signal animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-signal"></span>
              Snapping routes...
            </span>
          )}
        </div>
        
        {/* Map Layers Toggle */}
        <div className="flex items-center gap-2 rounded-md bg-console-bg p-1">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              showHeatmap ? 'bg-signal text-white' : 'text-console-muted hover:text-console-text'
            }`}
          >
            <Layers size={12} /> Heatmap
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              showZones ? 'bg-console-raised text-console-text' : 'text-console-muted hover:text-console-text'
            }`}
          >
            <Tent size={12} /> Barricades
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-[#070B14]">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%', background: '#070B14' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapController center={center} zoom={14} />

          {/* Dark Base Map */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Custom Heatmap Layer */}
          {showHeatmap && <HeatmapLayer points={heatmapData} />}

          {/* Closure Zone Circle */}
          <Circle
            center={closureZone.center}
            radius={closureZone.radiusMeters}
            pathOptions={{
              color: '#FF4D5E', // risk-critical
              fillColor: '#FF4D5E',
              fillOpacity: 0.1,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />

          {/* Affected Routes (Congestion) */}
          {affectedRoutes.map((route) => {
            const levelBand = getRiskBand(
              route.congestionLevel === 'critical' ? 90 :
              route.congestionLevel === 'high' ? 70 :
              route.congestionLevel === 'moderate' ? 45 : 20
            );

            return (
              <Polyline
                key={route.id}
                positions={route.coordinates}
                pathOptions={{
                  color: levelBand.hex,
                  weight: 5,
                  opacity: 0.8,
                }}
              />
            );
          })}

          {/* Diversion Routes (Safe) */}
          {diversionRoutes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.coordinates}
              pathOptions={{
                color: '#4C8DFF', // signal
                weight: 4,
                opacity: 0.9,
                dashArray: '8, 8',
              }}
            />
          ))}

          {/* Deployment Zones (Barricades) */}
          {showZones && resources?.deploymentZones?.map((zone, i) => {
             const zBand = getRiskBand(
              zone.priority === 'critical' ? 90 :
              zone.priority === 'high' ? 70 :
              zone.priority === 'moderate' ? 45 : 20
            );
            return (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={createZoneIcon(zBand.hex, String.fromCharCode(65 + i))}
              />
            );
          })}

          {/* Event Pin */}
          <Marker position={center} icon={createVenueIcon(band.hex)} />
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] rounded-md border border-console-border bg-console-panel/90 p-3 backdrop-blur shadow-xl">
          <div className="space-y-2 text-[10px] font-medium uppercase tracking-wide text-console-text">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-6 rounded-full bg-signal opacity-90" style={{ borderBottom: '2px dashed #0F1729' }}></div>
              Diversion Route
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-risk-critical opacity-80"></div>
              Severe Congestion
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-risk-high opacity-80"></div>
              Heavy Traffic
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-risk-critical/50 bg-risk-critical/10" style={{ borderStyle: 'dashed' }}></div>
              Closure Perimeter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
