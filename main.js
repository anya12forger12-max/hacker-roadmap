import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================
   DATA
   ============================================================ */
const stages = [
  { title: 'Fundamentals', tag: 'BEGINNER', desc: 'Networking basics, Linux command line, and one scripting language (Python/Bash). Build the base everything else rests on.', color: 0x00ffaa, icon: '⚙' },
  { title: 'Reconnaissance & OSINT', tag: 'BEGINNER', desc: 'Passive/active info gathering, Google dorking, Shodan, footprinting. Know the target before touching it.', color: 0x00ffaa, icon: '🔍' },
  { title: 'Scanning & Enumeration', tag: 'BEGINNER', desc: 'Nmap, service/version detection, banner grabbing, SMB/DNS enum. Map the attack surface.', color: 0x00e0ff, icon: '📡' },
  { title: 'Vulnerability Analysis', tag: 'INTERMEDIATE', desc: 'CVE research, Nessus/OpenVAS, manual verification, false positives. Separate real risk from noise.', color: 0x00e0ff, icon: '🛡' },
  { title: 'Exploitation', tag: 'INTERMEDIATE', desc: 'Metasploit, exploit-db, manual exploitation, payload crafting. Gain initial access responsibly.', color: 0x3cffa0, icon: '💥' },
  { title: 'Web App Hacking', tag: 'INTERMEDIATE', desc: 'OWASP Top 10: SQLi, XSS, CSRF, SSRF, auth bypass, IDOR. Where most bugs live.', color: 0xffd166, icon: '🌐' },
  { title: 'Wireless & Network', tag: 'INTERMEDIATE', desc: 'WPA2 handshake, evil twin, MITM, ARP spoofing, sniffing. Own the air and the wire.', color: 0xffd166, icon: '📶' },
  { title: 'Privilege Escalation', tag: 'ADVANCED', desc: 'Linux/Windows privesc, kernel exploits, misconfigs, tokens. From user to root.', color: 0xff8c42, icon: '⬆' },
  { title: 'Post-Exploitation', tag: 'ADVANCED', desc: 'Persistence, pivoting, lateral movement, credential dumping. Move quietly, document everything.', color: 0xff8c42, icon: '🔗' },
  { title: 'Covering Tracks', tag: 'ADVANCED', desc: 'Log tampering awareness, anti-forensics, detection evasion — studied defensively to improve blue teams.', color: 0xff3c78, icon: '🕵' },
  { title: 'Reporting & Disclosure', tag: 'ADVANCED', desc: 'Professional pentest reports, CVSS scoring, responsible disclosure. A finding is only real when reported.', color: 0xff3c78, icon: '📄' },
  { title: 'Red Team & Advanced', tag: 'EXPERT', desc: 'Cloud, mobile, malware dev, custom tooling, adversary simulation. The deep end.', color: 0xb57bff, icon: '🎯' },
];

const stageResources = [
  ['TCP/IP & OSI model', 'Linux basics (bash, permissions)', 'Python scripting'],
  ['Google dorking', 'Shodan / Censys', 'WHOIS & DNS recon'],
  ['Nmap scans', 'Service enumeration', 'SMB / LDAP enum'],
  ['CVE / NVD lookup', 'Nessus / OpenVAS', 'Manual verification'],
  ['Metasploit', 'Exploit-DB', 'Payload crafting'],
  ['OWASP Top 10', 'SQLi / XSS labs', 'Burp Suite'],
  ['Aircrack-ng', 'Evil twin', 'MITM with Ettercap'],
  ['LinPEAS / WinPEAS', 'Kernel exploits', 'SUID & sudo abuse'],
  ['Mimikatz', 'Pivoting (SSH tunnels)', 'Persistence mechanisms'],
  ['Log analysis (defensive)', 'Detection engineering', 'SIEM basics'],
  ['CVSS scoring', 'Pentest report template', 'Responsible disclosure'],
  ['Cloud (AWS/GCP) attacks', 'Mobile (Android/iOS)', 'Malware dev basics'],
];

const N = stages.length;

/* ============================================================
   STORAGE
   ============================================================ */
const STORE = {
  progress: 'hr-progress',
  completed: 'hr-completed',
  notes: 'hr-notes',
};
function loadCompleted() {
  try { return new Set(JSON.parse(localStorage.getItem(STORE.completed) || '[]')); }
  catch (e) { return new Set(); }
}
function saveCompleted(set) {
  try { localStorage.setItem(STORE.completed, JSON.stringify([...set])); } catch (e) {}
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORE.notes) || '{}'); }
  catch (e) { return {}; }
}
function saveNotes(obj) {
  try { localStorage.setItem(STORE.notes, JSON.stringify(obj)); } catch (e) {}
}
let completed = loadCompleted();
let notes = loadNotes();

/* ============================================================
   SCENE SETUP
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080f, 0.032);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);

// Lights
scene.add(new THREE.AmbientLight(0x334466, 0.5));
const keyLight = new THREE.DirectionalLight(0x00ffaa, 1.0);
keyLight.position.set(12, 24, 12);
scene.add(keyLight);
const rim = new THREE.PointLight(0xff3c78, 1.0, 80);
rim.position.set(-12, 6, -12);
scene.add(rim);
const fill = new THREE.PointLight(0x00e0ff, 0.6, 60);
fill.position.set(8, -4, 8);
scene.add(fill);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.4, 0.2);
composer.addPass(bloomPass);
const outputPass = new OutputPass();
composer.addPass(outputPass);

/* ============================================================
   PATH
   ============================================================ */
const radius = 7.2;
const verticalStep = 2.3;
const points = [];
for (let i = 0; i < N; i++) {
  const angle = (i / (N - 1)) * Math.PI * 2.6 - Math.PI * 1.3;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = i * verticalStep - (N * verticalStep) / 2;
  points.push(new THREE.Vector3(x, y, z));
}
const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

// Path tube
const pathGeo = new THREE.TubeGeometry(curve, 120, 0.13, 12, false);
const pathMat = new THREE.MeshStandardMaterial({
  color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.5,
  transparent: true, opacity: 0.6, metalness: 0.4, roughness: 0.3,
});
const pathMesh = new THREE.Mesh(pathGeo, pathMat);
scene.add(pathMesh);

// Glow tube
const glowGeo = new THREE.TubeGeometry(curve, 120, 0.5, 12, false);
const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
scene.add(new THREE.Mesh(glowGeo, glowMat));

/* ============================================================
   NODES
   ============================================================ */
const nodeGroup = new THREE.Group();
scene.add(nodeGroup);
const nodeMeshes = [];
const nodeTs = [];

for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  nodeTs.push(t);
  const pos = curve.getPoint(t);
  const col = stages[i].color;

  // ring
  const ringGeo = new THREE.TorusGeometry(0.58, 0.07, 12, 40);
  const ringMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.2 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.rotation.x = Math.PI / 2;
  nodeGroup.add(ring);

  // core
  const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
  const coreMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.4, metalness: 0.6, roughness: 0.15 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(pos);
  nodeGroup.add(core);

  // halo
  const haloGeo = new THREE.SphereGeometry(0.55, 24, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(pos);
  nodeGroup.add(halo);

  // outer pulse ring (for current)
  const pulseGeo = new THREE.RingGeometry(0.7, 0.78, 48);
  const pulseMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const pulse = new THREE.Mesh(pulseGeo, pulseMat);
  pulse.position.copy(pos);
  pulse.rotation.x = -Math.PI / 2;
  nodeGroup.add(pulse);

  // label sprite
  const labelTex = makeLabelTexture(`${i + 1}. ${stages[i].title}`, col, completed.has(i));
  const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(labelMat);
  sprite.position.copy(pos).add(new THREE.Vector3(0, 1.15, 0));
  sprite.scale.set(4.6, 1.1, 1);
  nodeGroup.add(sprite);

  nodeMeshes.push({ ring, core, halo, pulse, sprite, index: i, t, baseY: pos.y });
}

function makeLabelTexture(text, color, done) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const hex = '#' + color.toString(16).padStart(6, '0');
  ctx.shadowColor = hex;
  ctx.shadowBlur = 20;
  ctx.fillStyle = done ? '#7affc4' : '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2);
  if (done) {
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillStyle = hex;
    ctx.shadowBlur = 0;
    ctx.fillText('✓', c.width - 40, 30);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function refreshNodeLabel(i) {
  const nm = nodeMeshes[i];
  const tex = makeLabelTexture(`${i + 1}. ${stages[i].title}`, stages[i].color, completed.has(i));
  nm.sprite.material.map.dispose();
  nm.sprite.material.map = tex;
}

// "You are here" beacon beam
const beaconGeo = new THREE.CylinderGeometry(0.02, 0.18, 1, 16, 1, true);
const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3c78, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
const beacon = new THREE.Mesh(beaconGeo, beaconMat);
scene.add(beacon);

// Particles
const particleCount = 320;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
const pCol = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 70;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
  const c = new THREE.Color().setHSL(0.3 + Math.random() * 0.15, 0.9, 0.6);
  pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: 0.09, transparent: true, opacity: 0.55, sizeAttenuation: true, vertexColors: true });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// Grid
const grid = new THREE.GridHelper(90, 45, 0x00ffaa, 0x0a1a2a);
grid.position.y = points[0].y - 3.2;
grid.material.opacity = 0.22;
grid.material.transparent = true;
scene.add(grid);

/* ============================================================
   STATE
   ============================================================ */
let progress = 0;
let targetProgress = 0;
let currentIndex = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredNode = -1;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   UI REFS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const hudTitle = $('hud-title');
const hudDesc = $('hud-desc');
const hudIndex = $('hud-index');
const hudTag = $('hud-tag');
const hudBar = $('hud-progress-bar');
const hudResources = $('hud-resources');
const progressPct = $('progress-pct');
const tooltip = $('tooltip');
const minimap = $('minimap');
const loader = $('loader');
const toast = $('toast');
const modal = $('shortcuts-modal');
const notesInput = $('notes-input');
const completeBtn = $('btn-complete');
const overallRing = $('overall-ring');
const overallPct = $('overall-pct');

/* minimap */
stages.forEach((s, i) => {
  const d = document.createElement('button');
  d.className = 'node-dot';
  d.type = 'button';
  d.title = s.title;
  d.setAttribute('aria-label', `Jump to stage ${i + 1}: ${s.title}`);
  d.addEventListener('click', () => jumpTo(i));
  minimap.appendChild(d);
});
const minimapDots = Array.from(minimap.querySelectorAll('.node-dot'));

/* ============================================================
   CORE LOGIC
   ============================================================ */
function nearestIndex(t) {
  let best = 0, bestD = Infinity;
  nodeTs.forEach((nt, i) => {
    const d = Math.abs(nt - t);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function jumpTo(i) {
  const t = nodeTs[i];
  targetProgress = t;
  syncScrollTo(t);
  try { localStorage.setItem(STORE.progress, String(t)); } catch (e) {}
  showToast(`Jumped to stage ${i + 1}: ${stages[i].title}`);
}

function syncScrollTo(t) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: t * maxScroll, behavior: reducedMotion ? 'auto' : 'smooth' });
}

let lastHudPct = -1;
let lastHudIndex = -1;
function updateHud(t) {
  const i = nearestIndex(t);
  if (i !== currentIndex) {
    currentIndex = i;
    const s = stages[i];
    hudTitle.textContent = s.title;
    hudDesc.textContent = s.desc;
    hudIndex.textContent = `Stage ${i + 1} of ${N}`;
    hudTag.textContent = s.tag;
    hudTag.style.color = '#' + s.color.toString(16).padStart(6, '0');
    hudResources.innerHTML = (stageResources[i] || []).map(r => `<span class="chip">${r}</span>`).join('');
    notesInput.value = notes[i] || '';
    updateCompleteBtn();
    lastHudIndex = i;
  }
  const pct = Math.round(t * 100);
  if (pct !== lastHudPct) {
    progressPct.textContent = pct + '%';
    hudBar.style.width = pct + '%';
    lastHudPct = pct;
  }

  minimapDots.forEach((d, idx) => {
    const wantDone = completed.has(idx);
    const wantCurrent = idx === currentIndex;
    if (wantDone !== d.classList.contains('done')) d.classList.toggle('done', wantDone);
    if (wantCurrent !== d.classList.contains('current')) d.classList.toggle('current', wantCurrent);
  });

  nodeMeshes.forEach((nm, idx) => {
    const active = idx === currentIndex;
    const past = idx < currentIndex || completed.has(idx);
    const s = active ? 1.5 : (past ? 1.05 : 0.85);
    nm.core.scale.setScalar(s);
    nm.halo.material.opacity = active ? 0.38 : (past ? 0.18 : 0.08);
    nm.ring.material.emissiveIntensity = active ? 1.7 : 0.6;
    nm.pulse.material.opacity = active ? (0.35 + 0.25 * Math.sin(performance.now() * 0.004)) : 0;
  });

  updateOverallProgress();
}

function updateCompleteBtn() {
  const done = completed.has(currentIndex);
  completeBtn.textContent = done ? '✓ Completed' : 'Mark complete';
  completeBtn.classList.toggle('done', done);
}

function toggleComplete() {
  if (completed.has(currentIndex)) completed.delete(currentIndex);
  else completed.add(currentIndex);
  saveCompleted(completed);
  refreshNodeLabel(currentIndex);
  updateCompleteBtn();
  updateOverallProgress();
  showToast(completed.has(currentIndex) ? `Stage ${currentIndex + 1} marked complete` : `Stage ${currentIndex + 1} unmarked`);
}

function updateOverallProgress() {
  const pct = Math.round((completed.size / N) * 100);
  overallPct.textContent = pct + '%';
  const circumference = 2 * Math.PI * 16;
  overallRing.style.strokeDasharray = `${circumference}`;
  overallRing.style.strokeDashoffset = `${circumference * (1 - completed.size / N)}`;
}

/* notes */
function saveNote() {
  notes[currentIndex] = notesInput.value;
  saveNotes(notes);
}
let noteTimer = null;
notesInput.addEventListener('input', () => {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(saveNote, 400);
});

/* ============================================================
   SCROLL
   ============================================================ */
let cachedMaxScroll = 0;
function refreshMaxScroll() { cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight; }
function onScroll() {
  if (!cachedMaxScroll) refreshMaxScroll();
  targetProgress = cachedMaxScroll > 0 ? window.scrollY / cachedMaxScroll : 0;
  targetProgress = Math.max(0, Math.min(1, targetProgress));
  try { localStorage.setItem(STORE.progress, String(targetProgress)); } catch (e) {}
}
window.addEventListener('resize', refreshMaxScroll);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// restore
try {
  const saved = parseFloat(localStorage.getItem(STORE.progress) || '0');
  if (!isNaN(saved) && saved > 0) {
    targetProgress = saved;
    progress = saved;
    syncScrollTo(saved);
  }
} catch (e) {}

/* ============================================================
   RESIZE
   ============================================================ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

/* ============================================================
   MOUSE / TOUCH
   ============================================================ */
canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  tooltip.style.left = e.clientX + 'px';
  tooltip.style.top = e.clientY + 'px';
});
canvas.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const meshes = nodeMeshes.flatMap(nm => [nm.core, nm.ring]);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length) {
    const hit = hits[0].object;
    const nm = nodeMeshes.find(n => n.core === hit || n.ring === hit);
    if (nm) jumpTo(nm.index);
  }
});

// touch swipe
let touchStartY = null;
canvas.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (touchStartY === null) return;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dy) > 60) {
    if (dy < 0) jumpTo(Math.min(N - 1, currentIndex + 1));
    else jumpTo(Math.max(0, currentIndex - 1));
  }
  touchStartY = null;
}, { passive: true });

/* ============================================================
   KEYBOARD
   ============================================================ */
window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'TEXTAREA' || tag === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); jumpTo(Math.min(N - 1, currentIndex + 1)); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); jumpTo(Math.max(0, currentIndex - 1)); }
  else if (e.key === 'Home') { e.preventDefault(); jumpTo(0); }
  else if (e.key === 'End') { e.preventDefault(); jumpTo(N - 1); }
  else if (e.key === '?' ) { e.preventDefault(); toggleShortcuts(); }
  else if (e.key === 'Escape') { closeModal(); }
  else if (e.key.toLowerCase() === 'c') { toggleComplete(); }
});

/* ============================================================
   BUTTONS
   ============================================================ */
$('btn-prev').addEventListener('click', () => jumpTo(Math.max(0, currentIndex - 1)));
$('btn-next').addEventListener('click', () => jumpTo(Math.min(N - 1, currentIndex + 1)));
completeBtn.addEventListener('click', toggleComplete);
$('btn-shortcuts').addEventListener('click', toggleShortcuts);
$('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function toggleShortcuts() { modal.classList.toggle('open'); }
function closeModal() { modal.classList.remove('open'); }

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  const time = clock.elapsedTime;

  if (!reducedMotion) {
    progress += (targetProgress - progress) * Math.min(1, dt * 5.5);
  } else {
    progress = targetProgress;
  }
  progress = Math.max(0, Math.min(1, progress));

  // camera
  const p = curve.getPoint(progress);
  const tangent = curve.getTangent(progress).normalize();
  const camPos = p.clone().add(new THREE.Vector3(0, 3.4, 0)).sub(tangent.clone().multiplyScalar(6.2));
  // subtle mouse parallax
  camPos.x += mouse.x * 0.6;
  camPos.y += mouse.y * 0.4;
  camera.position.lerp(camPos, reducedMotion ? 1 : 0.09);
  const lookTarget = p.clone().add(new THREE.Vector3(0, 0.6, 0));
  camera.lookAt(lookTarget);

  // beacon at current node
  const ci = nearestIndex(progress);
  const cpos = curve.getPoint(nodeTs[ci]);
  beacon.position.set(cpos.x, cpos.y + 0.5, cpos.z);
  beacon.scale.set(1, 6, 1);
  beacon.material.opacity = 0.45 + 0.2 * Math.sin(time * 3);

  // node bob
  nodeMeshes.forEach((nm, i) => {
    const bob = reducedMotion ? 0 : Math.sin(time * 1.4 + i * 0.7) * 0.08;
    nm.core.position.y = nm.baseY + bob;
    nm.ring.position.y = nm.core.position.y;
    nm.halo.position.y = nm.core.position.y;
    nm.pulse.position.y = nm.core.position.y;
    nm.sprite.position.y = nm.core.position.y + 1.15;
  });

  particles.rotation.y = time * 0.018;
  if (!reducedMotion) particles.rotation.x = Math.sin(time * 0.08) * 0.08;

  rim.position.x = Math.sin(time * 0.4) * 9;
  rim.position.z = Math.cos(time * 0.4) * 9;
  fill.position.x = Math.cos(time * 0.6) * 6;
  fill.position.z = Math.sin(time * 0.6) * 6;

  updateHud(progress);
  composer.render();
}

// hide loader
requestAnimationFrame(() => {
  setTimeout(() => loader.classList.add('hidden'), 500);
});

// Pause rendering when tab hidden (saves CPU, helps idle)
let paused = false;
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (!paused) clock.getDelta(); // reset delta
});
const _animate = animate;
function loop() {
  if (!paused) _animate();
  requestAnimationFrame(loop);
}
// Replace direct animate call
requestAnimationFrame(loop);

/* ============================================================
   PWA
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
PY