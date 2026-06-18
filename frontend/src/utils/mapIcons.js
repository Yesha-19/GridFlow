import L from 'leaflet';

/**
 * Leaflet's default marker images don't resolve cleanly through Vite's
 * bundler. Sidestepping that entirely by building markers as inline SVG
 * divIcons — also lets every marker match the console's risk palette.
 */
export function createVenueIcon(color = '#4C8DFF') {
  return L.divIcon({
    className: 'venue-pulse-icon',
    html: `
      <span style="position:relative; display:flex; align-items:center; justify-content:center; width:26px; height:26px;">
        <span class="animate-pulse-ring" style="position:absolute; inset:0; border-radius:999px; background:${color};"></span>
        <span style="position:relative; width:14px; height:14px; border-radius:999px; background:${color}; border:2px solid #070B14; box-shadow:0 0 0 2px ${color}55;"></span>
      </span>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function createZoneIcon(color = '#7C8AA8', label = '') {
  return L.divIcon({
    className: 'zone-icon',
    html: `
      <span style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:6px; background:#0F1729; border:1.5px solid ${color}; color:${color}; font-family: 'JetBrains Mono', monospace; font-size:10px; font-weight:600;">
        ${label}
      </span>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
