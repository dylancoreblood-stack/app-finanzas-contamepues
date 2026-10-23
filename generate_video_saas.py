import json
import os

with open('/Users/DylanRamirez/Downloads/Gemini Dylan/App finanzas contamepues/assets/assets_b64.json') as f:
    assets = json.load(f)

logo_b64 = assets['logo']
icon_b64 = assets['icon']

html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finanzas Contame Pues - Video Promocional SaaS (48s)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --brand-amber: #F6AC13;
      --brand-yellow: #FFD64F;
      --brand-amber-dark: #D97706;
      --brand-navy: #1B2432;
      --brand-navy-dark: #121822;
      --brand-red: #ED3432;
      --green: #10B981;
      --bg: #090D14;
      --card-bg: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.1);
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --font: "Plus Jakarta Sans", "Ubuntu", -apple-system, sans-serif;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      user-select: none;
      overflow-x: hidden;
    }}
    .container {{
      max-width: 1080px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }}
    .header-bar {{
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }}
    .brand-title {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .brand-title h1 {{
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #FFFFFF 40%, #F6AC13 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .brand-tag {{
      background: rgba(246, 172, 19, 0.15);
      border: 1px solid var(--brand-amber);
      color: var(--brand-amber);
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 999px;
    }}
    .aspect-selector {{
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 3px;
      gap: 4px;
    }}
    .aspect-btn {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .aspect-btn.active {{
      background: var(--brand-amber);
      color: #121822;
      font-weight: 900;
    }}
    .viewport-wrapper {{
      position: relative;
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: aspect-ratio 0.3s ease, max-width 0.3s ease;
    }}
    .viewport-wrapper.vertical {{
      max-width: 480px;
      aspect-ratio: 9 / 16;
    }}
    .viewport-wrapper.square {{
      max-width: 680px;
      aspect-ratio: 1 / 1;
    }}
    canvas {{
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }}
    .controls-panel {{
      width: 100%;
      max-width: 960px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      backdrop-filter: blur(16px);
    }}
    .timeline-row {{
      display: flex;
      align-items: center;
      gap: 1rem;
    }}
    .timeline-track {{
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
      cursor: pointer;
    }}
    .timeline-progress {{
      height: 100%;
      background: linear-gradient(90deg, var(--brand-amber) 0%, var(--brand-yellow) 100%);
      border-radius: 4px;
      width: 0%;
      position: relative;
    }}
    .timeline-handle {{
      position: absolute;
      right: -6px;
      top: -4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #FFFFFF;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }}
    .time-badge {{
      font-variant-numeric: tabular-nums;
      font-size: 0.825rem;
      color: #94A3B8;
      font-weight: 700;
      min-width: 115px;
      text-align: right;
    }}
    .buttons-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .btn-group {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    button.ctl-btn {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #F8FAFC;
      padding: 7px 16px;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }}
    button.ctl-btn:hover {{
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }}
    button.ctl-btn.primary {{
      background: var(--brand-amber);
      color: #121822;
      border-color: var(--brand-amber);
      font-weight: 900;
      box-shadow: 0 4px 14px rgba(246, 172, 19, 0.35);
    }}
    button.ctl-btn.record {{
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: #FFFFFF;
      border-color: #F87171;
      font-weight: 900;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
    }}
    button.ctl-btn.record.recording {{
      background: #475569;
      border-color: #64748B;
      animation: pulse 1s infinite alternate;
    }}
    @keyframes pulse {{
      from {{ opacity: 0.7; }}
      to {{ opacity: 1.0; }}
    }}
    .scene-indicator {{
      font-size: 0.8rem;
      color: #CBD5E1;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .scene-indicator span {{
      color: var(--brand-amber);
      font-weight: 800;
    }}
  </style>
</head>
<body>

  <div class="container">
    <div class="header-bar">
      <div class="brand-title">
        <span style="font-size: 24px;">🎬</span>
        <h1>Finanzas Contame Pues · Video Promocional SaaS</h1>
        <span class="brand-tag">48 Segundos · 120 BPM</span>
      </div>

      <div class="aspect-selector">
        <button class="aspect-btn active" onclick="setAspect('16:9')">16:9 Web / YouTube</button>
        <button class="aspect-btn" onclick="setAspect('9:16')">9:16 Reels / TikTok</button>
        <button class="aspect-btn" onclick="setAspect('1:1')">1:1 Cuadrado</button>
      </div>
    </div>

    <!-- Video Canvas Viewport -->
    <div class="viewport-wrapper" id="viewportWrapper">
      <canvas id="saasCanvas" width="1920" height="1080"></canvas>
    </div>

    <!-- Control Bar -->
    <div class="controls-panel">
      <div class="timeline-row">
        <div class="timeline-track" id="timelineTrack">
          <div class="timeline-progress" id="timelineProgress">
            <div class="timeline-handle"></div>
          </div>
        </div>
        <div class="time-badge" id="timeBadge">0.00s / 48.00s</div>
      </div>

      <div class="buttons-row">
        <div class="btn-group">
          <button class="ctl-btn primary" id="playBtn" onclick="togglePlay()">
            <span id="playIcon">⏸</span> <span id="playLabel">Pausar</span>
          </button>
          <button class="ctl-btn" onclick="restartVideo()">
            <span>↺</span> Reiniciar
          </button>
          <button class="ctl-btn" id="audioBtn" onclick="toggleAudio()">
            <span id="audioIcon">🔊</span> Audio ON
          </button>
          <button class="ctl-btn" id="speedBtn" onclick="cycleSpeed()">
            <span id="speedLabel">1.0x</span>
          </button>
        </div>

        <div class="scene-indicator">
          Escena: <span id="sceneTitle">1. El Caos Financiero</span>
        </div>

        <div class="btn-group">
          <button class="ctl-btn record" id="recordBtn" onclick="toggleRecord()">
            <span>⏺</span> <span id="recordLabel">Descargar Video HD (WebM/MP4)</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // --- Brand Assets ---
    const LOGO_DATA = "{logo_b64}";
    const ICON_DATA = "{icon_b64}";

    const logoImg = new Image();
    logoImg.src = LOGO_DATA;
    let logoLoaded = false;
    logoImg.onload = () => {{ logoLoaded = true; }};

    const iconImg = new Image();
    iconImg.src = ICON_DATA;
    let iconLoaded = false;
    iconImg.onload = () => {{ iconLoaded = true; }};

    // --- Analytical Springs ---
    function spring(t, t0, from, to, omega = 18, zeta = 0.82) {{
      if (t <= t0) return from;
      const dt = t - t0;
      const delta = to - from;
      if (zeta >= 1.0) {{
        const decay = Math.exp(-omega * dt);
        return to - delta * decay * (1 + omega * dt);
      }}
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      const decay = Math.exp(-zeta * omega * dt);
      const envelope = Math.cos(omegaD * dt) + ((zeta * omega) / omegaD) * Math.sin(omegaD * dt);
      return to - delta * decay * envelope;
    }}

    function clamp(val, min, max) {{
      return Math.max(min, Math.min(max, val));
    }}

    function lerp(a, b, t) {{
      return a + (b - a) * t;
    }}

    function formatCOP(num) {{
      return '$ ' + Math.round(num).toString().replace(/\\B(?=(\\d{{3}})+(?!\\d))/g, '.');
    }}

    // --- Audio Engine (Web Audio API) ---
    class ProceduralAudioEngine {{
      constructor() {{
        this.ctx = null;
        this.dest = null;
        this.muted = false;
        this.lastBeat = -1;
      }}
      init() {{
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.dest = this.ctx.createMediaStreamDestination();
      }}
      playKick(freq = 60) {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(15, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.dest) gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.22);
      }}
      playHat() {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {{
          data[i] = Math.random() * 2 - 1;
        }}
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.dest) gain.connect(this.dest);
        noise.start(now);
      }}
      playClick() {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.dest) gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.04);
      }}
      playChime() {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        [1046.5, 1318.5, 1567.98].forEach((f, idx) => {{
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);
          gain.gain.setValueAtTime(0.14, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.65);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          if (this.dest) gain.connect(this.dest);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.7);
        }});
      }}
      playWhoosh() {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.dest) gain.connect(this.dest);
        osc.start(now);
        osc.stop(now + 0.32);
      }}
      playChord(freqs) {{
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        freqs.forEach(f => {{
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.035, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          if (this.dest) gain.connect(this.dest);
          osc.start(now);
          osc.stop(now + 1.85);
        }});
      }}
      onBeat(beat, t) {{
        if (beat === this.lastBeat) return;
        this.lastBeat = beat;
        // Rhythm Grid
        if (beat % 4 === 0) {{
          this.playKick();
        }}
        if (beat % 2 === 1) {{
          this.playHat();
        }}
        // Chords per section
        if (beat % 8 === 0) {{
          if (t < 7.0) this.playChord([220, 261.6, 329.6]); // Am
          else if (t < 14.0) this.playChord([261.6, 329.6, 392.0, 523.2]); // C Maj
          else if (t < 22.0) this.playChord([349.2, 440, 523.2]); // F Maj
          else if (t < 30.0) this.playChord([392.0, 493.8, 587.3]); // G Maj
          else if (t < 38.0) this.playChord([261.6, 329.6, 392.0]); // C Maj
          else if (t < 44.0) this.playChord([349.2, 440, 523.2, 659.2]); // Fmaj7
          else this.playChord([523.2, 659.2, 783.9, 1046.5]); // C Maj octave
        }}
        // Special cues
        if (Math.abs(t - 16.5) < 0.25) this.playChime();
        if (Math.abs(t - 24.5) < 0.25) this.playClick();
        if (Math.abs(t - 28.0) < 0.25) this.playWhoosh();
        if (Math.abs(t - 40.5) < 0.25) this.playClick();
      }}
    }}

    const audioEngine = new ProceduralAudioEngine();

    // --- Video Engine Core ---
    const canvas = document.getElementById('saasCanvas');
    const ctx = canvas.getContext('2d');
    const DURATION = 48.0;
    const BPM = 120;
    const BEAT = 60 / BPM; // 0.5s

    let isPlaying = true;
    let playbackSpeed = 1.0;
    let currentTime = 0;
    let lastPerf = performance.now();
    let currentAspect = '16:9';
    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];

    let CW = 1920;
    let CH = 1080;

    function setAspect(aspect) {{
      currentAspect = aspect;
      document.querySelectorAll('.aspect-btn').forEach(btn => {{
        btn.classList.toggle('active', btn.textContent.includes(aspect));
      }});
      const wrapper = document.getElementById('viewportWrapper');
      wrapper.classList.remove('vertical', 'square');
      if (aspect === '9:16') {{
        wrapper.classList.add('vertical');
        CW = 1080;
        CH = 1920;
      }} else if (aspect === '1:1') {{
        wrapper.classList.add('square');
        CW = 1080;
        CH = 1080;
      }} else {{
        CW = 1920;
        CH = 1080;
      }}
      canvas.width = CW;
      canvas.height = CH;
      draw(currentTime);
    }}

    // --- Main Pure draw(t) Function ---
    function draw(t) {{
      const beat = Math.floor(t / BEAT);
      audioEngine.onBeat(beat, t);

      // Clear Canvas
      ctx.clearRect(0, 0, CW, CH);

      // Determine active scene
      let sceneTitle = '1. El Caos Financiero';
      if (t >= 7.0 && t < 14.0) sceneTitle = '2. Finanzas Contame Pues';
      else if (t >= 14.0 && t < 22.0) sceneTitle = '3. El Saldo Real en Mano';
      else if (t >= 22.0 && t < 30.0) sceneTitle = '4. Registro 1-Clic & Notificaciones';
      else if (t >= 30.0 && t < 38.0) sceneTitle = '5. Sobres & Presupuestos SST';
      else if (t >= 38.0 && t < 43.0) sceneTitle = '6. Nube Segura & Asesoría';
      else if (t >= 43.0) sceneTitle = '7. ¡Comienza Hoy!';

      document.getElementById('sceneTitle').textContent = sceneTitle;

      // Base Background Gradient (Premium Slate Navy with Golden Amber mesh)
      const bgGrad = ctx.createRadialGradient(CW / 2, CH / 2, 80, CW / 2, CH / 2, Math.max(CW, CH) * 0.8);
      bgGrad.addColorStop(0, '#1E2838');
      bgGrad.addColorStop(0.5, '#141C28');
      bgGrad.addColorStop(1, '#0C111A');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CW, CH);

      // Ambient Golden Harmonic Mesh Glow
      const glowAlpha = 0.12 + Math.sin(t * 1.5) * 0.04;
      const glowGrad = ctx.createRadialGradient(CW * 0.5, CH * 0.35, 10, CW * 0.5, CH * 0.35, CW * 0.55);
      glowGrad.addColorStop(0, `rgba(246, 172, 19, ${{glowAlpha * 1.5}})`);
      glowGrad.addColorStop(0.6, `rgba(246, 172, 19, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, CW, CH);

      // Subtle Grid Dots Pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const step = CW > 1200 ? 60 : 45;
      for (let x = step / 2; x < CW; x += step) {{
        for (let y = step / 2; y < CH; y += step) {{
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }}
      }}

      // ========================================================
      // SCENE 1 (0.0s - 7.0s): The Chaos of Everyday Finances
      // ========================================================
      if (t < 7.5) {{
        const s1Alpha = t < 6.0 ? spring(t, 0.0, 0.0, 1.0, 14, 0.85) : spring(t, 6.0, 1.0, 0.0, 18, 0.85);
        ctx.save();
        ctx.globalAlpha = clamp(s1Alpha, 0, 1);

        // Header Question
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${{CW > 1200 ? 52 : 36}}px "Plus Jakarta Sans"`;
        ctx.textAlign = 'center';
        ctx.fillText('¿SABES CUÁNTO DINERO TIENES', CW / 2, CH * 0.22);
        
        ctx.fillStyle = '#F6AC13';
        ctx.fillText('REALMENTE DISPONIBLE HOY?', CW / 2, CH * 0.22 + (CW > 1200 ? 64 : 46));

        ctx.fillStyle = '#94A3B8';
        ctx.font = `500 ${{CW > 1200 ? 22 : 16}}px "Plus Jakarta Sans"`;
        ctx.fillText('El 82% de personas y empresas gastan dinero que ya está comprometido.', CW / 2, CH * 0.22 + (CW > 1200 ? 115 : 85));

        // Floating Chaotic Invoices & Receipts pulling into center at t > 5.0
        const chaosItems = [
          {{ text: 'Factura Arriendo: $1.200.000', rot: -0.15, ox: -360, oy: 60, col: '#ED3432' }},
          {{ text: 'Nequi Desconocido: -$85.000', rot: 0.12, ox: 380, oy: 20, col: '#F6AC13' }},
          {{ text: 'Pago Proveedor: $640.000', rot: -0.08, ox: -280, oy: 220, col: '#ED3432' }},
          {{ text: '¿Cuánto queda libre para mí?', rot: 0.18, ox: 300, oy: 200, col: '#38BDF8' }}
        ];

        const collapseT = clamp((t - 4.8) / 1.5, 0, 1);
        chaosItems.forEach((item, idx) => {{
          const itemApp = spring(t, 0.4 + idx * 0.35, 0, 1, 14, 0.78);
          const px = CW / 2 + item.ox * (1 - collapseT);
          const py = CH * 0.52 + item.oy * (1 - collapseT);
          const sc = lerp(itemApp, 0.0, collapseT);
          const rot = item.rot * (1 - collapseT * 2);

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(rot);
          ctx.scale(sc, sc);

          // Card shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 25;
          ctx.shadowOffsetY = 10;

          // Card Background
          ctx.fillStyle = '#1B2432';
          ctx.strokeStyle = item.col;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-160, -32, 320, 64, 16);
          ctx.fill();
          ctx.stroke();

          // Card Text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 16px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText(item.text, 0, 6);

          ctx.restore();
        }});

        ctx.restore();
      }}

      // ========================================================
      // SCENE 2 - 6: The Contame Pues SaaS Window Frame
      // ========================================================
      if (t >= 6.2 && t <= 44.0) {{
        const winAlpha = t < 7.0 ? spring(t, 6.2, 0, 1, 14, 0.8) : (t > 42.5 ? spring(t, 42.5, 1, 0, 16, 0.85) : 1);
        ctx.save();
        ctx.globalAlpha = clamp(winAlpha, 0, 1);

        // Window Dimensions
        const winW = CW > 1200 ? 1340 : (CW * 0.92);
        const winH = CH > 1200 ? 820 : (CH * 0.82);
        const winX = (CW - winW) / 2;
        const winY = (CH - winH) / 2 + 10;

        // Window Drop Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 24;

        // Window Canvas (Clean Crisp White corporativo Contame Pues)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(winX, winY, winW, winH, 24);
        ctx.fill();

        // 1px Subtle Border
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Window Header Bar
        ctx.save();
        ctx.globalAlpha = clamp(winAlpha, 0, 1);
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(winX, winY, winW, 60, [24, 24, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // macOS Window Control Dots
        ctx.fillStyle = '#FF5F56';
        ctx.beginPath();
        ctx.arc(winX + 24, winY + 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFBD2E';
        ctx.beginPath();
        ctx.arc(winX + 42, winY + 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27C93F';
        ctx.beginPath();
        ctx.arc(winX + 60, winY + 30, 6, 0, Math.PI * 2);
        ctx.fill();

        // Window URL Pill
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(winX + winW / 2 - 140, winY + 16, 280, 28, 999);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.font = '700 12px "Plus Jakarta Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('🔒 finanzas.contamepues.com', winX + winW / 2, winY + 35);

        // App Topbar Inside the Window
        const topbarY = winY + 62;
        // Draw Contame Pues Official Logo
        if (logoLoaded) {{
          ctx.drawImage(logoImg, winX + 24, topbarY + 12, 160, 42);
        }}

        // Navigation Tabs (Resumen, Opciones PRO, Mi Cuenta)
        const activeTabIdx = t < 30.0 ? 0 : (t < 38.0 ? 1 : 2);
        const tabs = ['💳 Resumen', '⚡ Opciones PRO', '👤 Mi Cuenta'];
        let tabX = winX + winW * 0.36;
        tabs.forEach((tab, idx) => {{
          const isAct = idx === activeTabIdx;
          ctx.fillStyle = isAct ? '#F6AC13' : 'transparent';
          ctx.beginPath();
          ctx.roundRect(tabX, topbarY + 16, 120, 32, 999);
          ctx.fill();

          ctx.fillStyle = isAct ? '#1B2432' : '#64748B';
          ctx.font = isAct ? '800 12px "Plus Jakarta Sans"' : '600 12px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText(tab, tabX + 60, topbarY + 37);
          tabX += 130;
        }});

        // Iconic Yellow "Asesoría 💬" WhatsApp button
        const asesoriaX = winX + winW - 140;
        const asesoriaClickScale = (t >= 40.0 && t <= 41.0) ? spring(t, 40.0, 1.0, 0.92, 22, 0.7) : 1.0;
        ctx.save();
        ctx.translate(asesoriaX + 50, topbarY + 32);
        ctx.scale(asesoriaClickScale, asesoriaClickScale);
        ctx.fillStyle = '#FFD64F';
        ctx.strokeStyle = '#F6AC13';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-50, -16, 105, 32, 999);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#212224';
        ctx.font = '900 12px "Plus Jakarta Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('Asesoría 💬', 2, 4);
        ctx.restore();

        // ----------------------------------------------------
        // SCENE 2 - CONTENT (7.0s - 14.0s): Brand Welcome Intro
        // ----------------------------------------------------
        if (t >= 7.0 && t < 14.0) {{
          const introT = spring(t, 7.2, 0, 1, 14, 0.8);
          ctx.save();
          ctx.globalAlpha = clamp(introT, 0, 1);

          // Center Mascot Icon
          if (iconLoaded) {{
            const iconScale = spring(t, 7.5, 0, 1, 16, 0.75);
            ctx.save();
            ctx.translate(winX + winW / 2, topbarY + 180);
            ctx.scale(iconScale, iconScale);
            ctx.drawImage(iconImg, -60, -60, 120, 120);
            ctx.restore();
          }}

          ctx.fillStyle = '#1B2432';
          ctx.font = `900 ${{CW > 1200 ? 38 : 28}}px "Plus Jakarta Sans"`;
          ctx.textAlign = 'center';
          ctx.fillText('¡Bienvenido a Finanzas Contame Pues!', winX + winW / 2, topbarY + 280);

          ctx.fillStyle = '#F6AC13';
          ctx.font = `800 ${{CW > 1200 ? 20 : 16}}px "Plus Jakarta Sans"`;
          ctx.fillText('Todo sobre seguridad, salud laboral... ¡y ahora tu salud financiera! 🛡️', winX + winW / 2, topbarY + 320);

          ctx.fillStyle = '#64748B';
          ctx.font = '500 16px "Plus Jakarta Sans"';
          ctx.fillText('La única plataforma que te dice la verdad sobre tu dinero disponible en tiempo real.', winX + winW / 2, topbarY + 360);

          // Golden feature pills
          const pY = topbarY + 410;
          const pills = [
            '✨ Cero Deudas Ocultas',
            '⚡ Registro en 1-Clic',
            '🔒 100% Seguro y Privado',
            '💬 Asesoría Humana Directa'
          ];
          let pillX = winX + winW / 2 - 340;
          pills.forEach((p, i) => {{
            const pillApp = spring(t, 8.5 + i * 0.25, 0, 1, 16, 0.8);
            ctx.save();
            ctx.translate(pillX + 75, pY);
            ctx.scale(pillApp, pillApp);
            ctx.fillStyle = '#FEF3C7';
            ctx.strokeStyle = '#F6AC13';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-80, -16, 160, 32, 999);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#92400E';
            ctx.font = '800 12px "Plus Jakarta Sans"';
            ctx.textAlign = 'center';
            ctx.fillText(p, 0, 5);
            ctx.restore();
            pillX += 175;
          }});

          ctx.restore();
        }}

        // ----------------------------------------------------
        // SCENE 3 & 4 (14.0s - 30.0s): Hero Card & Numpad Registration
        // ----------------------------------------------------
        if (t >= 14.0 && t < 30.0) {{
          const contentAlpha = t < 15.0 ? spring(t, 14.0, 0, 1, 16, 0.8) : 1;
          ctx.save();
          ctx.globalAlpha = clamp(contentAlpha, 0, 1);

          // Hero Card Container
          const heroW = winW * 0.88;
          const heroH = 460;
          const heroX = winX + (winW - heroW) / 2;
          const heroY = topbarY + 70;

          ctx.shadowColor = 'rgba(27, 36, 50, 0.08)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(heroX, heroY, heroW, heroH, 24);
          ctx.fill();
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Amber Top Accent Strip
          ctx.fillStyle = '#F6AC13';
          ctx.beginPath();
          ctx.roundRect(heroX, heroY, heroW, 4, [24, 24, 0, 0]);
          ctx.fill();

          // Status Badge
          ctx.fillStyle = '#FEF3C7';
          ctx.strokeStyle = '#F6AC13';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(heroX + 24, heroY + 22, 260, 28, 999);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#92400E';
          ctx.font = '800 11px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('🛡️ SALDO DISPONIBLE EN MANO HOY', heroX + 154, heroY + 40);

          // Rolling Balance Counter
          const targetBal = (t >= 26.0) ? 3600000 : 3450000;
          const liveBal = spring(t, 14.5, 0, targetBal, 10, 0.85);

          ctx.fillStyle = '#1C2533';
          ctx.font = `900 ${{CW > 1200 ? 56 : 42}}px "Plus Jakarta Sans"`;
          ctx.textAlign = 'left';
          ctx.fillText(formatCOP(liveBal), heroX + 24, heroY + 110);

          // Dinero Libre Real Pill
          const freeMoneyVal = (t >= 26.0) ? 1970000 : 1820000;
          ctx.fillStyle = '#FFFBEB';
          ctx.strokeStyle = 'rgba(246, 172, 19, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(heroX + 24, heroY + 130, heroW - 48, 54, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#78350F';
          ctx.font = '700 14px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText(`✨ Dinero libre real tras pagar pendientes: `, heroX + heroW / 2 - 50, heroY + 155);
          ctx.fillStyle = '#B45309';
          ctx.font = '900 17px "Plus Jakarta Sans"';
          ctx.fillText(formatCOP(freeMoneyVal), heroX + heroW / 2 + 155, heroY + 156);

          ctx.fillStyle = '#94A3B8';
          ctx.font = '500 11px "Plus Jakarta Sans"';
          ctx.fillText('Restan $ 1.630.000 por liquidar este mes • Sin deudas ocultas', heroX + heroW / 2, heroY + 174);

          // Quick Action Buttons
          const btnW = (heroW - 48 - 36) / 4;
          const btnY = heroY + 205;

          // 1. + Ingreso (Contame Pues Amber)
          const ingresoClickScale = (t >= 23.5 && t <= 24.3) ? spring(t, 23.5, 1.0, 0.92, 24, 0.7) : 1.0;
          ctx.save();
          ctx.translate(heroX + 24 + btnW / 2, btnY + 36);
          ctx.scale(ingresoClickScale, ingresoClickScale);
          ctx.fillStyle = '#FEF3C7';
          ctx.strokeStyle = '#F6AC13';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-btnW / 2, -36, btnW, 72, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#92400E';
          ctx.font = '900 15px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('💰 ＋ Ingreso', 0, 6);
          ctx.restore();

          // 2. - Gasto (Safety Red)
          ctx.fillStyle = '#FEE2E2';
          ctx.strokeStyle = '#ED3432';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(heroX + 24 + btnW + 12, btnY, btnW, 72, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#991B1B';
          ctx.font = '900 15px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('💸 － Gasto', heroX + 24 + btnW * 1.5 + 12, btnY + 42);

          // 3. 1-Clic
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(heroX + 24 + (btnW + 12) * 2, btnY, btnW, 72, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#1C2533';
          ctx.font = '800 15px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ 1-Clic', heroX + 24 + (btnW + 12) * 2 + btnW / 2, btnY + 42);

          // 4. Escáner
          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(heroX + 24 + (btnW + 12) * 3, btnY, btnW, 72, 16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#1C2533';
          ctx.font = '800 15px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('📸 Escáner', heroX + 24 + (btnW + 12) * 3 + btnW / 2, btnY + 42);

          // Progress Bar of Payments
          const progY = heroY + 300;
          ctx.fillStyle = '#1C2533';
          ctx.font = '700 13px "Plus Jakarta Sans"';
          ctx.textAlign = 'left';
          ctx.fillText('Progreso de pagos ejecutados', heroX + 24, progY);

          ctx.fillStyle = '#F6AC13';
          ctx.font = '900 13px "Plus Jakarta Sans"';
          ctx.textAlign = 'right';
          ctx.fillText('$ 3.450.000 de $ 5.080.000 (68%)', heroX + heroW - 24, progY);

          ctx.fillStyle = '#F1F5F9';
          ctx.beginPath();
          ctx.roundRect(heroX + 24, progY + 12, heroW - 48, 10, 5);
          ctx.fill();

          const barWidthProg = spring(t, 15.0, 0, (heroW - 48) * 0.68, 12, 0.85);
          ctx.fillStyle = '#F6AC13';
          ctx.beginPath();
          ctx.roundRect(heroX + 24, progY + 12, barWidthProg, 10, 5);
          ctx.fill();

          // ----------------------------------------------------
          // SCENE 4 OVERLAY: Numpad Registration & Notification
          // ----------------------------------------------------
          if (t >= 23.0 && t < 30.0) {{
            // Numpad Modal Springs in
            const numpadApp = spring(t, 23.5, 0, 1, 16, 0.8);
            ctx.save();
            ctx.translate(winX + winW / 2, heroY + 220);
            ctx.scale(numpadApp, numpadApp);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 15;

            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-180, -140, 360, 280, 20);
            ctx.fill();
            ctx.stroke();

            // Numpad Header
            ctx.fillStyle = '#1C2533';
            ctx.font = '900 16px "Plus Jakarta Sans"';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ Registro Ultrarrápido', 0, -105);

            // Amount Display
            const typedVal = (t >= 25.5) ? '$ 150.000' : (t >= 24.8 ? '$ 15.000' : '$ 1.000');
            ctx.fillStyle = '#F8FAFC';
            ctx.strokeStyle = '#F6AC13';
            ctx.beginPath();
            ctx.roundRect(-150, -85, 300, 50, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#F6AC13';
            ctx.font = '900 24px "Plus Jakarta Sans"';
            ctx.fillText(typedVal, 0, -52);

            // Numpad Category Tag
            ctx.fillStyle = '#FEF3C7';
            ctx.beginPath();
            ctx.roundRect(-90, -24, 180, 26, 999);
            ctx.fill();
            ctx.fillStyle = '#92400E';
            ctx.font = '800 11px "Plus Jakarta Sans"';
            ctx.fillText('💼 Clientes / Ingresos', 0, -7);

            // Success Confirmation Badge at t > 26.0
            if (t >= 26.0) {{
              ctx.fillStyle = '#10B981';
              ctx.font = '900 14px "Plus Jakarta Sans"';
              ctx.fillText('✅ ¡Guardado en 0.8 segundos!', 0, 30);
            }}

            ctx.restore();

            // Simulated Push Notification toast sliding down on beat 56 (t >= 27.5)
            if (t >= 27.0) {{
              const notifY = spring(t, 27.0, -100, 30, 16, 0.8);
              ctx.save();
              ctx.translate(winX + winW - 380, winY + notifY);

              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.shadowBlur = 20;
              ctx.shadowOffsetY = 8;

              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = '#10B981';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(0, 0, 340, 72, 16);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#10B981';
              ctx.font = '900 13px "Plus Jakarta Sans"';
              ctx.textAlign = 'left';
              ctx.fillText('🔔 Nequi / Bancolombia Detectado', 16, 26);

              ctx.fillStyle = '#475569';
              ctx.font = '500 12px "Plus Jakarta Sans"';
              ctx.fillText('Transferencia recibida: +$150.000 COP', 16, 48);
              ctx.restore();
            }}
          }}

          ctx.restore();
        }}

        // ----------------------------------------------------
        // SCENE 5 (30.0s - 38.0s): Budget Envelopes & SST Categories
        // ----------------------------------------------------
        if (t >= 30.0 && t < 38.0) {{
          const s5Alpha = spring(t, 30.0, 0, 1, 16, 0.85);
          ctx.save();
          ctx.globalAlpha = clamp(s5Alpha, 0, 1);

          ctx.fillStyle = '#1C2533';
          ctx.font = `900 ${{CW > 1200 ? 32 : 24}}px "Plus Jakarta Sans"`;
          ctx.textAlign = 'left';
          ctx.fillText('Inteligencia de Presupuestos & Sobres Virtuales', winX + 40, topbarY + 60);

          ctx.fillStyle = '#64748B';
          ctx.font = '600 14px "Plus Jakarta Sans"';
          ctx.fillText('Control visual preventivo: Cada peso tiene un propósito definido.', winX + 40, topbarY + 86);

          const envelopes = [
            {{ title: '🏠 Vivienda & Servicios', spent: 1200000, max: 1200000, pct: 100, color: '#10B981' }},
            {{ title: '🛒 Alimentación & Supermercado', spent: 620000, max: 800000, pct: 78, color: '#F6AC13' }},
            {{ title: '📈 Ahorro e Inversión SST', spent: 450000, max: 500000, pct: 90, color: '#F6AC13' }},
            {{ title: '🛡️ Seguridad & Operaciones', spent: 350000, max: 350000, pct: 100, color: '#10B981' }}
          ];

          const gridY = topbarY + 120;
          envelopes.forEach((env, i) => {{
            const ey = gridY + i * 82;
            const envApp = spring(t, 30.5 + i * 0.25, 0, 1, 16, 0.82);

            ctx.save();
            ctx.translate(winX + winW / 2, ey + 30);
            ctx.scale(envApp, envApp);

            ctx.fillStyle = '#F8FAFC';
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-(winW - 80) / 2, -30, winW - 80, 68, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1C2533';
            ctx.font = '800 15px "Plus Jakarta Sans"';
            ctx.textAlign = 'left';
            ctx.fillText(env.title, -(winW - 80) / 2 + 20, -5);

            ctx.fillStyle = '#64748B';
            ctx.font = '700 13px "Plus Jakarta Sans"';
            ctx.textAlign = 'right';
            ctx.fillText(`${{formatCOP(env.spent)}} / ${{formatCOP(env.max)}} (${{env.pct}}%)`, (winW - 80) / 2 - 20, -5);

            // Bar background
            ctx.fillStyle = '#E2E8F0';
            ctx.beginPath();
            ctx.roundRect(-(winW - 80) / 2 + 20, 10, winW - 120, 8, 4);
            ctx.fill();

            // Bar fill with spring
            const fillWidth = spring(t, 31.0 + i * 0.2, 0, (winW - 120) * (env.pct / 100), 12, 0.85);
            ctx.fillStyle = env.color;
            ctx.beginPath();
            ctx.roundRect(-(winW - 80) / 2 + 20, 10, fillWidth, 8, 4);
            ctx.fill();

            ctx.restore();
          }});

          ctx.restore();
        }}

        // ----------------------------------------------------
        // SCENE 6 (38.0s - 43.0s): Cloud Sync & WhatsApp Asesoría
        // ----------------------------------------------------
        if (t >= 38.0 && t < 43.0) {{
          const s6Alpha = spring(t, 38.0, 0, 1, 16, 0.85);
          ctx.save();
          ctx.globalAlpha = clamp(s6Alpha, 0, 1);

          // Cloud Sync Card
          const syncCardW = 460;
          const syncCardX = winX + winW * 0.28 - syncCardW / 2;
          const syncCardY = topbarY + 120;

          ctx.fillStyle = '#F8FAFC';
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(syncCardX, syncCardY, syncCardW, 280, 20);
          ctx.fill();
          ctx.stroke();

          ctx.font = '48px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('☁️', syncCardX + syncCardW / 2, syncCardY + 70);

          ctx.fillStyle = '#1C2533';
          ctx.font = '900 18px "Plus Jakarta Sans"';
          ctx.fillText('Sincronización Cloud Firestore', syncCardX + syncCardW / 2, syncCardY + 120);

          ctx.fillStyle = '#10B981';
          ctx.font = '800 13px "Plus Jakarta Sans"';
          ctx.fillText('● Conectado y Encriptado en Tiempo Real', syncCardX + syncCardW / 2, syncCardY + 150);

          ctx.fillStyle = '#64748B';
          ctx.font = '500 13px "Plus Jakarta Sans"';
          ctx.fillText('Tus finanzas seguras y disponibles en tu celular,', syncCardX + syncCardW / 2, syncCardY + 190);
          ctx.fillText('tablet o computador, 24/7.', syncCardX + syncCardW / 2, syncCardY + 212);

          // WhatsApp Asesoría Feature Card
          const waCardW = 460;
          const waCardX = winX + winW * 0.72 - waCardW / 2;
          const waCardY = topbarY + 120;

          ctx.fillStyle = '#FFFDF5';
          ctx.strokeStyle = '#F6AC13';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(waCardX, waCardY, waCardW, 280, 20);
          ctx.fill();
          ctx.stroke();

          ctx.font = '48px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText('💬', waCardX + waCardW / 2, waCardY + 70);

          ctx.fillStyle = '#1C2533';
          ctx.font = '900 18px "Plus Jakarta Sans"';
          ctx.fillText('Asesoría Especializada Contame Pues', waCardX + waCardW / 2, waCardY + 120);

          ctx.fillStyle = '#D97706';
          ctx.font = '800 13px "Plus Jakarta Sans"';
          ctx.fillText('● Acompañamiento Directo vía WhatsApp', waCardX + waCardW / 2, waCardY + 150);

          ctx.fillStyle = '#64748B';
          ctx.font = '500 13px "Plus Jakarta Sans"';
          ctx.fillText('No estás solo: Resuelve dudas contables, de SST', waCardX + waCardW / 2, waCardY + 190);
          ctx.fillText('y de flujo de caja con un clic.', waCardX + waCardW / 2, waCardY + 212);

          ctx.restore();
        }}

        // Simulated High-Craft Pointer Cursor
        if (t >= 22.0 && t <= 42.0) {{
          // Cursor path coordinates
          let curX = winX + winW * 0.6;
          let curY = topbarY + 300;

          if (t >= 22.0 && t < 24.5) {{
            // Moving towards '+ Ingreso' button
            curX = spring(t, 22.0, winX + winW * 0.7, winX + (winW * 0.88 - winW * 0.88 * 0.12) / 4 + 40, 14, 0.8);
            curY = spring(t, 22.0, topbarY + 400, topbarY + 310, 14, 0.8);
          }} else if (t >= 24.5 && t < 28.0) {{
            // Moving onto the numpad
            curX = spring(t, 24.5, winX + 100, winX + winW / 2, 14, 0.8);
            curY = spring(t, 24.5, topbarY + 310, topbarY + 320, 14, 0.8);
          }} else if (t >= 38.5 && t < 41.5) {{
            // Moving towards 'Asesoría 💬' topbar button
            curX = spring(t, 38.5, winX + winW / 2, asesoriaX + 50, 14, 0.8);
            curY = spring(t, 38.5, topbarY + 200, topbarY + 32, 14, 0.8);
          }}

          ctx.save();
          ctx.translate(curX, curY);

          // Click ripple wave
          if ((t >= 23.5 && t <= 24.2) || (t >= 40.0 && t <= 40.7)) {{
            const ripT = (t >= 40.0) ? (t - 40.0) / 0.7 : (t - 23.5) / 0.7;
            ctx.strokeStyle = `rgba(246, 172, 19, ${{1 - ripT}})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, ripT * 35, 0, Math.PI * 2);
            ctx.stroke();
          }}

          // Cursor shape
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 18);
          ctx.lineTo(5, 14);
          ctx.lineTo(11, 22);
          ctx.lineTo(14, 20);
          ctx.lineTo(8, 12);
          ctx.lineTo(15, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }}
      }}

      // ========================================================
      // SCENE 7 (43.0s - 48.0s): Grand SaaS Finale & Call to Action
      // ========================================================
      if (t >= 42.5) {{
        const s7Alpha = spring(t, 42.5, 0, 1, 14, 0.82);
        ctx.save();
        ctx.globalAlpha = clamp(s7Alpha, 0, 1);

        // Center Mascot Logo
        if (iconLoaded) {{
          const iconS7 = spring(t, 43.0, 0, 1, 16, 0.75);
          ctx.save();
          ctx.translate(CW / 2, CH * 0.28);
          ctx.scale(iconS7, iconS7);
          ctx.drawImage(iconImg, -65, -65, 130, 130);
          ctx.restore();
        }}

        // Official Horizontal Logo
        if (logoLoaded) {{
          ctx.drawImage(logoImg, CW / 2 - 130, CH * 0.38, 260, 68);
        }}

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${{CW > 1200 ? 54 : 36}}px "Plus Jakarta Sans"`;
        ctx.textAlign = 'center';
        ctx.fillText('TOMA EL CONTROL DE TU', CW / 2, CH * 0.54);

        ctx.fillStyle = '#F6AC13';
        ctx.fillText('TRANQUILIDAD FINANCIERA HOY', CW / 2, CH * 0.54 + (CW > 1200 ? 64 : 46));

        ctx.fillStyle = '#CBD5E1';
        ctx.font = `500 ${{CW > 1200 ? 22 : 16}}px "Plus Jakarta Sans"`;
        ctx.fillText('Cero deudas ocultas. Cero estrés. Finanzas transparentes para Colombia 🇨🇴', CW / 2, CH * 0.54 + (CW > 1200 ? 120 : 85));

        // Call to action button with golden pulse
        const ctaY = CH * 0.76;
        const ctaScale = 1.0 + Math.sin(t * 4.0) * 0.025;
        ctx.save();
        ctx.translate(CW / 2, ctaY);
        ctx.scale(ctaScale, ctaScale);

        // Glow
        ctx.shadowColor = 'rgba(246, 172, 19, 0.5)';
        ctx.shadowBlur = 35;

        ctx.fillStyle = '#F6AC13';
        ctx.beginPath();
        ctx.roundRect(-220, -32, 440, 64, 999);
        ctx.fill();

        ctx.fillStyle = '#121822';
        ctx.font = '900 20px "Plus Jakarta Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('👉 finanzas.contamepues.com', 0, 7);

        ctx.restore();

        // Footer note
        ctx.fillStyle = '#64748B';
        ctx.font = '600 13px "Plus Jakarta Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('Una solución oficial de Contame Pues · Todo sobre seguridad y salud laboral', CW / 2, CH * 0.88);

        ctx.restore();
      }}
    }}

    // --- Playback Animation Loop ---
    function loop(timestamp) {{
      const dt = (timestamp - lastPerf) / 1000;
      lastPerf = timestamp;

      if (isPlaying) {{
        currentTime += dt * playbackSpeed;
        if (currentTime >= DURATION) {{
          currentTime = 0;
          if (isRecording) stopRecording();
        }}
      }}

      draw(currentTime);
      updateControlsUI();

      requestAnimationFrame(loop);
    }}

    function updateControlsUI() {{
      const pct = (currentTime / DURATION) * 100;
      document.getElementById('timelineProgress').style.width = `${{pct}}%`;
      document.getElementById('timeBadge').textContent = `${{currentTime.toFixed(2)}}s / ${{DURATION.toFixed(2)}}s`;
    }}

    // --- Interactive Timeline Scrubbing ---
    const timelineTrack = document.getElementById('timelineTrack');
    let isScrubbing = false;

    timelineTrack.addEventListener('mousedown', (e) => {{
      isScrubbing = true;
      audioEngine.init();
      scrub(e);
    }});

    window.addEventListener('mousemove', (e) => {{
      if (isScrubbing) scrub(e);
    }});

    window.addEventListener('mouseup', () => {{
      isScrubbing = false;
    }});

    function scrub(e) {{
      const rect = timelineTrack.getBoundingClientRect();
      const pos = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      currentTime = pos * DURATION;
      draw(currentTime);
      updateControlsUI();
    }}

    // --- Controls Actions ---
    function togglePlay() {{
      audioEngine.init();
      if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {{
        audioEngine.ctx.resume();
      }}
      isPlaying = !isPlaying;
      document.getElementById('playIcon').textContent = isPlaying ? '⏸' : '▶';
      document.getElementById('playLabel').textContent = isPlaying ? 'Pausar' : 'Reproducir';
    }}

    function restartVideo() {{
      audioEngine.init();
      currentTime = 0;
      isPlaying = true;
      document.getElementById('playIcon').textContent = '⏸';
      document.getElementById('playLabel').textContent = 'Pausar';
      draw(0);
    }}

    function toggleAudio() {{
      audioEngine.init();
      if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {{
        audioEngine.ctx.resume();
      }}
      audioEngine.muted = !audioEngine.muted;
      document.getElementById('audioIcon').textContent = audioEngine.muted ? '🔇' : '🔊';
      document.getElementById('audioBtn').textContent = audioEngine.muted ? '🔇 Audio Muted' : '🔊 Audio ON';
    }}

    function cycleSpeed() {{
      if (playbackSpeed === 1.0) playbackSpeed = 1.5;
      else if (playbackSpeed === 1.5) playbackSpeed = 0.5;
      else playbackSpeed = 1.0;
      document.getElementById('speedLabel').textContent = `${{playbackSpeed.toFixed(1)}}x`;
    }}

    // Keyboard Shortcuts (Space: Play/Pause, R: Restart)
    window.addEventListener('keydown', (e) => {{
      if (e.code === 'Space') {{
        e.preventDefault();
        togglePlay();
      }} else if (e.code === 'KeyR') {{
        e.preventDefault();
        restartVideo();
      }}
    }});

    // --- HD Video Recording & Direct Download ---
    function toggleRecord() {{
      if (isRecording) {{
        stopRecording();
      }} else {{
        startRecording();
      }}
    }}

    function startRecording() {{
      audioEngine.init();
      if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {{
        audioEngine.ctx.resume();
      }}

      currentTime = 0;
      isPlaying = true;
      isRecording = true;
      recordedChunks = [];

      document.getElementById('recordBtn').classList.add('recording');
      document.getElementById('recordLabel').textContent = 'Grabando... (48s)';

      // Capture 60 FPS video stream from canvas
      const videoStream = canvas.captureStream(60);
      let combinedStream = videoStream;

      // Add Web Audio track if available
      if (audioEngine.dest && audioEngine.dest.stream) {{
        const audioTracks = audioEngine.dest.stream.getAudioTracks();
        if (audioTracks.length > 0) {{
          combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            audioTracks[0]
          ]);
        }}
      }}

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {{
        mimeType = 'video/webm';
      }}

      try {{
        mediaRecorder = new MediaRecorder(combinedStream, {{
          mimeType,
          videoBitsPerSecond: 8000000 // 8 Mbps high quality
        }});
      }} catch (e) {{
        mediaRecorder = new MediaRecorder(combinedStream);
      }}

      mediaRecorder.ondataavailable = (event) => {{
        if (event.data && event.data.size > 0) {{
          recordedChunks.push(event.data);
        }}
      }};

      mediaRecorder.onstop = () => {{
        const blob = new Blob(recordedChunks, {{ type: 'video/webm' }});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Finanzas_Contame_Pues_Video_SaaS_${{currentAspect.replace(':', '_')}}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {{
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }}, 200);

        document.getElementById('recordBtn').classList.remove('recording');
        document.getElementById('recordLabel').textContent = 'Descargar Video HD (WebM/MP4)';
        isRecording = false;
        alert('🎉 ¡Video HD generado con éxito! El archivo se ha descargado a tu computador.');
      }};

      mediaRecorder.start(100);
    }}

    function stopRecording() {{
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {{
        mediaRecorder.stop();
      }}
    }}

    // Start Engine
    requestAnimationFrame(loop);
  </script>
</body>
</html>
'''

# 1. Write to public/video-saas.html
dest_public = '/Users/DylanRamirez/Downloads/Gemini Dylan/App finanzas contamepues/public/video-saas.html'
with open(dest_public, 'w', encoding='utf-8') as f:
    f.write(html_content)

# 2. Write to artifact directory
dest_artifact = '/Users/DylanRamirez/.gemini/antigravity/brain/16990c47-8b91-4750-b494-3dbe18c87155/contamepues_video_saas.html'
with open(dest_artifact, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f'Video SaaS generator created at:\n- {dest_public}\n- {dest_artifact}')
