import * as THREE from 'three';

// ---------- Roadmap data ----------
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

const stages = [
  { title: 'Fundamentals', tag: 'BEGINNER', desc: 'Networking basics, Linux command line, and one scripting language (Python/Bash).', color: 0x00ffaa },
  { title: 'Reconnaissance & OSINT', tag: 'BEGINNER', desc: 'Passive/active info gathering, Google dorking, Shodan, footprinting.', color: 0x00ffaa },
  { title: 'Scanning & Enumeration', tag: 'BEGINNER', desc: 'Nmap, service/version detection, banner grabbing, SMB/DNS enum.', color: 0x00e0ff },
  { title: 'Vulnerability Analysis', tag: 'INTERMEDIATE', desc: 'CVE research, Nessus/OpenVAS, manual verification, false positives.', color: 0x00e0ff },
  { title: 'Exploitation', tag: 'INTERMEDIATE', desc: 'Metasploit, exploit-db, manual exploitation, payload crafting.', color: 0x3cffa0 },
  { title: 'Web App Hacking', tag: 'INTERMEDIATE', desc: 'OWASP Top 10: SQLi, XSS, CSRF, SSRF, auth bypass, IDOR.', color: 0xffd166 },
  { title: 'Wireless & Network', tag: 'INTERMEDIATE', desc: 'WPA2 handshake, evil twin, MITM, ARP spoofing, sniffing.', color: 0xffd166 },
  { title: 'Privilege Escalation', tag: 'ADVANCED', desc: 'Linux/Windows privesc, kernel exploits, misconfigs, tokens.', color: 0xff8c42 },
  { title: 'Post-Exploitation', tag: 'ADVANCED', desc: 'Persistence, pivoting, lateral movement, credential dumping.', color: 0xff8c42 },
  { title: 'Covering Tracks', tag: 'ADVANCED', desc: 'Log tampering awareness, anti-forensics, detection evasion (defensive).', color: 0xff3c78 },
  { title: 'Reporting & Disclosure', tag: 'ADVANCED', desc: 'Professional pentest reports, CVSS scoring, responsible disclosure.', color: 0xff3c78 },
  { title: 'Red Team & Advanced', tag: 'EXPERT', desc: 'Cloud, mobile, malware dev, custom tooling, adversary simulation.', color: 0xb57bff },
];

// ---------- Scene setup ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080f, 0.035);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

// Lights
scene.add(new THREE.AmbientLight(0x334466, 0.6));
const keyLight = new THREE.DirectionalLight(0x00ffaa, 0.9);
keyLight.position.set(10, 20, 10);
scene.add(keyLight);
const rim = new THREE.PointLight(0xff3c78, 0.8, 60);
rim.position.set(-10, 5, -10);
scene.add(rim);

// ---------- Build path ----------
const N = stages.length;
const radius = 7;
const verticalStep = 2.2;
const points = [];
for (let i = 0; i < N; i++) {
  const angle = (i / (N - 1)) * Math.PI * 2.6 - Math.PI * 1.3;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = i * verticalStep - (N * verticalStep) / 2;
  points.push(new THREE.Vector3(x, y, z));
}
const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

// Path line
const pathGeo = new THREE.TubeGeometry(curve, 200, 0.12, 12, false);
const pathMat = new THREE.MeshStandardMaterial({
  color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.4,
  transparent: true, opacity: 0.55, metalness: 0.3, roughness: 0.4,
});
const pathMesh = new THREE.Mesh(pathGeo, pathMat);
scene.add(pathMesh);

// Glow under path (thicker, faint)
const glowGeo = new THREE.TubeGeometry(curve, 200, 0.45, 12, false);
const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
scene.add(new THREE.Mesh(glowGeo, glowMat));

// Nodes
const nodeGroup = new THREE.Group();
scene.add(nodeGroup);
const nodeMeshes = [];
const nodeTs = [];
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  nodeTs.push(t);
  const pos = curve.getPoint(t);

  // base ring
  const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 12, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: stages[i].color, emissive: stages[i].color, emissiveIntensity: 0.8 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.rotation.x = Math.PI / 2;
  nodeGroup.add(ring);

  // core sphere
  const coreGeo = new THREE.SphereGeometry(0.28, 24, 24);
  const coreMat = new THREE.MeshStandardMaterial({ color: stages[i].color, emissive: stages[i].color, emissiveIntensity: 1.2, metalness: 0.5, roughness: 0.2 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(pos);
  nodeGroup.add(core);

  // halo
  const haloGeo = new THREE.SphereGeometry(0.5, 24, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color: stages[i].color, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(pos);
  nodeGroup.add(halo);

  // label sprite
  const labelTex = makeLabelTexture(`${i + 1}. ${stages[i].title}`, stages[i].color);
  const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(labelMat);
  sprite.position.copy(pos).add(new THREE.Vector3(0, 1.0, 0));
  sprite.scale.set(4.2, 1.0, 1);
  nodeGroup.add(sprite);

  nodeMeshes.push({ ring, core, halo, sprite, index: i, t });
}

function makeLabelTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#' + color.toString(16).padStart(6, '0');
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// Particles
const particleCount = 600;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 60;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0x00ffaa, size: 0.08, transparent: true, opacity: 0.5, sizeAttenuation: true });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// Grid floor (subtle)
const grid = new THREE.GridHelper(80, 40, 0x00ffaa, 0x0a1a2a);
grid.position.y = points[0].y - 3;
grid.material.opacity = 0.25;
grid.material.transparent = true;
scene.add(grid);

// ---------- State ----------
let progress = 0; // 0..1
let targetProgress = 0;
let currentIndex = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ---------- UI refs ----------
const hudTitle = document.getElementById('hud-title');
const hudDesc = document.getElementById('hud-desc');
const hudIndex = document.getElementById('hud-index');
const hudTag = document.getElementById('hud-tag');
const hudBar = document.getElementById('hud-progress-bar');
const hudResources = document.getElementById('hud-resources');
const progressPct = document.getElementById('progress-pct');
const tooltip = document.getElementById('tooltip');
const minimap = document.getElementById('minimap');
const loader = document.getElementById('loader');

// Build minimap dots
stages.forEach((s, i) => {
  const d = document.createElement('div');
  d.className = 'node-dot';
  d.title = s.title;
  d.addEventListener('click', () => jumpTo(i));
  minimap.appendChild(d);
});
const minimapDots = Array.from(minimap.querySelectorAll('.node-dot'));

function jumpTo(i) {
  const t = nodeTs[i];
  targetProgress = t;
  syncScrollTo(t);
  try { localStorage.setItem('hr-progress', String(t)); } catch (e) {}
}

// Keyboard navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); jumpTo(Math.min(N - 1, currentIndex + 1)); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); jumpTo(Math.max(0, currentIndex - 1)); }
  else if (e.key === 'Home') { e.preventDefault(); jumpTo(0); }
  else if (e.key === 'End') { e.preventDefault(); jumpTo(N - 1); }
});

function syncScrollTo(t) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: t * maxScroll, behavior: 'smooth' });
}

function nearestIndex(t) {
  let best = 0, bestD = Infinity;
  nodeTs.forEach((nt, i) => {
    const d = Math.abs(nt - t);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function updateHud(t) {
  const i = nearestIndex(t);
  if (i !== currentIndex) {
    currentIndex = i;
    const s = stages[i];
    hudTitle.textContent = s.title;
    hudDesc.textContent = s.desc;
    hudIndex.textContent = `Stage ${i + 1} of ${N}`;
    hudTag.textContent = s.tag;
    // color tag
    hudTag.style.color = '#' + s.color.toString(16).padStart(6, '0');
    // resources
    hudResources.innerHTML = (stageResources[i] || []).map(r => `<span class="chip">${r}</span>`).join('');
  }
  const pct = Math.round(t * 100);
  progressPct.textContent = pct + '%';
  hudBar.style.width = pct + '%';

  // minimap
  minimapDots.forEach((d, idx) => {
    d.classList.remove('done', 'current');
    if (idx < currentIndex) d.classList.add('done');
    if (idx === currentIndex) d.classList.add('current');
  });

  // node visual state
  nodeMeshes.forEach((nm, idx) => {
    const active = idx === currentIndex;
    const past = idx < currentIndex;
    nm.core.scale.setScalar(active ? 1.5 : (past ? 1.0 : 0.85));
    nm.halo.material.opacity = active ? 0.35 : (past ? 0.18 : 0.08);
    nm.ring.material.emissiveIntensity = active ? 1.6 : 0.6;
  });
}

// ---------- Scroll handling ----------
function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  targetProgress = Math.max(0, Math.min(1, targetProgress));
  try { localStorage.setItem('hr-progress', String(targetProgress)); } catch (e) {}
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Restore saved progress
try {
  const saved = parseFloat(localStorage.getItem('hr-progress') || '0');
  if (!isNaN(saved) && saved > 0) {
    targetProgress = saved;
    progress = saved;
    syncScrollTo(saved);
  }
} catch (e) {}

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Mouse interaction ----------
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

// ---------- Buttons ----------
document.getElementById('btn-prev').addEventListener('click', () => {
  const i = Math.max(0, currentIndex - 1);
  jumpTo(i);
});
document.getElementById('btn-next').addEventListener('click', () => {
  const i = Math.min(N - 1, currentIndex + 1);
  jumpTo(i);
});

// ---------- Animation loop ----------
const clock = new THREE.Clock();
let hoveredNode = -1;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  // smooth progress
  progress += (targetProgress - progress) * Math.min(1, dt * 6);
  progress = Math.max(0, Math.min(1, progress));

  // camera along curve
  const p = curve.getPoint(progress);
  const tangent = curve.getTangent(progress).normalize();
  // position: offset behind + above
  const camPos = p.clone().add(new THREE.Vector3(0, 3.2, 0)).sub(tangent.clone().multiplyScalar(6));
  camera.position.lerp(camPos, 0.08);
  const lookTarget = p.clone().add(new THREE.Vector3(0, 0.5, 0));
  camera.lookAt(lookTarget);

  // hover detection
  raycaster.setFromCamera(mouse, camera);
  const meshes = nodeMeshes.flatMap(nm => [nm.core, nm.ring]);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length) {
    const hit = hits[0].object;
    const nm = nodeMeshes.find(n => n.core === hit || n.ring === hit);
    if (nm && hoveredNode !== nm.index) {
      hoveredNode = nm.index;
      tooltip.textContent = `${nm.index + 1}. ${stages[nm.index].title}`;
      tooltip.classList.add('show');
    }
  } else {
    if (hoveredNode !== -1) {
      hoveredNode = -1;
      tooltip.classList.remove('show');
    }
  }

  // subtle node bob
  const time = clock.elapsedTime;
  nodeMeshes.forEach((nm, i) => {
    nm.core.position.y = points[i].y + Math.sin(time * 1.5 + i) * 0.08;
    nm.ring.position.y = nm.core.position.y;
    nm.halo.position.y = nm.core.position.y;
    nm.sprite.position.y = nm.core.position.y + 1.0;
  });

  particles.rotation.y = time * 0.02;
  particles.rotation.x = Math.sin(time * 0.1) * 0.1;

  rim.position.x = Math.sin(time * 0.5) * 8;
  rim.position.z = Math.cos(time * 0.5) * 8;

  updateHud(progress);
  renderer.render(scene, camera);
}

// hide loader after first frame
requestAnimationFrame(() => {
  setTimeout(() => loader.classList.add('hidden'), 400);
});

animate();
