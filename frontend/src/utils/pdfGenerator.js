import jsPDF from 'jspdf';

/**
 * generateBriefingPDF
 *
 * Creates a professional police operational briefing PDF from dashboard data.
 * Architecture:
 *   1. Build a hidden DOM node styled as the PDF page content.
 *   2. Capture it with html2canvas (handles CSS, colors, fonts).
 *   3. Embed the canvas image into jsPDF pages.
 *   4. Stream-download automatically.
 *
 * @param {object} opts
 * @param {object} opts.event          - Event form data
 * @param {object} opts.prediction     - Risk prediction results
 * @param {object} opts.resources      - Deployment resources
 * @param {object} opts.routing        - Route data (affected + diversion)
 * @param {string|null} opts.mapImageDataUrl - Optional map screenshot (base64 PNG)
 */
export async function generateBriefingPDF({ event, prediction, resources, routing, mapImageDataUrl }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const colors = {
    bg:         [7, 11, 20],
    panel:      [15, 23, 42],
    border:     [35, 46, 74],
    text:       [220, 230, 248],
    muted:      [100, 116, 150],
    signal:     [76, 141, 255],
    low:        [47, 212, 128],
    moderate:   [245, 184, 61],
    high:       [255, 122, 69],
    critical:   [255, 77, 94],
    white:      [255, 255, 255],
  };

  function riskColor(score) {
    if (score >= 80) return colors.critical;
    if (score >= 60) return colors.high;
    if (score >= 35) return colors.moderate;
    return colors.low;
  }

  function riskLabel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MODERATE';
    return 'LOW';
  }

  function setColor(rgb) { pdf.setTextColor(...rgb); }
  function setFill(rgb)  { pdf.setFillColor(...rgb); }
  function setDraw(rgb)  { pdf.setDrawColor(...rgb); }

  function pageBackground() {
    setFill(colors.bg);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  }

  function newPage() {
    pdf.addPage();
    pageBackground();
    y = MARGIN;
  }

  function ensureSpace(needed) {
    if (y + needed > PAGE_H - MARGIN) newPage();
  }

  function hLine(yPos, color = colors.border) {
    setDraw(color);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
  }

  function sectionHeader(title, iconChar = '▸') {
    ensureSpace(12);
    setFill(colors.panel);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, 'F');
    setColor(colors.signal);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${iconChar}  ${title.toUpperCase()}`, MARGIN + 4, y + 5.5);
    y += 11;
  }

  function kv(label, value, labelW = 55) {
    ensureSpace(7);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    setColor(colors.muted);
    pdf.text(label, MARGIN + 2, y);
    setColor(colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(value ?? '—'), MARGIN + labelW, y);
    y += 6;
  }

  function badge(text, color, x, bY) {
    const pad = 3;
    const w = pdf.getTextWidth(text) + pad * 2;
    setFill(color);
    pdf.setFillColor(color[0], color[1], color[2], 0.15);
    pdf.roundedRect(x, bY - 4, w, 5.5, 1, 1, 'F');
    setColor(color);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text(text, x + pad, bY);
    return w;
  }

  function statBox(label, value, x, bY, w = 40, color = colors.signal) {
    setFill(colors.panel);
    setDraw(colors.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, bY, w, 16, 1.5, 1.5, 'FD');
    setColor(color);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(String(value), x + w / 2, bY + 9, { align: 'center' });
    setColor(colors.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(label.toUpperCase(), x + w / 2, bY + 14, { align: 'center' });
  }

  // ── PAGE 1 ─────────────────────────────────────────────────────────────────
  pageBackground();

  // Header banner
  setFill(colors.panel);
  pdf.rect(0, 0, PAGE_W, 38, 'F');
  setDraw(colors.signal);
  pdf.setLineWidth(0.5);
  pdf.line(0, 38, PAGE_W, 38);

  // Logo placeholder
  setFill(colors.signal);
  pdf.circle(MARGIN + 8, 19, 7, 'F');
  setColor(colors.white);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('PD', MARGIN + 8, 20.5, { align: 'center' });

  // Dept title
  setColor(colors.text);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('POLICE OPERATIONS COMMAND', MARGIN + 20, 16);
  setColor(colors.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Smart Crowd & Traffic Intelligence System  |  Operational Briefing', MARGIN + 20, 23);

  // Confidential badge
  badge('CONFIDENTIAL', colors.critical, PAGE_W - MARGIN - 28, 15);
  badge('OPERATIONAL', colors.signal,    PAGE_W - MARGIN - 24, 24);

  // Generated timestamp
  setColor(colors.muted);
  pdf.setFontSize(7);
  pdf.text(`Generated: ${new Date().toLocaleString('en-IN')}`, PAGE_W - MARGIN, 33, { align: 'right' });

  y = 46;

  // ── Event Identity ──────────────────────────────────────────────────────────
  sectionHeader('Event Identity', '●');

  kv('Event Name',   event?.eventName   ?? '—');
  kv('Venue',        event?.venueName   ?? '—');
  kv('Event Type',   event?.eventType?.replace(/_/g, ' ').toUpperCase() ?? '—');
  kv('Start Time',   event?.startTime ? new Date(event.startTime).toLocaleString('en-IN') : '—');
  kv('Duration',     event?.durationHours ? `${event.durationHours} hours` : '—');
  kv('Expected Crowd', event?.expectedAttendance?.toLocaleString('en-IN') ?? '—');
  kv('Coordinates',  `${(event?.latitude ?? 0).toFixed(5)}, ${(event?.longitude ?? 0).toFixed(5)}`);

  y += 4;

  // ── Risk Assessment ─────────────────────────────────────────────────────────
  sectionHeader('Risk Assessment Summary', '▲');

  const score = prediction?.congestionRiskScore ?? 0;
  const rc = riskColor(score);
  const rl = riskLabel(score);

  // Large risk score display
  ensureSpace(28);
  setFill(colors.panel);
  setDraw(rc);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 24, 2, 2, 'FD');

  // Score circle (approximate with bold text)
  setColor(rc);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text(String(score), MARGIN + 22, y + 16, { align: 'center' });
  pdf.setFontSize(9);
  pdf.text('/100', MARGIN + 34, y + 16);

  setColor(rc);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(rl, MARGIN + 55, y + 10);

  setColor(colors.muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Confidence: ${prediction?.confidenceScore ?? '—'}%`, MARGIN + 55, y + 17);
  pdf.text(`Est. Delay: ${fmtMinutes(prediction?.estimatedDelayMinutes)}`, MARGIN + 55, y + 23);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(colors.muted);
  pdf.text(`Affected Radius: ${prediction?.affectedRadiusKm ?? '—'} km`, MARGIN + 115, y + 10);
  pdf.text(`Peak offset: ${prediction?.peakOffsetMinutes ?? '—'} min`, MARGIN + 115, y + 17);

  y += 28;

  // ── Resource Deployment ─────────────────────────────────────────────────────
  y += 4;
  sectionHeader('Resource Deployment Plan', '⬡');

  ensureSpace(22);
  const boxW = (CONTENT_W - 6) / 4;
  statBox('Police',    resources?.policePersonnel ?? '—', MARGIN,              y, boxW, colors.signal);
  statBox('Wardens',   resources?.trafficWardens  ?? '—', MARGIN + boxW + 2,   y, boxW, colors.moderate);
  statBox('Barricades',resources?.barricades      ?? '—', MARGIN + (boxW+2)*2, y, boxW, colors.high);
  statBox('Ambulance', resources?.ambulanceStandby ?? '—',MARGIN + (boxW+2)*3, y, boxW, colors.critical);
  y += 20;

  // CCTV row
  ensureSpace(10);
  kv('CCTV Units', resources?.cctvUnits ?? '—');

  // Deployment zones
  if (resources?.deploymentZones?.length) {
    y += 2;
    ensureSpace(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setColor(colors.muted);
    pdf.text('PRIORITY DEPLOYMENT ZONES', MARGIN + 2, y);
    y += 5;

    resources.deploymentZones.forEach((zone, i) => {
      ensureSpace(8);
      const zColor = zone.priority === 'critical' ? colors.critical
                   : zone.priority === 'high'     ? colors.high
                   : zone.priority === 'moderate'  ? colors.moderate : colors.low;
      setFill(colors.panel);
      pdf.roundedRect(MARGIN, y - 3.5, CONTENT_W, 7, 1, 1, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setColor(colors.text);
      pdf.text(`${String(i+1).padStart(2,'0')}  ${zone.name}`, MARGIN + 3, y);
      setColor(colors.muted);
      pdf.text(`${zone.personnelCount} personnel`, MARGIN + 90, y);
      badge(zone.priority.toUpperCase(), zColor, PAGE_W - MARGIN - 30, y);
      y += 8;
    });
  }

  // ── Page 2 — Operational Recommendations ───────────────────────────────────
  newPage();

  sectionHeader('Operational Recommendations', '◆');

  // Diversion routes
  if (routing?.diversionRoutes?.length) {
    y += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    setColor(colors.signal);
    pdf.text('Suggested Diversion Routes', MARGIN + 2, y);
    y += 6;

    routing.diversionRoutes.forEach((route) => {
      ensureSpace(14);
      setFill(colors.panel);
      pdf.roundedRect(MARGIN, y - 3, CONTENT_W, 12, 1.5, 1.5, 'F');
      setColor(colors.signal);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text(route.name, MARGIN + 4, y + 2);
      setColor(colors.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(`Recommended for: ${route.recommendedFor ?? 'All vehicles'}`, MARGIN + 4, y + 7.5);
     if (route.distance_km != null) {
  pdf.text(`Distance: ${Number(route.distance_km).toFixed(1)} km`, MARGIN + 120, y + 2);
}
if (route.estimated_time_min != null) {
  pdf.text(`ETA: ${Math.round(Number(route.estimated_time_min))} min`, MARGIN + 120, y + 7.5);
}
      y += 15;
    });
  }

  // High risk zones (affected routes)
  y += 2;
  if (routing?.affectedRoutes?.length) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    setColor(colors.critical);
    pdf.text('High Risk Zones', MARGIN + 2, y);
    y += 6;

    routing.affectedRoutes.forEach((route) => {
      ensureSpace(10);
      const rc2 = route.congestionLevel === 'critical' ? colors.critical
                : route.congestionLevel === 'high'     ? colors.high
                : route.congestionLevel === 'moderate' ? colors.moderate : colors.low;
      setFill(colors.panel);
      pdf.roundedRect(MARGIN, y - 3, CONTENT_W, 8.5, 1, 1, 'F');
      setColor(colors.text);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(route.name, MARGIN + 4, y + 2);
      badge(route.congestionLevel.toUpperCase(), rc2, PAGE_W - MARGIN - 32, y + 2);
      y += 11;
    });
  }

  y += 4;
  ensureSpace(28);
  sectionHeader('Critical Monitoring Guidelines', '⚑');

  const guidelines = [
    'Maintain 1 officer per 200 crowd members at all entry/exit points.',
    'Deploy barricades 500m before event perimeter on all approach roads.',
    `Activate all diversion routes 60 minutes before predicted peak (T+${prediction?.peakOffsetMinutes ?? 0}min).`,
    'Establish medical team staging area within 200m of main entry gate.',
    'Keep radio channel clear for Command Center comms — use Channel 5.',
    `Initiate crowd dispersal protocol if density exceeds ${Math.round((prediction?.congestionRiskScore ?? 50) * 1.1)} persons/100m².`,
    'CCTV operators to flag stationary crowd clusters > 3 minutes immediately.',
  ];

  guidelines.forEach((g, i) => {
    ensureSpace(8);
    setFill(colors.signal);
    pdf.setFillColor(76, 141, 255, 0.15);
    pdf.roundedRect(MARGIN, y - 3.5, 5.5, 5.5, 0.8, 0.8, 'F');
    setColor(colors.signal);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(String(i + 1), MARGIN + 2.5, y, { align: 'center' });
    setColor(colors.text);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(g, CONTENT_W - 10);
    pdf.text(lines, MARGIN + 8, y);
    y += lines.length * 5 + 3;
  });

  // ── Map Snapshot (if captured) ──────────────────────────────────────────────
  if (mapImageDataUrl) {
    newPage();
    sectionHeader('Tactical Map Snapshot', '⊕');
    ensureSpace(120);
    const imgH = 110;
    const imgW = CONTENT_W;
    pdf.addImage(mapImageDataUrl, 'PNG', MARGIN, y, imgW, imgH);
    y += imgH + 4;
    setColor(colors.muted);
    pdf.setFontSize(7);
    pdf.text('Map shows heatmap overlay, congestion routes, diversion paths, and deployment zones.', MARGIN, y);
    y += 6;
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    setFill(colors.panel);
    pdf.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
    setDraw(colors.border);
    pdf.setLineWidth(0.3);
    pdf.line(0, PAGE_H - 12, PAGE_W, PAGE_H - 12);
    setColor(colors.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Generated by Smart Crowd & Traffic Intelligence System  |  RESTRICTED POLICE DOCUMENT', MARGIN, PAGE_H - 5);
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
  }

  const filename = `GridFlow_Briefing_${sanitizeFilename(event?.eventName ?? 'Event')}_${formatDateForFile(new Date())}.pdf`;
  pdf.save(filename);
}

// ── Utils ───────────────────────────────────────────────────────────────────

function fmtMinutes(total) {
  if (total == null) return '—';
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
}

function formatDateForFile(date) {
  return date.toISOString().slice(0, 10);
}
