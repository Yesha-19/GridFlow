import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || !points.length) return;

    // Convert points to leaflet-heat format: [lat, lng, intensity]
    const heatPoints = points.map(p => [p.lat, p.lng, p.intensity]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.2: '#0F1729', // transparent base
        0.4: '#F5B83D', // moderate
        0.7: '#FF7A45', // high
        1.0: '#FF4D5E'  // critical
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
