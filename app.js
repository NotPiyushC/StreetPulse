/* ═══════════════════════════════════════════════════════
   STREETPULSE — APPLICATION ENGINE
   Pune, Maharashtra — Edge Vision Infrastructure Network
═══════════════════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────
// POLYFILLS
// ────────────────────────────────────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2*r) r = w/2;
    if (h < 2*r) r = h/2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
  };
}

// ────────────────────────────────────────────────────────
// GLOBAL STATE
// ────────────────────────────────────────────────────────
const STATE = {
  mode: 'night',
  page: 'mission',
  driveRunning: false,
  driveFrame: 0,
  detectionCount: 0,
  alertCount: 247,
  syncSeconds: 12,
  showRoutes: true,
  showDetections: true,
  showHeatmap: false,
  showZones: false,
  layersOpen: false,
  vehicleProgress: 0.35,
  currentDispatchAlert: null,
  loadedAlerts: 5,
  currentFilter: 'all',
  animFrame: null,
  streetAnimFrame: null,
  miniBarsData: [60,75,82,90,88,95,100,98,94,85,92,97]
};

// ────────────────────────────────────────────────────────
// PUNE CITY DATA
// ────────────────────────────────────────────────────────

const PUNE_ALERTS = [
  { id:'SP-1842', type:'Pothole',        location:'Baner Road / Balewadi',           coords:[0.42,0.38], detected:'just now',  size:'1.4m',     severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1841', type:'Road crack',     location:'Aundh–Baner Link / 12',           coords:[0.31,0.29], detected:'2 min ago', size:'3.2m',     severity:'MEDIUM', color:'#F59E0B' },
  { id:'SP-1840', type:'Missing sign',   location:'University Road / Shivajinagar',  coords:[0.58,0.61], detected:'4 min ago', size:'–',        severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1839', type:'Overflowing bin',location:'Koregaon Park / Lane 5',          coords:[0.68,0.52], detected:'7 min ago', size:'87% full', severity:'LOW',    color:'#22D3A0' },
  { id:'SP-1838', type:'Damaged curb',   location:'FC Road / Deccan',                coords:[0.48,0.57], detected:'11 min ago',size:'0.8m',     severity:'MEDIUM', color:'#F59E0B' },
  { id:'SP-1837', type:'Blocked drain',  location:'JM Road / Laxmi Rd Junction',     coords:[0.52,0.44], detected:'14 min ago',size:'Full',     severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1836', type:'Pothole',        location:'Nagar Road / Mundhwa',            coords:[0.78,0.45], detected:'18 min ago',size:'2.1m',     severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1835', type:'Road crack',     location:'Pune–Satara Rd / Swargate',       coords:[0.45,0.72], detected:'22 min ago',size:'5.6m',     severity:'MEDIUM', color:'#F59E0B' },
  { id:'SP-1834', type:'Missing sign',   location:'Karve Road / Kothrud',            coords:[0.25,0.65], detected:'26 min ago',size:'–',        severity:'MEDIUM', color:'#F59E0B' },
  { id:'SP-1833', type:'Overflowing bin',location:'MG Road / Camp',                  coords:[0.60,0.36], detected:'31 min ago',size:'92% full', severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1832', type:'Damaged curb',   location:'Senapati Bapat Rd / Shivajinagar',coords:[0.38,0.50], detected:'35 min ago',size:'1.2m',     severity:'LOW',    color:'#22D3A0' },
  { id:'SP-1831', type:'Blocked drain',  location:'Pune–Nashik Hwy / Kalyani Ngr',  coords:[0.72,0.30], detected:'40 min ago',size:'Partial',  severity:'MEDIUM', color:'#F59E0B' },
  { id:'SP-1830', type:'Pothole',        location:'Tilak Road / Sadashiv Peth',      coords:[0.50,0.62], detected:'44 min ago',size:'0.9m',     severity:'LOW',    color:'#22D3A0' },
  { id:'SP-1829', type:'Road crack',     location:'Hadapsar / Magarpatta Rd',        coords:[0.82,0.60], detected:'49 min ago',size:'4.1m',     severity:'HIGH',   color:'#EF4444' },
  { id:'SP-1828', type:'Missing sign',   location:'Wakad / Hinjawadi Rd',            coords:[0.18,0.33], detected:'53 min ago',size:'–',        severity:'MEDIUM', color:'#F59E0B' },
];

const FLEET_DATA = [
  { id:'FLEET-042', route:'Baner–Aundh Loop / P-17',  zone:'NW Pune', status:'active',  detections:12, battery:'84%', kmToday:6.2,  progress:62 },
  { id:'FLEET-031', route:'FC Road / Deccan / P-09',   zone:'Central',  status:'active',  detections:8,  battery:'71%', kmToday:8.7,  progress:74 },
  { id:'FLEET-058', route:'Koregaon Park / P-22',      zone:'East',     status:'standby', detections:5,  battery:'92%', kmToday:4.1,  progress:41 },
  { id:'FLEET-019', route:'Nagar Road / Mundhwa / P-05',zone:'SE Pune', status:'active',  detections:19, battery:'55%', kmToday:11.3, progress:88 },
  { id:'FLEET-067', route:'Hadapsar / Magarpatta / P-33',zone:'SE Pune',status:'active',  detections:7,  battery:'88%', kmToday:7.0,  progress:55 },
  { id:'FLEET-024', route:'Karve Road / Kothrud / P-11', zone:'SW Pune', status:'standby',detections:3,  battery:'96%', kmToday:2.8,  progress:28 },
  { id:'FLEET-083', route:'MG Road / Camp / P-44',      zone:'Central', status:'active',  detections:14, battery:'62%', kmToday:9.5,  progress:79 },
  { id:'FLEET-011', route:'Hinjawadi / Wakad / P-02',   zone:'NW IT',   status:'active',  detections:6,  battery:'78%', kmToday:5.6,  progress:47 },
  { id:'FLEET-097', route:'Senapati Bapat Rd / P-16',   zone:'Central', status:'offline', detections:0,  battery:'12%', kmToday:0,    progress:0  },
  { id:'FLEET-046', route:'Pune-Nashik Hwy / P-28',     zone:'North',   status:'active',  detections:11, battery:'69%', kmToday:10.2, progress:83 },
  { id:'FLEET-073', route:'Tilak Rd / Sadashiv / P-07', zone:'Central', status:'active',  detections:9,  battery:'82%', kmToday:7.8,  progress:66 },
  { id:'FLEET-055', route:'Swargate / Pune-Satara / P-19',zone:'South', status:'standby', detections:2,  battery:'94%', kmToday:1.9,  progress:19 },
];

const PRIORITY_ZONES = [
  { name:'Nagar Road / Mundhwa',       priority:'critical', issues:23, area:'8.4 km²', desc:'Critical stretch with 23 active detections including 8 large potholes (>2m) and 4 blocked drains. Monsoon damage extensive.',  lastScanned:'6 min ago' },
  { name:'FC Road / Deccan',           priority:'critical', issues:17, area:'3.1 km²', desc:'Heavy pedestrian zone. Missing traffic signs at 3 major junctions. Damaged curbs near Fergusson College. Immediate action needed.' , lastScanned:'11 min ago' },
  { name:'Hadapsar / Magarpatta',      priority:'high',     issues:14, area:'6.2 km²', desc:'Cracked roads on Hadapsar road stretch. Multiple overflowing bins reported by local residents. Road cracks up to 5.6m.',          lastScanned:'22 min ago' },
  { name:'Baner Road / Balewadi',      priority:'high',     issues:12, area:'5.0 km²', desc:'Active vehicle FLEET-042 route. Fresh pothole detected near Balewadi signal. Ongoing scanning for 2+ hours.',                    lastScanned:'just now'   },
  { name:'MG Road / Camp',             priority:'high',     issues:11, area:'2.7 km²', desc:'Heritage zone with tourist traffic. Overflowing bins near German Bakery area. Multiple minor potholes mapped.',                    lastScanned:'31 min ago' },
  { name:'Koregaon Park',              priority:'medium',   issues:7,  area:'4.3 km²', desc:'Low-priority residential. Overflowing bins on Lanes 5 and 7. One minor missing sign at Lane 8 junction.',                        lastScanned:'35 min ago' },
];

const INTEL_CHARTS = [
  {
    title: 'Issue Distribution',
    sub: 'By type across all 247 detections',
    bars: [
      { label:'Potholes',        val:38, color:'#EF4444' },
      { label:'Road cracks',     val:26, color:'#F59E0B' },
      { label:'Missing signs',   val:14, color:'#A855F7' },
      { label:'Overflow bins',   val:12, color:'#22D3A0' },
      { label:'Damaged curbs',   val:7,  color:'#00D4FF' },
      { label:'Blocked drains',  val:3,  color:'#FF5A1F' },
    ]
  },
  {
    title: 'Severity by Zone',
    sub: 'Highest issue concentration per area',
    bars: [
      { label:'Nagar Rd',    val:85, color:'#EF4444' },
      { label:'FC Road',     val:72, color:'#EF4444' },
      { label:'Hadapsar',    val:60, color:'#F59E0B' },
      { label:'Baner',       val:52, color:'#F59E0B' },
      { label:'MG Road',     val:46, color:'#22D3A0' },
      { label:'Koregaon Pk', val:31, color:'#22D3A0' },
    ]
  }
];

// ────────────────────────────────────────────────────────
// MAP CANVAS
// ────────────────────────────────────────────────────────
const MAP = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  // Route waypoints (normalized 0..1 within canvas)
  route: [
    [0.20,0.30],[0.28,0.22],[0.38,0.19],[0.48,0.21],[0.60,0.26],
    [0.72,0.30],[0.78,0.38],[0.74,0.48],[0.68,0.55],[0.60,0.60],
    [0.50,0.65],[0.40,0.68],[0.30,0.65],[0.22,0.58],[0.18,0.48],
    [0.20,0.38],[0.22,0.30]
  ],
  vehiclePosIdx: 0,
  vehicleLerp: 0,
  scanProgress: 0.35,
  detectionMarkers: [],
  heatSpots: [],
  init() {
    this.canvas = document.getElementById('map-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Add detection markers from alerts
    PUNE_ALERTS.forEach((a,i) => {
      this.detectionMarkers.push({
        x: a.coords[0], y: a.coords[1],
        type: a.type,
        severity: a.severity,
        color: a.color,
        id: a.id,
        pulse: 0,
        visible: i < 8
      });
    });
    // Road labels
    this.labels = [
      { text:'BANER ROAD', x:0.32, y:0.17 },
      { text:'FC ROAD',    x:0.42, y:0.73 },
      { text:'JM ROAD',    x:0.57, y:0.50 },
    ];
    this.animate();
  },
  resize() {
    const c = this.canvas;
    const container = c.parentElement;
    this.width  = c.width  = container.offsetWidth;
    this.height = c.height = container.offsetHeight;
  },
  px(nx, ny) { return [nx * this.width, ny * this.height]; },
  animate() {
    this.vehicleLerp += 0.004;
    if (this.vehicleLerp >= 1) {
      this.vehicleLerp = 0;
      this.vehiclePosIdx = (this.vehiclePosIdx + 1) % (this.route.length - 1);
      this.scanProgress = Math.min(1, this.scanProgress + 0.04);
      // Reveal detections progressively
      this.detectionMarkers.forEach((m,i) => {
        if (!m.visible && Math.random() < 0.08) m.visible = true;
      });
    }
    this.detectionMarkers.forEach(m => { m.pulse = (m.pulse + 0.04) % (Math.PI * 2); });
    this.draw();
    STATE.animFrame = requestAnimationFrame(() => this.animate());
  },
  draw() {
    const { ctx, width: W, height: H } = this;
    const isDay = STATE.mode === 'day';

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = isDay ? '#E8E4DF' : '#0D1825';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = isDay ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const grid = 40;
    for (let x=0; x<W; x+=grid) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=grid) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Heatmap
    if (STATE.showHeatmap) {
      this.detectionMarkers.filter(m=>m.visible).forEach(m => {
        const [px,py] = this.px(m.x, m.y);
        const g = ctx.createRadialGradient(px,py,2,px,py,50);
        g.addColorStop(0, 'rgba(239,68,68,0.15)');
        g.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px,py,50,0,Math.PI*2);
        ctx.fill();
      });
    }

    // Secondary roads
    const secondaryRoads = [
      [[0.20,0.30],[0.50,0.44],[0.80,0.35]],
      [[0.25,0.65],[0.50,0.44],[0.72,0.30]],
      [[0.38,0.19],[0.38,0.68]],
      [[0.20,0.48],[0.78,0.48]],
      [[0.60,0.26],[0.60,0.65]],
    ];
    if (STATE.showRoutes) {
      secondaryRoads.forEach(road => {
        ctx.beginPath();
        ctx.moveTo(...this.px(road[0][0], road[0][1]));
        road.slice(1).forEach(pt => ctx.lineTo(...this.px(pt[0], pt[1])));
        ctx.strokeStyle = isDay ? 'rgba(0,0,0,0.12)' : 'rgba(0,212,255,0.12)';
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }

    // Main scanned route
    if (STATE.showRoutes && this.route.length > 1) {
      const totalPts = this.route.length;
      const scannedCount = Math.floor(this.scanProgress * totalPts);

      // Full route (faint)
      ctx.beginPath();
      ctx.moveTo(...this.px(this.route[0][0], this.route[0][1]));
      this.route.slice(1).forEach(pt => ctx.lineTo(...this.px(pt[0], pt[1])));
      ctx.strokeStyle = isDay ? 'rgba(0,0,0,0.08)' : 'rgba(0,212,255,0.08)';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Scanned portion (glowing cyan)
      if (scannedCount > 1) {
        const grad = ctx.createLinearGradient(
          ...this.px(this.route[0][0], this.route[0][1]),
          ...this.px(this.route[Math.min(scannedCount,totalPts-1)][0], this.route[Math.min(scannedCount,totalPts-1)][1])
        );
        grad.addColorStop(0, isDay ? 'rgba(255,90,31,0.2)' : 'rgba(0,212,255,0.15)');
        grad.addColorStop(1, isDay ? 'rgba(255,90,31,0.7)' : 'rgba(0,212,255,0.7)');

        ctx.beginPath();
        ctx.moveTo(...this.px(this.route[0][0], this.route[0][1]));
        for (let i=1; i<scannedCount && i<this.route.length; i++) {
          ctx.lineTo(...this.px(this.route[i][0], this.route[i][1]));
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Glow
        ctx.beginPath();
        ctx.moveTo(...this.px(this.route[0][0], this.route[0][1]));
        for (let i=1; i<scannedCount && i<this.route.length; i++) {
          ctx.lineTo(...this.px(this.route[i][0], this.route[i][1]));
        }
        ctx.strokeStyle = isDay ? 'rgba(255,90,31,0.2)' : 'rgba(0,212,255,0.2)';
        ctx.lineWidth = 12;
        ctx.stroke();
      }
    }

    // Zone boundaries
    if (STATE.showZones) {
      ctx.strokeStyle = 'rgba(168,85,247,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(W*0.15, H*0.15, W*0.35, H*0.4);
      ctx.strokeRect(W*0.52, H*0.25, W*0.3,  H*0.45);
      ctx.setLineDash([]);
    }

    // Road labels
    this.labels.forEach(l => {
      const [lx,ly] = this.px(l.x, l.y);
      ctx.font = `9px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isDay ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.15)';
      ctx.fillText(l.text, lx, ly);
    });

    // Detection markers
    if (STATE.showDetections) {
      this.detectionMarkers.filter(m=>m.visible).forEach((m,i) => {
        const [mx,my] = this.px(m.x, m.y);
        const r = 6 + Math.sin(m.pulse) * 2;
        const alpha = 0.3 + Math.sin(m.pulse) * 0.15;

        // Pulse ring
        ctx.beginPath();
        ctx.arc(mx,my, r + 4, 0, Math.PI*2);
        ctx.strokeStyle = m.color + Math.round(alpha*255).toString(16).padStart(2,'0');
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(mx,my, r, 0, Math.PI*2);
        ctx.fillStyle = m.color + '33';
        ctx.fill();
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Number label
        ctx.beginPath();
        ctx.arc(mx,my, 8, 0, Math.PI*2);
        ctx.fillStyle = m.color;
        ctx.fill();
        ctx.font = `bold 7px 'JetBrains Mono', monospace`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i+1, mx, my);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      });
    }

    // Active vehicle
    const r1 = this.route[this.vehiclePosIdx];
    const r2 = this.route[(this.vehiclePosIdx+1) % this.route.length];
    const vx = r1[0] + (r2[0]-r1[0]) * this.vehicleLerp;
    const vy = r1[1] + (r2[1]-r1[1]) * this.vehicleLerp;
    const [px, py] = this.px(vx, vy);

    // Vehicle ping
    const pingR = 16 + Math.sin(Date.now()/500)*6;
    ctx.beginPath();
    ctx.arc(px, py, pingR, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(239,68,68,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vehicle dot
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI*2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vehicle label
    ctx.fillStyle = '#EF4444';
    ctx.font = `bold 8px 'JetBrains Mono', monospace`;
    const label = 'FLEET-042';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(px - tw/2 - 6, py + 11, tw + 12, 14, 3);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(label, px - tw/2, py + 21);
  }
};

// ────────────────────────────────────────────────────────
// STREET CANVAS — SIMULATED DASHCAM
// ────────────────────────────────────────────────────────
const STREET = {
  canvas: null,
  ctx: null,
  frame: 0,
  running: false,
  detections: [],
  nextDetection: 80,
  init() {
    this.canvas = document.getElementById('street-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width  = this.canvas.offsetWidth  || 400;
    this.canvas.height = this.canvas.offsetHeight || 220;
    this.drawStatic();
  },
  drawStatic() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0,0,W,H);
    this.drawRoad(ctx, W, H, 0);
    // Overlay message
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Press PLAY DRIVE to start simulation', W/2, H/2);
    ctx.textAlign = 'left';
  },
  drawRoad(ctx, W, H, frame) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0,0,0,H*0.5);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#B8D4E8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H*0.5);

    // Buildings silhouette
    ctx.fillStyle = '#6B8CAD';
    [
      [0,H*0.15,W*0.15,H*0.35],[W*0.15,H*0.08,W*0.08,H*0.42],
      [W*0.78,H*0.12,W*0.12,H*0.38],[W*0.88,H*0.20,W*0.12,H*0.30]
    ].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));

    // Ground/road
    const roadGrad = ctx.createLinearGradient(0,H*0.5,0,H);
    roadGrad.addColorStop(0, '#6B7280');
    roadGrad.addColorStop(1, '#4B5563');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, H*0.5, W, H*0.5);

    // Road lines (animated)
    const lineOffset = (frame * 3) % 40;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.setLineDash([20,20]);
    ctx.lineDashOffset = -lineOffset;
    ctx.beginPath();
    ctx.moveTo(W/2, H*0.5);
    ctx.lineTo(W/2 + (W/2)*(1-H*0.5/H) * 0.3, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W/2, H*0.5);
    ctx.lineTo(W/2 - (W/2)*(1-H*0.5/H) * 0.3, H);
    ctx.stroke();

    // Lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([15,25]);
    ctx.lineDashOffset = -lineOffset*0.7;
    ctx.beginPath(); ctx.moveTo(W*0.35,H*0.55); ctx.lineTo(W*0.2,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.65,H*0.55); ctx.lineTo(W*0.8,H); ctx.stroke();
    ctx.setLineDash([]);

    // Vehicles ahead
    const t = frame * 0.8;
    [[W*0.38, H*0.52, W*0.12, H*0.08, '#DC2626'],
     [W*0.55, H*0.53, W*0.10, H*0.07, '#1D4ED8']].forEach(([x,y,w,h,col]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(x - Math.sin(t*0.02)*3, y + Math.sin(t*0.015+1)*2, w, h, 3);
      ctx.fill();
      // Windshield
      ctx.fillStyle = 'rgba(147,197,253,0.5)';
      ctx.fillRect(x + w*0.1 - Math.sin(t*0.02)*3, y + h*0.1 + Math.sin(t*0.015+1)*2, w*0.8, h*0.35);
    });

    // Taillights flicker
    ctx.fillStyle = `rgba(239,68,68,${0.6+Math.sin(t*0.3)*0.3})`;
    ctx.beginPath(); ctx.arc(W*0.38 + 4, H*0.52+2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.38 + W*0.12 - 4, H*0.52+2, 3, 0, Math.PI*2); ctx.fill();

    // Trees
    [[W*0.08,H*0.42],[W*0.88,H*0.43],[W*0.04,H*0.46],[W*0.93,H*0.45]].forEach(([x,y]) => {
      ctx.fillStyle = '#166534';
      ctx.beginPath(); ctx.arc(x,y,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#15803D';
      ctx.beginPath(); ctx.arc(x,y-5,10,0,Math.PI*2); ctx.fill();
    });

    // Scan line overlay
    ctx.strokeStyle = `rgba(0,212,255,${0.1+Math.sin(frame*0.1)*0.05})`;
    ctx.lineWidth = 1;
    for (let y=0; y<H; y+=8) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // Corner markers (edge-camera style)
    const cornerLen = 14;
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    [[0,0],[W,0],[0,H],[W,H]].forEach(([cx,cy]) => {
      const sx = cx === 0 ? 1 : -1;
      const sy = cy === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + sx*4, cy + sy*4 + sy*cornerLen);
      ctx.lineTo(cx + sx*4, cy + sy*4);
      ctx.lineTo(cx + sx*4 + sx*cornerLen, cy + sy*4);
      ctx.stroke();
    });
  },
  addDetectionBox(type, conf) {
    const boxes = [
      { x:0.28, y:0.52, w:0.18, h:0.28 },
      { x:0.55, y:0.58, w:0.15, h:0.22 },
      { x:0.40, y:0.62, w:0.20, h:0.25 },
    ];
    const b = boxes[this.detections.length % boxes.length];
    this.detections.push({ ...b, type, conf, life: 80 });
    STATE.detectionCount++;
    const hud = document.getElementById('hud-conf');
    if (hud) hud.textContent = `${type.toUpperCase()} · ${conf}%`;
    const countEl = document.getElementById('hud-det-count');
    if (countEl) countEl.textContent = `${STATE.detectionCount} DETECTIONS`;
    this.renderDetectionBoxes();
  },
  renderDetectionBoxes() {
    const container = document.getElementById('detection-boxes');
    if (!container) return;
    container.innerHTML = '';
    const frame = this.canvas;
    this.detections.forEach(d => {
      const box = document.createElement('div');
      box.className = 'det-box';
      box.style.left   = (d.x * 100) + '%';
      box.style.top    = (d.y * 100) + '%';
      box.style.width  = (d.w * 100) + '%';
      box.style.height = (d.h * 100) + '%';
      box.style.borderColor = '#FF5A1F';
      const lbl = document.createElement('div');
      lbl.className = 'det-box-label';
      lbl.textContent = `${d.type} ${d.conf}%`;
      box.appendChild(lbl);
      container.appendChild(box);
    });
  },
  resize() {
    const ow = this.canvas.offsetWidth  || 400;
    const oh = this.canvas.offsetHeight || 220;
    if (this.canvas.width !== ow || this.canvas.height !== oh) {
      this.canvas.width  = ow;
      this.canvas.height = oh;
    }
  },
  animate() {
    if (!this.running) return;
    this.frame++;
    this.resize();
    const ctx = this.ctx;
    this.drawRoad(ctx, this.canvas.width, this.canvas.height, this.frame);

    // Decay detections
    this.detections = this.detections.filter(d => { d.life--; return d.life > 0; });
    if (this.detections.length < 3 && this.frame > this.nextDetection) {
      const types = ['Pothole','Road crack','Missing sign','Damaged curb'];
      const type = types[Math.floor(Math.random()*types.length)];
      this.addDetectionBox(type, 80 + Math.floor(Math.random()*18));
      this.nextDetection = this.frame + 60 + Math.floor(Math.random()*80);
      // Sync alert count
      STATE.alertCount++;
      const el = document.getElementById('m-detections');
      if (el) el.textContent = STATE.alertCount;
      const badge = document.getElementById('alert-badge');
      if (badge) badge.textContent = parseInt(badge.textContent||'0') + 1;
      // Live-inject to table
      injectLiveAlert(type);
    }

    // Update camera time
    const camTime = document.getElementById('cam-time');
    if (camTime) {
      const now = new Date();
      camTime.textContent = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }

    STATE.streetAnimFrame = requestAnimationFrame(() => this.animate());
  }
};

// ────────────────────────────────────────────────────────
// ALERT TABLE
// ────────────────────────────────────────────────────────
function renderAlerts(filter='all', limit=5) {
  const tbody = document.getElementById('alerts-tbody');
  if (!tbody) return;
  const filtered = filter==='all' ? PUNE_ALERTS : PUNE_ALERTS.filter(a=>a.type.toLowerCase()===filter);
  const shown = filtered.slice(0, limit);
  tbody.innerHTML = shown.map(a => `
    <tr class="alert-row" id="row-${a.id}">
      <td>
        <div class="issue-cell">
          <div class="issue-type-dot" style="color:${a.color};background:${a.color}22;border-color:${a.color}"></div>
          <div class="issue-info">
            <div class="issue-name">${a.type}</div>
            <div class="issue-id">${a.id}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="location-cell">
          <svg viewBox="0 0 12 14" fill="none"><path d="M6 1a4 4 0 00-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 00-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" opacity="0.5"/></svg>
          ${a.location}
        </div>
      </td>
      <td><div class="detected-cell">${a.detected}</div></td>
      <td><div class="size-cell">${a.size}</div></td>
      <td><span class="severity-badge sev-${a.severity.toLowerCase()}">${a.severity}</span></td>
      <td>
        <button class="dispatch-btn" onclick="openDispatch('${a.id}')" title="Dispatch work order">
          <svg viewBox="0 0 14 14" fill="none"><path d="M2 12L12 2M7 2h5v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  const label = document.getElementById('alerts-count-label');
  if (label) label.textContent = `Showing ${shown.length} of ${STATE.alertCount} detections`;
}

function filterAlerts() {
  const filter = document.getElementById('alert-filter')?.value || 'all';
  STATE.currentFilter = filter;
  STATE.loadedAlerts = 5;
  renderAlerts(filter, 5);
}

function loadMoreAlerts() {
  STATE.loadedAlerts += 5;
  if (STATE.loadedAlerts > PUNE_ALERTS.length) STATE.loadedAlerts = PUNE_ALERTS.length;
  renderAlerts(STATE.currentFilter, STATE.loadedAlerts);
}

function injectLiveAlert(type) {
  const locs = [
    'JM Road / Shivajinagar','Baner–Aundh Loop','Paud Road / Kothrud',
    'Wakad / Hinjawadi','Viman Nagar / Nagar Road','Dhole Patil Rd'
  ];
  const severities = ['HIGH','MEDIUM','LOW'];
  const colors = { 'HIGH':'#EF4444','MEDIUM':'#F59E0B','LOW':'#22D3A0' };
  const sev = severities[Math.floor(Math.random()*3)];
  const newAlert = {
    id:`SP-${1700 + Math.floor(Math.random()*100)}`,
    type, severity: sev, color: colors[sev],
    location: locs[Math.floor(Math.random()*locs.length)],
    detected:'just now', size:'–',
    coords:[0.3+Math.random()*0.4, 0.3+Math.random()*0.4]
  };
  PUNE_ALERTS.unshift(newAlert);
  if (STATE.page==='mission') renderAlerts(STATE.currentFilter, STATE.loadedAlerts);
  addNotification(`New ${type} detected`, newAlert.location, sev.toLowerCase());
}

// ────────────────────────────────────────────────────────
// FLEET PAGE
// ────────────────────────────────────────────────────────
function renderFleet() {
  const grid = document.getElementById('fleet-grid');
  if (!grid) return;
  grid.innerHTML = FLEET_DATA.map(f => `
    <div class="fleet-card">
      <div class="fc-header">
        <div class="fc-id">${f.id}</div>
        <div class="fc-status ${f.status}">${f.status.toUpperCase()}</div>
      </div>
      <div class="fc-route">${f.route}</div>
      <div class="fc-stats">
        <div class="fc-stat-item"><div class="fc-stat-label">ZONE</div><div class="fc-stat-val">${f.zone}</div></div>
        <div class="fc-stat-item"><div class="fc-stat-label">DETECTIONS</div><div class="fc-stat-val">${f.detections}</div></div>
        <div class="fc-stat-item"><div class="fc-stat-label">BATTERY</div><div class="fc-stat-val">${f.battery}</div></div>
      </div>
      <div class="fc-progress">
        <div class="fc-prog-label">
          <span>Route progress</span>
          <span>${f.progress}%</span>
        </div>
        <div class="fc-prog-bar">
          <div class="fc-prog-fill" style="width:${f.progress}%"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ────────────────────────────────────────────────────────
// INTELLIGENCE PAGE
// ────────────────────────────────────────────────────────
function renderIntel() {
  const grid = document.getElementById('intel-grid');
  if (!grid) return;
  grid.innerHTML = INTEL_CHARTS.map(chart => `
    <div class="intel-card">
      <div class="intel-card-title">${chart.title}</div>
      <div class="intel-card-sub">${chart.sub}</div>
      <div class="bar-chart">
        ${chart.bars.map(b => `
          <div class="bar-row">
            <div class="bar-label">${b.label}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${b.val}%;background:${b.color}"></div>
            </div>
            <div class="bar-val">${b.val}%</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Summary cards
  grid.innerHTML += `
    <div class="intel-card">
      <div class="intel-card-title">Predictive Alerts</div>
      <div class="intel-card-sub">AI-projected issues for next 7 days</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          { zone:'Nagar Rd / Mundhwa', pred:'High risk pothole formation', conf:'87%' },
          { zone:'Hadapsar / Magarpatta', pred:'Drain blockage likely (monsoon)', conf:'74%' },
          { zone:'Baner Road', pred:'Road surface degradation', conf:'68%' },
        ].map(p => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:2px">${p.zone}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${p.pred}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--accent-orange);margin-top:4px">Confidence: ${p.conf}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="intel-card">
      <div class="intel-card-title">System Stats</div>
      <div class="intel-card-sub">Edge AI performance this session</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
        ${[
          {label:'Model accuracy',val:'96.2%',color:'var(--accent-green)'},
          {label:'Avg latency',val:'42ms',color:'var(--accent-cyan)'},
          {label:'False positives',val:'3.8%',color:'var(--accent-amber)'},
          {label:'Edge uptime',val:'98.7%',color:'var(--accent-green)'},
          {label:'Frames/sec',val:'18 fps',color:'var(--accent-cyan)'},
          {label:'Data saved',val:'94.7%',color:'var(--accent-purple)'},
        ].map(s => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center">
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:${s.color}">${s.val}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:3px;letter-spacing:0.1em">${s.label.toUpperCase()}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ────────────────────────────────────────────────────────
// PRIORITY ZONES PAGE
// ────────────────────────────────────────────────────────
function renderZones() {
  const grid = document.getElementById('zones-grid');
  if (!grid) return;
  grid.innerHTML = PRIORITY_ZONES.map(z => `
    <div class="zone-card ${z.priority}">
      <div class="zone-header">
        <div class="zone-name">${z.name}</div>
        <div class="zone-priority-badge ${z.priority}">${z.priority.toUpperCase()}</div>
      </div>
      <div class="zone-desc">${z.desc}</div>
      <div class="zone-stats">
        <div class="zone-stat"><div class="zone-stat-val">${z.issues}</div><div class="zone-stat-label">ACTIVE ISSUES</div></div>
        <div class="zone-stat"><div class="zone-stat-val">${z.area}</div><div class="zone-stat-label">ZONE AREA</div></div>
        <div class="zone-stat"><div class="zone-stat-val" style="font-size:12px">${z.lastScanned}</div><div class="zone-stat-label">LAST SCANNED</div></div>
      </div>
    </div>
  `).join('');
}

// ────────────────────────────────────────────────────────
// MINI BARS (SIDEBAR)
// ────────────────────────────────────────────────────────
function renderMiniBars() {
  const container = document.getElementById('mini-bars');
  if (!container) return;
  container.innerHTML = '';
  const maxH = 20;
  STATE.miniBarsData.forEach(v => {
    const bar = document.createElement('div');
    bar.className = 'mini-bar';
    bar.style.height = Math.round(v/100 * maxH) + 'px';
    container.appendChild(bar);
  });
}

function updateMiniBars() {
  STATE.miniBarsData.shift();
  STATE.miniBarsData.push(80 + Math.random()*20);
  renderMiniBars();
}

// ────────────────────────────────────────────────────────
// CLOCK & COUNTERS
// ────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const clock = document.getElementById('sidebar-clock');
  if (clock) clock.textContent = `${hh}:${mm}:${ss}`;
  const heroTime = document.getElementById('hero-time');
  if (heroTime) {
    const h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    heroTime.textContent = `${String(h12).padStart(2,'0')}:${mm} ${ampm}`;
  }
}

function updateSync() {
  STATE.syncSeconds++;
  if (STATE.syncSeconds > 30) STATE.syncSeconds = 2;
  const el = document.getElementById('sync-counter');
  if (el) el.textContent = `${STATE.syncSeconds} sec ago`;
  // Jitter latency
  const lat = document.getElementById('latency-val');
  if (lat) lat.textContent = (38 + Math.floor(Math.random()*12)) + ' ms';
}

function animateMetrics() {
  // Subtly fluctuate detection count
  const base = 247;
  const det = base + Math.floor(STATE.alertCount - 247);
  const el = document.getElementById('m-detections');
  if (el) el.textContent = det;
  // Coverage fluctuation
  const cov = document.getElementById('m-coverage');
  if (cov) {
    const v = 68 + Math.round(Math.sin(Date.now()/8000)*2);
    cov.innerHTML = `${v}<span class="metric-unit">%</span>`;
  }
}

// ────────────────────────────────────────────────────────
// PAGE NAVIGATION
// ────────────────────────────────────────────────────────
const PAGE_CONFIG = {
  mission: { label:'MISSION CONTROL',    navId:'nav-mission' },
  fleet:   { label:'FLEET OVERVIEW',     navId:'nav-fleet'   },
  intel:   { label:'INTELLIGENCE',       navId:'nav-intel'   },
  priority:{ label:'PRIORITY ZONES',     navId:'nav-priority'},
};

function setPage(page) {
  STATE.page = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const cfg = PAGE_CONFIG[page];
  if (cfg) {
    const navEl = document.getElementById(cfg.navId);
    if (navEl) navEl.classList.add('active');
    const breadcrumb = document.getElementById('breadcrumb-page');
    if (breadcrumb) breadcrumb.textContent = cfg.label;
  }
  if (page==='fleet' && !document.getElementById('fleet-grid').children.length) renderFleet();
  if (page==='intel' && !document.getElementById('intel-grid').children.length) renderIntel();
  if (page==='priority' && !document.getElementById('zones-grid').children.length) renderZones();
}

// ────────────────────────────────────────────────────────
// MODE TOGGLE (NIGHT / DAY)
// ────────────────────────────────────────────────────────
function toggleMode() {
  STATE.mode = STATE.mode === 'night' ? 'day' : 'night';
  document.getElementById('app-body').className = STATE.mode;
  const icon  = document.getElementById('mode-icon');
  const label = document.getElementById('mode-label');
  if (STATE.mode === 'day') {
    if (icon)  icon.textContent  = '☀️';
    if (label) label.textContent = 'DAYLIGHT';
  } else {
    if (icon)  icon.textContent  = '🌙';
    if (label) label.textContent = 'NIGHT OPS';
  }
}

// ────────────────────────────────────────────────────────
// MAP CONTROLS
// ────────────────────────────────────────────────────────
function centerMap() {
  MAP.vehiclePosIdx = 0;
  MAP.vehicleLerp = 0;
  showToast('Map centered on FLEET-042');
}

function toggleLayers() {
  STATE.layersOpen = !STATE.layersOpen;
  toggleMapLayers();
}

function toggleMapLayers() {
  const sub = document.getElementById('map-sublayers');
  const chevron = document.getElementById('maplayers-chevron');
  if (!sub) return;
  STATE.layersOpen = !sub.classList.contains('open');
  sub.classList.toggle('open', STATE.layersOpen);
  if (chevron) chevron.classList.toggle('open', STATE.layersOpen);
}

function toggleLayer(layer) {
  const checked = document.getElementById(`layer-${layer}`)?.checked;
  if (layer==='routes')     STATE.showRoutes     = checked;
  if (layer==='detections') STATE.showDetections = checked;
  if (layer==='heatmap')    STATE.showHeatmap    = checked;
  if (layer==='zones')      STATE.showZones      = checked;
}

// ────────────────────────────────────────────────────────
// DRIVE SIMULATION
// ────────────────────────────────────────────────────────
function toggleDrive() {
  STATE.driveRunning = !STATE.driveRunning;
  const btn = document.getElementById('play-drive-btn');
  if (!btn) return;
  if (STATE.driveRunning) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><rect x="5" y="4" width="4" height="16" fill="currentColor"/><rect x="15" y="4" width="4" height="16" fill="currentColor"/></svg> PAUSE`;
    STREET.running = true;
    STATE.detectionCount = 0;
    STREET.detections = [];
    STREET.frame = 0;
    STREET.nextDetection = 80;
    STREET.animate();
    showToast('Drive simulation started — Baner–Aundh Loop / JM Road');
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg> PLAY DRIVE`;
    STREET.running = false;
    if (STATE.streetAnimFrame) { cancelAnimationFrame(STATE.streetAnimFrame); STATE.streetAnimFrame = null; }
  }
}

// ────────────────────────────────────────────────────────
// DISPATCH MODAL
// ────────────────────────────────────────────────────────
function openDispatch(alertId) {
  const alert = PUNE_ALERTS.find(a=>a.id===alertId);
  if (!alert) return;
  STATE.currentDispatchAlert = alert;
  const body = document.getElementById('dispatch-body');
  if (!body) return;
  body.innerHTML = `
    <div class="modal-alert-info">
      <div class="mai-label">ISSUE</div>
      <div class="mai-val">${alert.type} — ${alert.id}</div>
      <div class="mai-label" style="margin-top:6px">LOCATION</div>
      <div class="mai-val" style="font-size:12px;font-weight:400;color:var(--text-secondary)">${alert.location}</div>
    </div>
    <div class="modal-field">
      <label>ASSIGNED TEAM</label>
      <select id="dispatch-team">
        <option>PMC Road Works · Unit 4</option>
        <option>PMC Road Works · Unit 7</option>
        <option>PMC Sanitation · Unit 2</option>
        <option>Traffic Safety · Unit 1</option>
        <option>Emergency Repairs · Unit 9</option>
      </select>
    </div>
    <div class="modal-field">
      <label>PRIORITY</label>
      <select id="dispatch-priority">
        <option value="urgent" ${alert.severity==='HIGH'?'selected':''}>Urgent (same day)</option>
        <option value="high"   ${alert.severity==='MEDIUM'?'selected':''}>High (48 hrs)</option>
        <option value="normal" ${alert.severity==='LOW'?'selected':''}>Normal (7 days)</option>
      </select>
    </div>
    <div class="modal-field">
      <label>DUE DATE</label>
      <input type="date" id="dispatch-due" value="${new Date(Date.now()+86400000).toISOString().split('T')[0]}">
    </div>
    <div class="modal-field">
      <label>NOTES</label>
      <textarea id="dispatch-notes" placeholder="Additional details for the crew...">${alert.type} detected at ${alert.location}. Size: ${alert.size}. Severity: ${alert.severity}.</textarea>
    </div>
  `;
  document.getElementById('dispatch-modal').classList.remove('hidden');
}

function closeDispatch() { document.getElementById('dispatch-modal').classList.add('hidden'); }

function confirmDispatch() {
  const team = document.getElementById('dispatch-team')?.value || 'PMC Road Works';
  closeDispatch();
  showToast(`✅ Work order dispatched to ${team}`, 4000);
  addNotification('Work order dispatched', `${STATE.currentDispatchAlert?.type} → ${team}`, 'success');
}

// ────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────
const NOTIFICATIONS = [];

function addNotification(title, sub, type='info') {
  NOTIFICATIONS.unshift({ title, sub, type, time: new Date() });
  if (NOTIFICATIONS.length > 20) NOTIFICATIONS.pop();
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = 'block';
}

function showNotifications() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  closeHelp();
  panel.classList.toggle('hidden');
  renderNotifications();
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = 'none';
}

function closeNotifications() { document.getElementById('notif-panel')?.classList.add('hidden'); }

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  const colors = { high:'#EF4444', medium:'#F59E0B', low:'#22D3A0', info:'#00D4FF', success:'#22D3A0' };
  list.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item">
      <div class="notif-item-dot" style="background:${colors[n.type]||'#00D4FF'}"></div>
      <div class="notif-item-text">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-sub">${n.sub}</div>
      </div>
    </div>
  `).join('') || '<div style="padding:20px;color:var(--text-muted);font-size:12px;text-align:center">No notifications</div>';
}

function showHelp() {
  const panel = document.getElementById('help-panel');
  if (!panel) return;
  closeNotifications();
  panel.classList.toggle('hidden');
}
function closeHelp() { document.getElementById('help-panel')?.classList.add('hidden'); }

// ────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, duration=2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), duration);
}

// ────────────────────────────────────────────────────────
// SETTINGS
// ────────────────────────────────────────────────────────
function openSettings() {
  showToast('Network settings: Edge latency 42ms · PI 04 / CORAL · Baner Node Active');
}

// ────────────────────────────────────────────────────────
// EXPORT
// ────────────────────────────────────────────────────────
function exportAlerts() {
  const data = {
    exportedAt: new Date().toISOString(),
    city: 'Pune, Maharashtra, India',
    mission: 'PM-042',
    totalDetections: STATE.alertCount,
    alerts: PUNE_ALERTS.map(a => ({
      id: a.id,
      type: a.type,
      location: a.location,
      detected: a.detected,
      size: a.size,
      severity: a.severity,
      coordinates: { lat: 18.5 + a.coords[1]*0.1, lng: 73.8 + a.coords[0]*0.1 }
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `streetpulse_pune_alerts_${Date.now()}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('📄 Report exported as JSON');
}

// ────────────────────────────────────────────────────────
// VEHICLE TELEMETRY UPDATES
// ────────────────────────────────────────────────────────
function updateVehicleTelemetry() {
  const stops = document.getElementById('stops-remaining');
  if (stops) {
    const remaining = Math.max(1, 6 - Math.floor(MAP.scanProgress * 6));
    stops.textContent = `${remaining} stop${remaining===1?'':'s'} remaining`;
  }
  const battery = document.getElementById('battery-pct');
  if (battery) {
    const pct = Math.max(70, 84 - Math.floor(MAP.scanProgress * 8));
    battery.textContent = `🔋 ${pct}%`;
  }
}

// ────────────────────────────────────────────────────────
// INIT & MAIN LOOP
// ────────────────────────────────────────────────────────
function init() {
  // Initial notifications
  addNotification('Pune network online', 'All 12 edge nodes active', 'info');
  addNotification('New HIGH alert', 'Pothole at Baner Road / Balewadi', 'high');
  addNotification('Fleet-042 started route', 'Baner–Aundh Loop / P-17', 'info');

  // Render initial data
  renderAlerts('all', 5);
  renderMiniBars();

  // Map
  MAP.init();

  // Street view
  STREET.init();

  // Clock interval
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(updateSync, 3000);
  setInterval(animateMetrics, 5000);
  setInterval(updateMiniBars, 2500);
  setInterval(updateVehicleTelemetry, 4000);

  // Periodically add notifications
  setInterval(() => {
    const types = ['Pothole','Road crack','Blocked drain','Missing sign'];
    const locs  = ['Nagar Rd','FC Road','Karve Rd','Paud Rd','Tilak Rd'];
    const sev   = ['high','medium','low'];
    addNotification(
      `New ${types[Math.floor(Math.random()*types.length)]} detected`,
      locs[Math.floor(Math.random()*locs.length)],
      sev[Math.floor(Math.random()*sev.length)]
    );
  }, 20000);
}

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
