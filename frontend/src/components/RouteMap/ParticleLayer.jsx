import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/**
 * ParticleLayer — Canvas-based crowd flow particle simulation rendered
 * directly on the Leaflet map using requestAnimationFrame.
 *
 * Architecture:
 * - Attaches a <canvas> to the Leaflet map's overlay pane (z-index 400).
 * - All drawing happens in a single rAF loop — no React re-renders during animation.
 * - Particle positions are stored in plain Float32Arrays for memory efficiency.
 * - Speed multiplier is driven by a ref so changes take effect immediately
 *   without restarting the animation loop.
 */

const PARTICLE_RADIUS = 2.8;
const TRAIL_LENGTH = 6;

// Color palette keyed to zone type
const COLORS = {
  diversion: { fill: 'rgba(76,141,255,0.85)', glow: 'rgba(76,141,255,0.25)' },   // signal blue
  congested: { fill: 'rgba(255,77,94,0.85)',  glow: 'rgba(255,77,94,0.25)' },    // risk-critical
  normal:    { fill: 'rgba(47,212,128,0.80)', glow: 'rgba(47,212,128,0.20)' },   // risk-low
};

function lerpLngLat(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/**
 * Build particle definitions from mockData crowd flow particles and routing data.
 */
function buildParticles(crowdData, routing, score) {
  const particles = [];

  // Crowd flow particles (move toward venue center — congestion behaviour)
  crowdData.forEach((p, i) => {
    const isCongested = score >= 60;
    particles.push({
      id: `crowd-${i}`,
      type: isCongested ? 'congested' : 'normal',
      path: [
        { lat: p.startLat, lng: p.startLng },
        { lat: p.endLat,   lng: p.endLng   },
      ],
      speed: isCongested ? p.speed * 0.25 : p.speed * 0.7,
      t: p.delay % 1,        // normalised 0-1 position along path
      delay: p.delay,
    });
  });

  // Diversion route particles (fast, smooth)
  routing?.diversionRoutes?.forEach((route, ri) => {
    const n = 8 + ri * 3;
    for (let i = 0; i < n; i++) {
      particles.push({
        id: `div-${ri}-${i}`,
        type: 'diversion',
        path: route.coordinates.map(([lat, lng]) => ({ lat, lng })),
        speed: 0.6 + Math.random() * 0.4,
        t: Math.random(),
        delay: 0,
      });
    }
  });

  return particles;
}

export default function ParticleLayer({ crowdData, routing, riskScore, speedMultiplier, visible }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const speedRef = useRef(speedMultiplier);

  // Sync speed ref immediately without stopping the loop
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);

  useEffect(() => {
    if (!visible || !crowdData?.length) return;
    particlesRef.current = buildParticles(crowdData, routing, riskScore);
  }, [crowdData, routing, riskScore, visible]);

  useEffect(() => {
    if (!map) return;

    // Create canvas and attach to Leaflet's overlay pane
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350';
    canvasRef.current = canvas;

    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);

    function resize() {
      const size = map.getSize();
      canvas.width  = size.x;
      canvas.height = size.y;
    }
    resize();

    function projectPoint(latlng) {
      const pt = map.latLngToContainerPoint(latlng);
      // Correct for Leaflet's pane offset
      const panePos = map.getPanes().overlayPane.getBoundingClientRect();
      const mapRect  = map.getContainer().getBoundingClientRect();
      return {
        x: pt.x - (panePos.left - mapRect.left),
        y: pt.y - (panePos.top  - mapRect.top),
      };
    }

    let lastTime = performance.now();

    function draw(now) {
      rafRef.current = requestAnimationFrame(draw);
      if (!visible) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const speed = speedRef.current;
      const particles = particlesRef.current;

      particles.forEach((p) => {
        // Advance position
        p.t += dt * p.speed * speed * 0.15;
        if (p.t > 1) p.t -= 1;

        // Interpolate along multi-point path
        const pathLen = p.path.length - 1;
        const globalT = p.t * pathLen;
        const segIdx  = Math.min(Math.floor(globalT), pathLen - 1);
        const segT    = globalT - segIdx;

        const from = p.path[segIdx];
        const to   = p.path[segIdx + 1] ?? p.path[segIdx];
        const pos  = lerpLngLat(from, to, segT);

        const { x, y } = projectPoint(pos);

        // Draw trail
        const col = COLORS[p.type] ?? COLORS.normal;

        // Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, PARTICLE_RADIUS * 4);
        grad.addColorStop(0, col.glow);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, PARTICLE_RADIUS * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = col.fill;
        ctx.beginPath();
        ctx.arc(x, y, PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    rafRef.current = requestAnimationFrame(draw);

    map.on('move zoom resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      map.off('move zoom resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [map, visible]);

  return null;
}
