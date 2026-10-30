import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { RIG } from "@/lib/rig/engine";
import { figuresFromEntry } from "@/lib/fitting/autofit";
import { loadBaseBody, buildMannequin } from "@/lib/rig/mannequin";
const BODY = RIG.BODIES[0].b;
const DEG = Math.PI / 180;
const PARENT = { root: null, spine: "root", chest: "spine", neck: "chest", head: "neck", shL: "chest", shR: "chest", elL: "shL", elR: "shR", wrL: "elL", wrR: "elR", haL: "wrL", haR: "wrR", hipL: "root", hipR: "root", knL: "hipL", knR: "hipR", anL: "knL", anR: "knR", toL: "anL", toR: "anR" };
const ORDER = Object.keys(PARENT);
const NAME = { root: "pelvis", spine: "spine", chest: "chest", neck: "neck", head: "head", shL: "upper_arm.L", shR: "upper_arm.R", elL: "forearm.L", elR: "forearm.R", wrL: "hand.L", wrR: "hand.R", haL: "hand_tip.L", haR: "hand_tip.R", hipL: "thigh.L", hipR: "thigh.R", knL: "shin.L", knR: "shin.R", anL: "foot.L", anR: "foot.R", toL: "toe_tip.L", toR: "toe_tip.R" };
const CHILDREN = {};
ORDER.forEach(n => { const p = PARENT[n]; if (p) (CHILDREN[p] = CHILDREN[p] || []).push(n); });
const REST = RIG.fk({}, BODY).P;
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const P = {};
ORDER.forEach(n => P[n] = V(REST[n]));
let HEAD_R = BODY.headR * BODY.s;
let BASE = null, BASE_RAW = null, basePromise = null;
const SIZE_KEY = "mlib.bodySize";
let SIZING = (() => { try { return JSON.parse(localStorage.getItem(SIZE_KEY) || "null") || {}; } catch (e) { return {}; } })();
let POSE_SIZING = null, MATCH_DRAWING = true, BUILT_FOR = null;
function effectiveSizing() {
  if (!MATCH_DRAWING || !POSE_SIZING) return SIZING;
  return Object.assign({}, SIZING, Object.fromEntries(Object.entries(POSE_SIZING).filter(([, v]) => v != null)));
}
function applyBase(b) { BASE = b; for (const n of ORDER) P[n].copy(b.P[n]); HEAD_R = b.headR; GEO = b.geo; }
function buildBase() {
  const sizing = effectiveSizing(), key = JSON.stringify(sizing);
  if (!BASE_RAW || key === BUILT_FOR) return;
  applyBase(buildMannequin(BASE_RAW, ORDER, sizing));
  BUILT_FOR = key;
}
function rebuildBase() {
  buildBase();
  try { localStorage.setItem(SIZE_KEY, JSON.stringify(SIZING)); } catch (e) {}
}
function drawingSizing(props) {
  if (!props || !BASE_RAW) return null;
  const P0 = BASE_RAW.P0, d = (a, b) => P0[a].distanceTo(P0[b]), mid = (a, b) => P0[a].clone().add(P0[b]).multiplyScalar(0.5);
  const torso = mid("shL", "shR").distanceTo(mid("hipL", "hipR"));
  const own = { thigh: (d("hipL", "knL") + d("hipR", "knR")) / 2 / torso, shin: (d("knL", "anL") + d("knR", "anR")) / 2 / torso, upperArm: (d("shL", "elL") + d("shR", "elR")) / 2 / torso, forearm: (d("elL", "wrL") + d("elR", "wrR")) / 2 / torso, shoulders: d("shL", "shR") / torso, hips: d("hipL", "hipR") / torso };
  const ratio = k => (props[k] ? props[k] / own[k] : null);
  const mean = (...list) => { list = list.filter(x => x); return list.length ? list.reduce((t, x) => t + x, 0) / list.length : null; };
  const damp = (v, lo, hi) => (v == null ? null : +Math.max(lo, Math.min(hi, 1 + 0.8 * (v - 1))).toFixed(2));
  const out = { legs: damp(mean(ratio("thigh"), ratio("shin")), 0.88, 1.18), arms: damp(mean(ratio("upperArm"), ratio("forearm")), 0.88, 1.15), shoulders: damp(ratio("shoulders"), 0.85, 1.2), hips: damp(ratio("hips"), 0.85, 1.3) };
  return Object.values(out).some(v => v != null) ? out : null;
}
function ensureBase() {
  if (!basePromise) basePromise = loadBaseBody(ORDER).then(raw => { BASE_RAW = raw; buildBase(); return BASE; }).catch(err => { console.warn("Base body unavailable, using the simple mannequin:", err.message); return null; });
  return basePromise;
}
const UP = new THREE.Vector3(0, 1, 0);

function frameFor(axis) {
  const a = axis.clone().normalize();
  let side = new THREE.Vector3(1, 0, 0);
  if (Math.abs(a.dot(side)) > 0.9) side = new THREE.Vector3(0, 1, 0);
  side.addScaledVector(a, -side.dot(a)).normalize();
  const front = new THREE.Vector3().crossVectors(side, a).normalize();
  return { side, front, axis: a };
}
const ease = f => (1 - Math.cos(Math.min(1, Math.max(0, f)) * Math.PI)) / 2;
function stationAt(st, t) {
  if (t <= st[0][0]) return [st[0][1], st[0][2], st[0][3] || 0];
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1];
    if (t <= b[0]) { const e = ease((t - a[0]) / ((b[0] - a[0]) || 1)); return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * e]; }
  }
  const l = st[st.length - 1];
  return [l[1], l[2], l[3] || 0];
}
function makeLoft(a, b, stations, { cap = 0.6, ring = 28, steps = 28 } = {}) {
  const fr = frameFor(b.clone().sub(a));
  const t0 = stations[0][0], t1 = stations[stations.length - 1][0];
  const centre = (t, sh) => a.clone().lerp(b, t).addScaledVector(fr.front, sh);
  const surface = (t, th, lift = 0) => { const [rx, ry, sh] = stationAt(stations, t); return centre(t, sh).addScaledVector(fr.side, (rx + lift) * Math.cos(th)).addScaledVector(fr.front, (ry + lift) * Math.sin(th)); };
  const pos = [], ts = [], idx = [], rings = [];
  const capLen = t => { const [rx, ry] = stationAt(stations, t); return Math.min(rx, ry) * cap; };
  const ringAt = (t, scale, along) => {
    const start = pos.length / 3;
    const [rx, ry, sh] = stationAt(stations, t);
    const c = centre(t, sh).addScaledVector(fr.axis, along);
    for (let i = 0; i < ring; i++) { const th = (i / ring) * Math.PI * 2; const p = c.clone().addScaledVector(fr.side, rx * scale * Math.cos(th)).addScaledVector(fr.front, ry * scale * Math.sin(th)); pos.push(p.x, p.y, p.z); ts.push(t); }
    rings.push(start);
  };
  for (let i = 5; i >= 1; i--) { const th = (i / 6) * Math.PI / 2; ringAt(t0, Math.cos(th), -capLen(t0) * Math.sin(th)); }
  for (let k = 0; k <= steps; k++) ringAt(t0 + (t1 - t0) * k / steps, 1, 0);
  for (let i = 1; i <= 5; i++) { const th = (i / 6) * Math.PI / 2; ringAt(t1, Math.cos(th), capLen(t1) * Math.sin(th)); }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < ring; i++) {
    const a0 = rings[r] + i, a1 = rings[r] + (i + 1) % ring, b0 = rings[r + 1] + i, b1 = rings[r + 1] + (i + 1) % ring;
    idx.push(a0, b0, a1, a1, b0, b1);
  }
  const tip = (t, sign) => { const [, , sh] = stationAt(stations, t); const p = centre(t, sh).addScaledVector(fr.axis, sign * capLen(t)); pos.push(p.x, p.y, p.z); ts.push(t); return pos.length / 3 - 1; };
  const ta = tip(t0, -1), tb = tip(t1, 1), last = rings[rings.length - 1];
  for (let i = 0; i < ring; i++) { idx.push(ta, rings[0] + i, rings[0] + (i + 1) % ring); idx.push(tb, last + (i + 1) % ring, last + i); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return { geo, ts, surface, frame: fr };
}
function ellipsoid(centre, r, scale, taper = 0) {
  const geo = new THREE.SphereGeometry(r, 40, 24);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * scale[0], y = p.getY(i) * scale[1], z = p.getZ(i) * scale[2];
    if (taper && y < 0) { const f = 1 - taper * (-y / (r * scale[1])); x *= f; z *= f; }
    p.setXYZ(i, x + centre.x, y + centre.y, z + centre.z);
  }
  geo.deleteAttribute("uv"); geo.deleteAttribute("normal");
  const surface = (theta, phi, lift = 1.012) => {
    let x = r * scale[0] * Math.sin(theta) * Math.sin(phi), y = r * scale[1] * Math.cos(theta), z = r * scale[2] * Math.sin(theta) * Math.cos(phi);
    if (taper && y < 0) { const f = 1 - taper * (-y / (r * scale[1])); x *= f; z *= f; }
    return new THREE.Vector3(x * lift + centre.x, y * lift + centre.y, z * lift + centre.z);
  };
  return { geo, surface };
}
function tube(points, radius = 0.0021) {
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(12, points.length * 3), radius, 5, false);
  geo.deleteAttribute("uv"); geo.deleteAttribute("normal");
  return geo;
}
function skin(geo, weights) {
  const n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const w = weights(i, geo.attributes.position.getY(i)); si[i * 4] = w[0]; sw[i * 4] = w[1]; si[i * 4 + 1] = w[2] ?? 0; sw[i * 4 + 1] = w[3] ?? 0; }
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}
const bone = n => ORDER.indexOf(n);
const rigid = n => () => [bone(n), 1];
function mannequinGeometry() {
  const body = [], lines = [];
  const torsoA = new THREE.Vector3(0, 0.79, 0), torsoB = new THREE.Vector3(0, P.chest.y + 0.13, 0);
  const ty = y => (y - torsoA.y) / (torsoB.y - torsoA.y);
  const torsoWeight = (_, y) => { const w = ease((ty(y) - 0.4) / 0.16); return [bone("root"), 1 - w, bone("spine"), w]; };
  const torso = makeLoft(torsoA, torsoB, [
    [0, 0.075, 0.062], [ty(0.835), 0.17, 0.106, -0.006], [ty(0.9), 0.205, 0.118, -0.014], [ty(0.97), 0.175, 0.103, -0.006],
    [ty(1.05), 0.11, 0.08], [ty(1.13), 0.124, 0.087, 0.004], [ty(1.22), 0.145, 0.097], [ty(1.31), 0.162, 0.09, -0.004], [1, 0.135, 0.07, -0.004],
  ], { cap: 0.45, ring: 36, steps: 40 });
  body.push(skin(torso.geo, (i) => torsoWeight(i, torso.ts[i] * (torsoB.y - torsoA.y) + torsoA.y)));
  const neck = makeLoft(new THREE.Vector3(0, P.neck.y - 0.03, 0), new THREE.Vector3(0, P.head.y + 0.03, 0), [[0, 0.037, 0.035], [1, 0.032, 0.031]], { ring: 24, steps: 8 });
  body.push(skin(neck.geo, rigid("neck")));
  const head = ellipsoid(P.head.clone().addScaledVector(UP, HEAD_R * 1.05), HEAD_R, [0.84, 1.14, 0.96], 0.22);
  body.push(skin(head.geo, rigid("head")));
  const meridian = [], eyeLine = [];
  for (let k = 0; k <= 24; k++) meridian.push(head.surface(-0.35 * Math.PI + k / 24 * 1.27 * Math.PI, 0));
  for (let k = 0; k <= 16; k++) eyeLine.push(head.surface(0.56 * Math.PI, -1.15 + k / 16 * 2.3));
  lines.push(skin(tube(meridian, 0.0019), rigid("head")));
  lines.push(skin(tube(eyeLine, 0.0019), rigid("head")));
  const centreLine = [];
  for (let k = 0; k <= 20; k++) centreLine.push(torso.surface(ty(1.33 - k / 20 * 0.5), Math.PI / 2, 0.002));
  lines.push(skin(tube(centreLine), (i, y) => torsoWeight(i, y)));
  const underBust = [];
  for (let k = 0; k <= 16; k++) underBust.push(torso.surface(ty(1.152), 0.42 + k / 16 * (Math.PI - 0.84), 0.002));
  lines.push(skin(tube(underBust), (i, y) => torsoWeight(i, y)));
  for (const [s, sx] of [["L", 1], ["R", -1]]) {
    const band = [];
    for (let k = 0; k <= 14; k++) { const f = k / 14, th = (sx > 0 ? 0 : Math.PI) + ((sx > 0 ? 1 : -1) * Math.PI / 2) * ease(f); band.push(torso.surface(ty(0.985 - 0.18 * f), th, 0.002)); }
    lines.push(skin(tube(band), (i, y) => torsoWeight(i, y)));
    body.push(skin(ellipsoid(new THREE.Vector3(0.085 * sx, 0.872, -0.06), 0.097, [0.98, 0.9, 0.86]).geo, rigid("root")));
    body.push(skin(ellipsoid(new THREE.Vector3(0.07 * sx, 1.215, 0.072), 0.068, [1, 0.92, 0.86]).geo, rigid("spine")));
    const limb = (node, a, b, st, opt, axis = true) => {
      const l = makeLoft(a, b, st, opt);
      body.push(skin(l.geo, rigid(node)));
      if (axis) { const pts = []; for (let k = 0; k <= 10; k++) pts.push(l.surface(0.14 + k / 10 * 0.72, -Math.PI / 2, 0.0015)); lines.push(skin(tube(pts, 0.0016), rigid(node))); }
      for (const t of (opt && opt.seams) || []) { const ring = []; for (let k = 0; k <= 24; k++) ring.push(l.surface(t, (k / 24) * Math.PI * 2, 0.0012)); lines.push(skin(tube(ring, 0.0017), rigid(node))); }
      return l;
    };
    limb("sh" + s, P["sh" + s], P["el" + s], [[0, 0.045, 0.044], [0.3, 0.047, 0.045], [0.88, 0.032, 0.031], [1, 0.026, 0.025]], { ring: 24, steps: 16, seams: [0.93] });
    limb("el" + s, P["el" + s], P["wr" + s], [[0, 0.026, 0.025], [0.1, 0.033, 0.031], [0.3, 0.037, 0.034], [0.88, 0.023, 0.02], [1, 0.019, 0.017]], { ring: 24, steps: 16, seams: [0.07, 0.94] });
    const handDir = P["ha" + s].clone().sub(P["wr" + s]);
    limb("wr" + s, P["wr" + s], P["ha" + s].clone().addScaledVector(handDir, 0.35), [[0, 0.021, 0.012], [0.4, 0.032, 0.013], [1, 0.026, 0.01]], { cap: 0.9, ring: 20, steps: 10 }, false);
    const unit = handDir.clone().normalize(), thumbA = P["wr" + s].clone().addScaledVector(unit, 0.025).add(new THREE.Vector3(0, 0, 0.012));
    limb("wr" + s, thumbA, thumbA.clone().addScaledVector(unit, 0.045).add(new THREE.Vector3(0, 0, 0.022)), [[0, 0.0105, 0.0095], [1, 0.008, 0.007]], { cap: 0.9, ring: 14, steps: 6 }, false);
    limb("hip" + s, P["hip" + s].clone().addScaledVector(UP, 0.035), P["kn" + s], [[0, 0.112, 0.102], [0.25, 0.1, 0.094, -0.005], [0.7, 0.069, 0.064], [0.9, 0.05, 0.048], [1, 0.042, 0.04]], { ring: 28, steps: 20, seams: [0.07, 0.94] });
    limb("kn" + s, P["kn" + s], P["an" + s], [[0, 0.041, 0.039], [0.1, 0.05, 0.048], [0.3, 0.06, 0.064, 0.009], [0.72, 0.038, 0.037], [0.92, 0.029, 0.028], [1, 0.026, 0.025]], { ring: 24, steps: 20, seams: [0.06, 0.94] });
    limb("an" + s, P["an" + s].clone().add(new THREE.Vector3(0, -0.028, -0.045)), P["to" + s].clone().add(new THREE.Vector3(0, -0.018, 0.035)), [[0, 0.03, 0.026], [0.45, 0.036, 0.022], [1, 0.029, 0.013]], { cap: 0.8, ring: 20, steps: 12 }, false);
    for (const [j, r] of [["sh", 0.058], ["el", 0.042], ["wr", 0.03], ["kn", 0.063], ["an", 0.04]]) body.push(skin(ellipsoid(P[j + s], r, [1, 1, 1]).geo, rigid(j + s)));
  }
  const bodyGeo = mergeGeometries(body, false);
  bodyGeo.computeVertexNormals();
  const lineGeo = mergeGeometries(lines, false);
  lineGeo.computeVertexNormals();
  return { body: bodyGeo, lines: lineGeo };
}
let GEO = null;
function outlineMaterial(width) {
  const m = new THREE.MeshBasicMaterial({ color: 0x15171a, side: THREE.BackSide });
  m.onBeforeCompile = shader => { shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n  transformed += normalize(normal) * ${width.toFixed(4)};`); };
  return m;
}
function looks(kind) {
  if (kind === "clay") return { body: new THREE.MeshStandardMaterial({ color: 0xf3f2ef, roughness: 0.78, side: THREE.DoubleSide }), lines: new THREE.MeshStandardMaterial({ color: 0x8d939b, roughness: 0.9 }), outline: outlineMaterial(0.0032), background: 0xeceef1 };
  return { body: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), lines: new THREE.MeshBasicMaterial({ color: 0x9a9fa6 }), outline: outlineMaterial(0.0045), background: 0xffffff, edges: true };
}

function buildFigure(figure, prefix, look) {
  const bones = {};
  ORDER.forEach(n => {
    const b = new THREE.Bone();
    b.name = prefix + NAME[n];
    const parent = PARENT[n];
    b.position.copy(parent ? P[n].clone().sub(P[parent]) : P[n].clone());
    bones[n] = b;
    if (parent) bones[parent].add(b);
  });
  GEO = GEO || mannequinGeometry();
  const skeleton = new THREE.Skeleton(ORDER.map(n => bones[n]));
  const mesh = new THREE.SkinnedMesh(GEO.body, look.body);
  mesh.name = prefix + "mannequin";
  mesh.add(bones.root);
  mesh.bind(skeleton);
  const lines = new THREE.SkinnedMesh(GEO.lines, look.lines);
  lines.name = prefix + "construction_lines";
  lines.bind(skeleton, mesh.bindMatrix);
  const outline = new THREE.SkinnedMesh(GEO.body, look.outline);
  outline.name = prefix + "outline";
  outline.bind(skeleton, mesh.bindMatrix);
  [mesh, lines, outline].forEach(m => m.frustumCulled = false);
  for (const n of ORDER) {
    const e = (figure.rot || {})[n];
    if (e) bones[n].quaternion.setFromEuler(new THREE.Euler(e[0] * DEG, (e[1] || 0) * DEG, (e[2] || 0) * DEG, "YZX"));
  }
  const group = new THREE.Group();
  group.name = prefix ? prefix.replace(/_$/, "") : "figure";
  group.add(mesh, lines, outline);
  group.position.set(figure.at ? figure.at[0] : 0, figure.at ? figure.at[2] || 0 : 0, figure.at ? figure.at[1] : 0);
  return { group, mesh, lines, outline, bones };
}
let CONTACT = null;
function contactShapes() {
  if (CONTACT && CONTACT.geo === GEO.body) return CONTACT;
  const pos = GEO.body.attributes.position, si = GEO.body.attributes.skinIndex, sw = GEO.body.attributes.skinWeight;
  const bin = 0.02 * (P.head.y / 1.6);
  const regions = { torso: { bones: ["root", "spine", "chest"], slabs: new Map() }, hipL: { bones: ["hipL"], slabs: new Map() }, hipR: { bones: ["hipR"], slabs: new Map() } };
  for (let i = 0; i < pos.count; i++) {
    let best = 0, boneAt = 0;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > best) { best = w; boneAt = si.getComponent(i, k); } }
    const name = ORDER[boneAt], region = regions.torso.bones.includes(name) ? regions.torso : regions[name];
    if (!region) continue;
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), key = Math.floor(y / bin), slab = region.slabs.get(key);
    if (!slab) region.slabs.set(key, { x0: x, x1: x, z0: z, z1: z });
    else { slab.x0 = Math.min(slab.x0, x); slab.x1 = Math.max(slab.x1, x); slab.z0 = Math.min(slab.z0, z); slab.z1 = Math.max(slab.z1, z); }
  }
  CONTACT = { geo: GEO.body, bin, regions };
  return CONTACT;
}
function bandOf(bone) {
  if (bone === "root") return [-Infinity, P.spine.y];
  if (bone === "spine") return [P.spine.y, P.chest.y];
  if (bone === "chest") return [P.chest.y, P.neck.y];
  const s = bone.slice(-1);
  return [P["kn" + s].y, P["hip" + s].y + 0.03];
}
function penetration(f, point, region, bin) {
  const m = new THREE.Matrix4(), rest = new THREE.Vector3();
  let deepest = null;
  for (const bone of region.bones) {
    m.multiplyMatrices(f.bones[bone].matrixWorld, f.mesh.skeleton.boneInverses[ORDER.indexOf(bone)]).multiply(f.mesh.bindMatrix);
    rest.copy(point).applyMatrix4(m.clone().invert());
    const [low, high] = bandOf(bone);
    if (rest.y < low || rest.y > high) continue;
    const slab = region.slabs.get(Math.floor(rest.y / bin));
    if (!slab) continue;
    const cx = (slab.x0 + slab.x1) / 2, cz = (slab.z0 + slab.z1) / 2, wx = ((slab.x1 - slab.x0) / 2) * 0.9, wz = ((slab.z1 - slab.z0) / 2) * 0.9;
    const dx = rest.x - cx, dz = rest.z - cz, inside = (dx / wx) ** 2 + (dz / wz) ** 2;
    if (inside >= 1) continue;
    const reach = Math.sqrt(inside);
    const dir = reach < 1e-3 ? new THREE.Vector3(Math.sign(rest.x) || 1, 0, 0) : new THREE.Vector3(dx / (wx * wx), 0, dz / (wz * wz)).normalize();
    const depth = reach < 1e-3 ? Math.min(wx, wz) : Math.hypot(dx, dz) * (1 / reach - 1);
    if (!deepest || depth > deepest.depth) deepest = { depth, dir: dir.transformDirection(m) };
  }
  return deepest;
}
function resolveContacts(figs) {
  if (!GEO || !GEO.body.attributes.skinIndex) return false;
  const shapes = contactShapes(), margin = 0.006 * (P.head.y / 1.6);
  let moved = false;
  for (const f of figs) {
    f.group.updateMatrixWorld(true);
    for (const s of ["L", "R"]) {
      for (let round = 0; round < 10; round++) {
        let worst = null;
        for (const [a, b, t] of [["el" + s, "wr" + s, 0.5], ["wr" + s, "wr" + s, 0], ["wr" + s, "ha" + s, 0.5], ["ha" + s, "ha" + s, 0]]) {
          const point = f.bones[a].getWorldPosition(new THREE.Vector3()).lerp(f.bones[b].getWorldPosition(new THREE.Vector3()), t);
          for (const name of ["torso", "hipL", "hipR"]) {
            const hit = penetration(f, point, shapes.regions[name], shapes.bin);
            if (hit && (!worst || hit.depth > worst.depth)) worst = { ...hit, point };
          }
        }
        if (!worst) break;
        const bone = f.bones["sh" + s], pivot = bone.getWorldPosition(new THREE.Vector3());
        const from = worst.point.clone().sub(pivot), to = from.clone().addScaledVector(worst.dir, worst.depth + margin);
        const turn = new THREE.Quaternion().setFromUnitVectors(from.normalize(), to.normalize());
        const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion()), boneQ = bone.getWorldQuaternion(new THREE.Quaternion());
        bone.quaternion.copy(parentQ.invert().multiply(turn.multiply(boneQ)));
        f.group.updateMatrixWorld(true);
        moved = true;
      }
    }
  }
  return moved;
}
function groundFigures(figs) {
  figs.forEach(f => { f.group.updateMatrixWorld(true); f.mesh.skeleton.update(); });
  let low = Infinity;
  figs.forEach(f => { f.mesh.computeBoundingBox(); low = Math.min(low, f.mesh.boundingBox.min.y); });
  figs.forEach(f => { f.bones.root.position.y -= low; f.group.updateMatrixWorld(true); f.mesh.skeleton.update(); });
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function exportGLB(figs, name, onDone, home) {
  const holder = new THREE.Group();
  holder.name = name;
  const tracks = [];
  figs.forEach(f => {
    holder.add(f.group);
    ORDER.forEach(n => {
      const b = f.bones[n];
      tracks.push(new THREE.QuaternionKeyframeTrack(b.name + ".quaternion", [0], b.quaternion.toArray()));
    });
    tracks.push(new THREE.VectorKeyframeTrack(f.bones.root.name + ".position", [0], f.bones.root.position.toArray()));
  });
  const clip = new THREE.AnimationClip(name, -1, tracks);
  figs.forEach(f => f.outline.visible = false);
  const restore = () => figs.forEach(f => { f.outline.visible = true; (home || holder).add(f.group); });
  new GLTFExporter().parse(holder, result => { restore(); onDone(result); }, err => { restore(); alert("Export failed: " + err.message); }, { binary: true, animations: [clip] });
}
function bvhText(fig) {
  const lines = ["HIERARCHY"];
  const values = [];
  const rotOf = n => { const e = (fig.rot || {})[n] || [0, 0, 0]; return [e[1] || 0, e[2] || 0, e[0] || 0]; };
  const fmt = v => (Math.round(v * 10000) / 10000).toFixed(4);
  const walk = (n, depth) => {
    const pad = "  ".repeat(depth);
    const parent = PARENT[n];
    const off = parent ? P[n].clone().sub(P[parent]).multiplyScalar(100) : new THREE.Vector3(0, 0, 0);
    lines.push(`${pad}${parent ? "JOINT" : "ROOT"} ${NAME[n]}`, `${pad}{`, `${pad}  OFFSET ${fmt(off.x)} ${fmt(off.y)} ${fmt(off.z)}`);
    if (!parent) {
      lines.push(`${pad}  CHANNELS 6 Xposition Yposition Zposition Yrotation Zrotation Xrotation`);
      const root = fig.rootPosition;
      values.push(root.x * 100, root.y * 100, root.z * 100, ...rotOf(n));
    } else {
      lines.push(`${pad}  CHANNELS 3 Yrotation Zrotation Xrotation`);
      values.push(...rotOf(n));
    }
    const kids = CHILDREN[n] || [];
    const joints = kids.filter(k => CHILDREN[k]);
    const ends = kids.filter(k => !CHILDREN[k]);
    joints.forEach(k => walk(k, depth + 1));
    ends.forEach(k => { const o = P[k].clone().sub(P[n]).multiplyScalar(100); lines.push(`${pad}  End Site`, `${pad}  {`, `${pad}    OFFSET ${fmt(o.x)} ${fmt(o.y)} ${fmt(o.z)}`, `${pad}  }`); });
    if (!kids.length) lines.push(`${pad}  End Site`, `${pad}  {`, `${pad}    OFFSET 0.0000 ${fmt(HEAD_R * 200)} 0.0000`, `${pad}  }`);
    lines.push(`${pad}}`);
  };
  walk("root", 0);
  lines.push("MOTION", "Frames: 1", "Frame Time: 0.041667", values.map(fmt).join(" "));
  return lines.join("\n") + "\n";
}

let landmarker = null;
async function getLandmarker(status, attempt = 1) {
  if (landmarker) return landmarker;
  try { return await loadLandmarker(status); } catch (err) {
    if (attempt >= 3) throw err;
    status(`The download stalled. Retrying (${attempt + 1} of 3)…`);
    await new Promise(r => setTimeout(r, 1500));
    return getLandmarker(status, attempt + 1);
  }
}
async function loadLandmarker(status) {
  status("Loading the pose detector (about 10 MB, once per visit)…");
  const vision = await import("@mediapipe/tasks-vision");
  const files = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  landmarker = await vision.PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task", delegate: "CPU" },
    runningMode: "IMAGE", numPoses: 2, minPoseDetectionConfidence: 0.2, minPosePresenceConfidence: 0.2,
  });
  return landmarker;
}
function imageCanvas(img) {
  const s = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c;
}
function drawingVariant(src, k, dark) {
  const w = src.width, h = src.height;
  const data = src.getContext("2d").getImageData(0, 0, w, h).data;
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ink[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) < 200 ? 1 : 0;
  const tmp = new Uint8Array(w * h), dil = new Uint8Array(w * h), r = k >> 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let m = 0; for (let d = -r; d <= r && !m; d++) { const xx = x + d; if (xx >= 0 && xx < w && ink[y * w + xx]) m = 1; } tmp[y * w + x] = m; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let m = 0; for (let d = -r; d <= r && !m; d++) { const yy = y + d; if (yy >= 0 && yy < h && tmp[yy * w + x]) m = 1; } dil[y * w + x] = m; }
  const bg = new Uint8Array(w * h), stack = [0];
  bg[0] = 1;
  while (stack.length) { const i = stack.pop(); const x = i % w, y = (i / w) | 0; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && !bg[j] && !dil[j]) { bg[j] = 1; stack.push(j); } }
  const padX = Math.round(w * 0.28), padY = Math.round(h * 0.125);
  const out = document.createElement("canvas");
  out.width = w + 2 * padX; out.height = h + 2 * padY;
  const ctx = out.getContext("2d");
  const back = dark ? [70, 80, 95] : [235, 235, 235], fill = dark ? [214, 170, 140] : [205, 160, 130];
  ctx.fillStyle = `rgb(${back})`; ctx.fillRect(0, 0, out.width, out.height);
  const id = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const c = ink[i] ? [40, 30, 25] : bg[i] ? back : fill; id.data.set([c[0], c[1], c[2], 255], i * 4); }
  ctx.putImageData(id, padX, padY);
  return { canvas: out, map: (x, y) => [(x * out.width - padX) / w, (y * out.height - padY) / h] };
}
function toEntry(result, map) {
  if (!result.worldLandmarks || !result.worldLandmarks.length) return null;
  const figures = result.worldLandmarks.map((world, i) => ({
    world: world.map(p => [p.x, p.y, p.z, p.visibility ?? 1]),
    image: result.landmarks[i].map(p => map ? map(p.x, p.y) : [p.x, p.y]),
  }));
  const visibility = f => f.world.reduce((t, p) => t + p[3], 0) / f.world.length;
  const torso = f => { const c = [11, 12, 23, 24].reduce((t, i) => [t[0] + f.image[i][0] / 4, t[1] + f.image[i][1] / 4], [0, 0]); const size = Math.hypot((f.image[11][0] + f.image[12][0] - f.image[23][0] - f.image[24][0]) / 2, (f.image[11][1] + f.image[12][1] - f.image[23][1] - f.image[24][1]) / 2); return { c, size }; };
  figures.sort((a, b) => visibility(b) - visibility(a));
  for (let i = figures.length - 1; i > 0; i--) {
    const a = torso(figures[i]);
    if (figures.slice(0, i).some(other => { const b = torso(other); return Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) < 0.35 * Math.max(a.size, b.size); })) figures.splice(i, 1);
  }
  figures.sort((a, b) => a.image.reduce((s, q) => s + q[0], 0) - b.image.reduce((s, q) => s + q[0], 0));
  const score = figures.reduce((s, f) => s + f.world.reduce((t, p) => t + p[3], 0) / f.world.length, 0) / figures.length;
  return { found: figures.length, want: figures.length, score, figures };
}
async function detectImage(img, status) {
  const lm = await getLandmarker(status);
  status("Finding the body…");
  const base = imageCanvas(img);
  let best = null;
  const tryOne = (canvas, map, label) => { const e = toEntry(lm.detect(canvas), map); if (e && (!best || e.score > best.score)) best = { ...e, label }; return e && e.score > 0.5; };
  if (tryOne(base, null, "photo")) return best;
  status("No clear body found as a photo. Trying it as a line drawing…");
  for (const [k, dark] of [[5, false], [3, false], [3, true], [5, true]]) {
    await new Promise(r => setTimeout(r, 0));
    const v = drawingVariant(base, k, dark);
    if (tryOne(v.canvas, v.map, "drawing")) break;
  }
  return best;
}

const CSS = `
.r3-ov{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.r3-panel{background:var(--popover,#fff);color:var(--foreground,#111);border-radius:12px;width:min(1180px,100%);height:min(820px,100%);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.r3-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border,#ddd)}
.r3-bar h3{margin:0;font-size:15px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.r3-bar button,.r3-bar label.r3-file{border:0;background:var(--muted,#eee);color:inherit;border-radius:7px;padding:6px 11px;cursor:pointer;font:500 12.5px var(--f,system-ui)}
.r3-bar .pri{background:var(--sel,#0a6cff);color:#fff}
.r3-bar button[aria-pressed="true"]{background:var(--sel,#0a6cff);color:#fff}
.r3-body{flex:1;display:flex;min-height:0}
.r3-ref{width:30%;min-width:180px;border-right:1px solid var(--border,#ddd);display:flex;align-items:center;justify-content:center;background:var(--card,#fff);padding:10px}
.r3-ref img{max-width:100%;max-height:100%;object-fit:contain}
.r3-ref{flex-direction:column;gap:8px;width:40%}
.r3-refimg{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center}
.r3-angles,.r3-steps{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;align-items:center;font-size:12px;color:#555}
.r3-angles button,.r3-steps button{font:inherit;font-size:12px;border:1px solid #d9dce1;background:#fff;color:#1d1d1f;padding:4px 9px;border-radius:6px;cursor:pointer}
.r3-angles button[aria-pressed=true]{background:#0a6cff;border-color:#0a6cff;color:#fff}
.r3-steps span{min-width:70px;text-align:center}
.r3-ref[hidden]{display:none}
.r3-view{flex:1;position:relative;min-width:0;background:linear-gradient(#f4f5f7,#e3e6ea)}
.r3-view canvas{display:block;width:100%;height:100%}
.r3-note{position:absolute;left:12px;bottom:10px;right:250px;font-size:12px;color:#555;pointer-events:none}
.r3-views{position:absolute;right:12px;bottom:8px;display:flex;gap:2px;background:rgba(255,255,255,.92);border:1px solid #d9dce1;border-radius:8px;padding:2px}
.r3-views button{font:inherit;font-size:12px;border:0;background:none;color:#1d1d1f;padding:4px 8px;border-radius:6px;cursor:pointer}
.r3-views button:hover{background:#e8eaee}
.r3-status{padding:40px;text-align:center;color:var(--muted-foreground,#666);margin:auto}
.r3-drop{border:2px dashed var(--border,#ccc);border-radius:12px;margin:auto;padding:40px 30px;text-align:center;max-width:460px;color:var(--muted-foreground,#666)}
.r3-drop.over{border-color:var(--sel,#0a6cff);color:var(--foreground,#111)}
.r3-card{position:absolute;top:12px;width:262px;max-height:calc(100% - 60px);overflow:auto;background:rgba(255,255,255,.96);color:#1d1d1f;border:1px solid #d9dce1;border-radius:10px;padding:10px 12px;font-size:12px;box-shadow:0 6px 24px rgba(0,0,0,.12)}
.r3-card[hidden]{display:none}.r3-pose{left:12px}.r3-side{right:12px}
.r3-card b{font-size:13px}.r3-card p{margin:4px 0 8px;color:#5b6372;line-height:1.4}
.r3-card button{border:0;background:#eceef1;color:#1d1d1f;border-radius:6px;padding:5px 9px;cursor:pointer;font:500 12px var(--f,system-ui)}
.r3-card button.pri{background:#0a6cff;color:#fff}.r3-card button:disabled{opacity:.45;cursor:default}
.r3-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.r3-sel{font-weight:600;margin:6px 0;display:flex;justify-content:space-between;gap:8px}.r3-xyz{font:500 11px ui-monospace,monospace;color:#5b6372}
.r3-slider{display:grid;grid-template-columns:96px 1fr 50px;gap:6px;align-items:center;margin:5px 0}.r3-slider input{width:100%;accent-color:#0a6cff}.r3-slider output{font:11px ui-monospace,monospace;text-align:right;color:#5b6372}
@media (max-width:760px){.r3-ov{padding:0}.r3-panel{border-radius:0;height:100%}
  .r3-bar{padding:8px 10px;gap:6px}.r3-tools{display:flex;gap:6px;order:3;flex:1 1 100%;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.r3-tools::-webkit-scrollbar{display:none}.r3-bar button{flex:none}
  .r3-body{flex-direction:column}.r3-ref{width:auto;height:34%;min-width:0;border-right:0;border-bottom:1px solid var(--border,#ddd);padding:6px;gap:5px}
  .r3-angles button,.r3-steps button{padding:3px 7px}.r3-note{display:none}
  .r3-card{left:8px;right:8px;width:auto;max-height:42%;padding:8px 10px}.r3-card p{display:none}.r3-pose{top:auto;bottom:48px}.r3-side{top:8px}
  .r3-views{right:8px;bottom:6px}}`;
let cleanup = null;
function overlay(title) {
  if (!document.getElementById("r3-style")) { const s = document.createElement("style"); s.id = "r3-style"; s.textContent = CSS; document.head.appendChild(s); }
  close();
  const ov = document.createElement("div");
  ov.className = "r3-ov";
  ov.innerHTML = `<div class="r3-panel" role="dialog" aria-modal="true" aria-label="${title}"><div class="r3-bar"><h3></h3><span class="r3-tools"></span><button data-r3="close">Close</button></div><div class="r3-body"><div class="r3-ref" hidden><img alt="Reference image"></div><div class="r3-view"></div></div></div>`;
  ov.querySelector("h3").textContent = title;
  document.body.appendChild(ov);
  ov.addEventListener("click", e => { if (e.target === ov || e.target.closest('[data-r3="close"]')) close(); });
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  cleanup = () => { document.removeEventListener("keydown", onKey); ov.remove(); };
  return ov;
}
function close() { if (cleanup) { const c = cleanup; cleanup = null; c(); } }
const SIZE_FIELDS = [["height", "Height", 0.8, 1.15], ["head", "Head size", 0.8, 1.25], ["shoulders", "Shoulder width", 0.85, 1.2], ["hips", "Hip width", 0.85, 1.3], ["torso", "Torso length", 0.88, 1.15], ["arms", "Arm length", 0.88, 1.15], ["legs", "Leg length", 0.88, 1.18], ["thickness", "Body thickness", 0.85, 1.25]];
const POSABLE = ORDER.filter(n => CHILDREN[n] || n === "head");
function showRig(ov, opts) {
  const { code, title, imageURL, onSave, onRefit } = opts;
  let figures = opts.figures.map(f => ({ at: f.at ? f.at.slice() : [0, 0], rot: JSON.parse(JSON.stringify(f.rot || {})) }));
  ov.querySelector("h3").textContent = title;
  const ref = ov.querySelector(".r3-ref");
  const images = opts.images || (imageURL ? [{ label: "Image", url: imageURL }] : []);
  let imgAt = Math.max(0, Math.min(opts.imageIndex || 0, images.length - 1)), lookFrom = null;
  if (images.length) {
    ref.hidden = false;
    ref.innerHTML = `<div class="r3-refimg"><img alt="Reference drawing"></div>` +
      (images.length > 1 ? `<div class="r3-angles">${images.map((im, i) => `<button data-i="${i}">${im.label}</button>`).join("")}</div>` : "") +
      (opts.onStep ? `<div class="r3-steps"><button data-s="-1">‹ Previous pose</button><span>${opts.position || ""}</span><button data-s="1">Next pose ›</button></div>` : "");
  }
  const showImage = (i, turn) => {
    if (!images.length) return;
    imgAt = (i + images.length) % images.length;
    ref.querySelector("img").src = images[imgAt].url;
    ref.querySelectorAll(".r3-angles button").forEach((b, k) => b.setAttribute("aria-pressed", k === imgAt));
    if (turn && lookFrom && images[imgAt].yaw != null) lookFrom(images[imgAt].yaw, images[imgAt].pitch);
  };
  const step = dir => opts.onStep && opts.onStep(dir, images[imgAt] && images[imgAt].jp);
  ref.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.i) showImage(+b.dataset.i, true); if (b.dataset.s) step(+b.dataset.s); };
  const onArrow = e => {
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey) step(dir); else showImage(imgAt + dir, true);
  };
  document.addEventListener("keydown", onArrow, true);
  const view = ov.querySelector(".r3-view");
  view.innerHTML = `<div class="r3-note"></div><div class="r3-views"><button data-v="front">Front</button><button data-v="side">Side</button><button data-v="back">Back</button><button data-v="three">¾</button><button data-v="in" aria-label="Zoom in">+</button><button data-v="out" aria-label="Zoom out">−</button></div><div class="r3-card r3-pose" hidden></div><div class="r3-card r3-side" hidden></div>`;
  const noteEl = view.querySelector(".r3-note"), poseEl = view.querySelector(".r3-pose"), sideEl = view.querySelector(".r3-side");
  const baseNote = opts.note || "Drag to orbit · scroll to zoom. The download is rigged with 17 bones, so the pose stays editable in Blender or any glTF tool.";
  noteEl.textContent = baseNote;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  view.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  let look = looks("drawing");
  scene.background = new THREE.Color(look.background);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-3, 2, -2); scene.add(rim);
  const grid = new THREE.GridHelper(6, 24, 0xd0d4da, 0xe6e8eb);
  scene.add(grid);
  const normalTarget = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
  const normalMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  const edgeMat = new THREE.ShaderMaterial({
    uniforms: { tNormal: { value: normalTarget.texture }, tDepth: { value: normalTarget.depthTexture }, texel: { value: new THREE.Vector2(1, 1) }, near: { value: camera.near }, far: { value: camera.far } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tNormal; uniform sampler2D tDepth; uniform vec2 texel; uniform float near; uniform float far; varying vec2 vUv;
      float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
      void main(){
        vec3 n = texture2D(tNormal, vUv).rgb; float d = lin(texture2D(tDepth, vUv).r); float e = 0.0;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          vec2 o = vec2(cos(a), sin(a)) * texel * 1.5;
          vec3 n2 = texture2D(tNormal, vUv + o).rgb; float d2 = lin(texture2D(tDepth, vUv + o).r);
          e = max(e, smoothstep(0.3, 0.55, length(n - n2)));
          e = max(e, smoothstep(0.015, 0.04, abs(d - d2) / max(min(d, d2), 0.001)));
        }
        gl_FragColor = vec4(0.07, 0.07, 0.08, e * 0.92);
      }`,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const edgeScene = new THREE.Scene(), edgeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  edgeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat));
  const drawEdges = () => {
    const hidden = [grid, tc, ...helpers, ...handles.map(h => h.m), ...figs.flatMap(f => [f.lines, f.outline])].filter(o => o.visible);
    hidden.forEach(o => o.visible = false);
    const background = scene.background;
    scene.background = null; scene.overrideMaterial = normalMat;
    renderer.setRenderTarget(normalTarget); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); scene.overrideMaterial = null; scene.background = background;
    hidden.forEach(o => o.visible = true);
    renderer.render(scene, camera);
    renderer.autoClear = false; renderer.render(edgeScene, edgeCam); renderer.autoClear = true;
  };
  const handleGeo = new THREE.SphereGeometry(1, 16, 12);
  const handleMat = new THREE.MeshBasicMaterial({ color: 0x0a6cff, depthTest: false, transparent: true, opacity: 0.9 });
  const handleSel = new THREE.MeshBasicMaterial({ color: 0xff7a1a, depthTest: false });
  let figs = [], helpers = [], handles = [], posing = false, bonesOn = false, meshOn = true, selected = null;
  const tc = new TransformControls(camera, renderer.domElement);
  tc.setMode("rotate"); tc.setSpace("local"); tc.size = 0.75; tc.enabled = false; tc.visible = false;
  scene.add(tc);
  function buildAll() {
    const keepSel = selected ? { fi: selected.fi, n: selected.n } : null;
    tc.detach();
    figs.forEach(f => scene.remove(f.group)); helpers.forEach(h => scene.remove(h)); handles.forEach(h => scene.remove(h.m));
    figs = figures.map((f, i) => buildFigure(f, figures.length > 1 ? "AB"[i] + "_" : "", look));
    figs.forEach(f => { scene.add(f.group); f.mesh.visible = f.lines.visible = f.outline.visible = meshOn; });
    groundFigures(figs);
    if (resolveContacts(figs)) { groundFigures(figs); syncRot(); }
    helpers = figs.map(f => { const h = new THREE.SkeletonHelper(f.group); h.visible = bonesOn; scene.add(h); return h; });
    handles = [];
    figs.forEach((f, fi) => POSABLE.forEach(n => { const m = new THREE.Mesh(handleGeo, handleMat); m.renderOrder = 999; m.visible = posing; m.scale.setScalar(0.017 * (SIZING.height || 1)); scene.add(m); handles.push({ m, fi, n }); }));
    selected = null;
    if (keepSel) select(handles.find(h => h.fi === keepSel.fi && h.n === keepSel.n) || null);
  }
  function syncRot() {
    figs.forEach((f, i) => {
      const rot = {};
      ORDER.forEach(n => { const e = new THREE.Euler().setFromQuaternion(f.bones[n].quaternion, "YZX"); const v = [e.x, e.y, e.z].map(a => Math.round((a / DEG) * 10) / 10); if (v.some(a => Math.abs(a) >= 0.05)) rot[n] = v; });
      figures[i] = { at: figures[i].at, rot };
    });
    renderPosePanel();
  }
  function select(h) {
    selected = h;
    handles.forEach(x => x.m.material = x === h ? handleSel : handleMat);
    if (h) { tc.attach(figs[h.fi].bones[h.n]); tc.enabled = tc.visible = true; } else { tc.detach(); tc.enabled = tc.visible = false; }
    renderPosePanel();
  }
  tc.addEventListener("dragging-changed", e => { controls.enabled = !e.value; if (!e.value) { syncRot(); groundFigures(figs); } });
  tc.addEventListener("objectChange", () => { if (selected) { const e = new THREE.Euler().setFromQuaternion(figs[selected.fi].bones[selected.n].quaternion, "YZX"); const out = poseEl.querySelector(".r3-xyz"); if (out) out.textContent = [e.x, e.y, e.z].map(a => Math.round(a / DEG) + "°").join(" · "); } });
  function renderPosePanel() {
    if (!posing) { poseEl.hidden = true; return; }
    poseEl.hidden = false;
    const label = selected ? `${figs.length > 1 ? "Figure " + "AB"[selected.fi] + " · " : ""}${NAME[selected.n]}` : "No joint selected";
    let xyz = "";
    if (selected) { const e = new THREE.Euler().setFromQuaternion(figs[selected.fi].bones[selected.n].quaternion, "YZX"); xyz = [e.x, e.y, e.z].map(a => Math.round(a / DEG) + "°").join(" · "); }
    poseEl.innerHTML = `<b>Pose</b><p>Click a blue dot to pick a joint, then drag the rings to turn it. Red, green and blue rings turn around X, Y and Z.</p>
      <div class="r3-sel">${label}${selected ? `<span class="r3-xyz">${xyz}</span>` : ""}</div>
      <div class="r3-row"><button data-p="zero"${selected ? "" : " disabled"}>Reset joint</button><button data-p="mirror">Mirror pose</button>${onRefit ? '<button data-p="refit">Re-fit from drawing</button>' : ""}<button data-p="rest">Rest pose</button></div>
      ${onSave ? '<div class="r3-row"><button data-p="save" class="pri">Save pose to library</button></div>' : ""}`;
  }
  poseEl.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.p;
    if (a === "zero" && selected) { figs[selected.fi].bones[selected.n].quaternion.identity(); syncRot(); groundFigures(figs); }
    if (a === "mirror") { figures = figures.map(f => ({ at: [-f.at[0], f.at[1], f.at[2] || 0], rot: RIG.mirrorRot(f.rot) })); buildAll(); }
    if (a === "rest") { figures = figures.map(f => ({ at: f.at, rot: {} })); buildAll(); }
    if (a === "refit" && onRefit) { const n = onRefit(); if (n) { figures = n.map(f => ({ at: f.at.slice(), rot: JSON.parse(JSON.stringify(f.rot)) })); buildAll(); } }
    if (a === "save" && onSave) { onSave(figures.map(f => ({ at: f.at.slice(), rot: JSON.parse(JSON.stringify(f.rot)) }))); b.textContent = "Saved"; }
  };
  function renderSidePanel() {
    if (!BASE_RAW) { sideEl.innerHTML = "<b>Body</b><p>Sizing needs the full mannequin, which could not be loaded.</p>"; return; }
    const shown = effectiveSizing();
    sideEl.innerHTML = `<b>Body</b><p>Changes rebuild the mannequin and keep the pose. Saved in this browser.</p>` +
      (POSE_SIZING ? `<label class="r3-row" style="align-items:center;gap:6px"><input type="checkbox" data-match ${MATCH_DRAWING ? "checked" : ""}> Match the drawing's proportions</label>` : "") +
      SIZE_FIELDS.map(([k, l, mn, mx]) => { const v = shown[k] ?? 1; return `<label class="r3-slider"><span>${l}</span><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="0.01" value="${v}"><output>${k === "height" ? (v * 1.77).toFixed(2) + " m" : Math.round(v * 100) + "%"}</output></label>`; }).join("") +
      `<div class="r3-row"><button data-s="reset">Reset body</button></div>`;
  }
  let sizeTimer = null;
  sideEl.oninput = e => {
    const match = e.target.closest("input[data-match]");
    if (match) { MATCH_DRAWING = match.checked; buildBase(); buildAll(); renderSidePanel(); return; }
    const el = e.target.closest("input[data-k]"); if (!el) return;
    const k = el.dataset.k, v = +el.value;
    if (MATCH_DRAWING && POSE_SIZING) { SIZING = Object.assign({}, effectiveSizing()); MATCH_DRAWING = false; const box = sideEl.querySelector("input[data-match]"); if (box) box.checked = false; }
    el.nextElementSibling.textContent = k === "height" ? (v * 1.77).toFixed(2) + " m" : Math.round(v * 100) + "%";
    SIZING[k] = v;
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(() => { rebuildBase(); buildAll(); }, 180);
  };
  sideEl.onclick = e => { const b = e.target.closest("button[data-s]"); if (!b) return; SIZING = {}; MATCH_DRAWING = true; rebuildBase(); buildAll(); renderSidePanel(); };
  buildAll();
  const box = new THREE.Box3(); figs.forEach(f => { f.mesh.computeBoundingBox(); box.union(f.mesh.boundingBox.clone().applyMatrix4(f.group.matrixWorld)); });
  const centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const dist = Math.max(size.y, size.x, size.z) * 2.4 + 0.6;
  camera.position.set(centre.x + dist * 0.35, centre.y + size.y * 0.15, centre.z + dist);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(centre); controls.enableDamping = true;
  if (opts.framing === "upper") { const chest = figs[0].bones.chest.getWorldPosition(new THREE.Vector3()); const offset = camera.position.clone().sub(controls.target).multiplyScalar(0.55); controls.target.copy(chest); camera.position.copy(chest).add(offset); }
  controls.update();
  lookFrom = (yaw, pitch) => {
    const dist = camera.position.distanceTo(controls.target), y = yaw * DEG, p = (pitch || 0) * DEG;
    camera.position.copy(controls.target).add(new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)).multiplyScalar(dist));
    controls.update();
  };
  showImage(imgAt, true);
  const VIEW_DIR = { front: [0, 0.08, 1], side: [1, 0.08, 0], back: [0, 0.08, -1], three: [0.35, 0.15, 1] };
  view.querySelector(".r3-views").onclick = e => {
    const v = e.target.closest("button")?.dataset.v; if (!v) return;
    const offset = camera.position.clone().sub(controls.target);
    if (v === "in" || v === "out") offset.multiplyScalar(v === "in" ? 0.75 : 1.33);
    else offset.copy(new THREE.Vector3(...VIEW_DIR[v]).normalize().multiplyScalar(offset.length()));
    camera.position.copy(controls.target).add(offset); controls.update();
  };
  const resize = () => { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); const size = renderer.getDrawingBufferSize(new THREE.Vector2()); normalTarget.setSize(size.x, size.y); edgeMat.uniforms.texel.value.set(1 / Math.max(size.x, 1), 1 / Math.max(size.y, 1)); };
  const ro = new ResizeObserver(resize); ro.observe(view); resize();
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!posing || !down || tc.dragging || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(handles.map(h => h.m), false)[0];
    if (hit) select(handles.find(h => h.m === hit.object));
  });
  const tmp = new THREE.Vector3();
  let alive = true;
  const loop = () => {
    if (!alive) return;
    controls.update();
    if (posing) handles.forEach(h => { figs[h.fi].bones[h.n].getWorldPosition(tmp); h.m.position.copy(tmp); });
    if (look.edges && meshOn) drawEdges(); else renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
  const tools = ov.querySelector(".r3-tools");
  tools.innerHTML = `<button data-r3="look" data-look="drawing" aria-pressed="true">Drawing</button><button data-r3="look" data-look="clay" aria-pressed="false">Clay</button><button data-r3="mesh" aria-pressed="true">Mannequin</button><button data-r3="bones" aria-pressed="false">Bones</button><button data-r3="pose" aria-pressed="false">Pose</button><button data-r3="body" aria-pressed="false">Body</button>${images.length ? '<button data-r3="ref" aria-pressed="true">Side by side</button>' : ""}<button data-r3="glb" class="pri">Download .glb</button><button data-r3="bvh">Download .bvh</button>`;
  const name = (code || "pose").replace(/[^\w.-]+/g, "-");
  tools.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.r3, toggle = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); return on; };
    if (a === "look") { look = looks(b.dataset.look); scene.background.set(look.background); figs.forEach(f => { f.mesh.material = look.body; f.lines.material = look.lines; f.outline.material = look.outline; }); tools.querySelectorAll('[data-r3="look"]').forEach(x => x.setAttribute("aria-pressed", x === b)); }
    if (a === "mesh") { meshOn = toggle(); figs.forEach(f => { f.mesh.visible = f.lines.visible = f.outline.visible = meshOn; }); }
    if (a === "bones") { bonesOn = toggle(); helpers.forEach(h => h.visible = bonesOn); }
    if (a === "pose") { posing = toggle(); handles.forEach(h => h.m.visible = posing); if (!posing) select(null); renderPosePanel(); noteEl.textContent = posing ? "Pose mode: click a blue dot, then drag the rings. Orbit still works by dragging empty space." : baseNote; }
    if (a === "ref") { ref.hidden = !toggle(); resize(); }
    if (a === "body") { const on = toggle(); sideEl.hidden = !on; if (on) renderSidePanel(); }
    if (a === "glb") exportGLB(figs, name, buf => download(new Blob([buf], { type: "model/gltf-binary" }), name + ".glb"), scene);
    if (a === "bvh") figs.forEach((f, i) => { const rp = f.bones.root.position.clone().add(f.group.position); download(new Blob([bvhText({ rot: figures[i].rot, rootPosition: rp })], { type: "text/plain" }), name + (figs.length > 1 ? "-" + "AB"[i] : "") + ".bvh"); });
  };
  const prev = cleanup;
  cleanup = () => { alive = false; normalTarget.dispose(); document.removeEventListener("keydown", onArrow, true); ro.disconnect(); tc.dispose(); renderer.dispose(); prev && prev(); };
}

export const RigViewer = {
  async open({ code, title, figures, source, onSave, onRefit, images, imageIndex, onStep, position, framing, proportions }) {
    const ov = overlay(title);
    ov.querySelector(".r3-view").innerHTML = `<div class="r3-status" style="padding-top:120px">Preparing the mannequin…</div>`;
    await ensureBase();
    POSE_SIZING = drawingSizing(proportions);
    buildBase();
    showRig(ov, { code, title: `${code} · ${title}`, figures, onSave, onRefit, images, imageIndex, onStep, position, framing, note: source === "auto" ? "Rig fitted automatically from the drawing. Use Pose to adjust any joint, Body to resize the mannequin. Drag to orbit." : source === "approx" ? "Approximate fit: this drawing was hard to read automatically, so compare it side by side and correct the joints with Pose, then Save pose to library." : source === "stock" ? "This drawing could not be read automatically, so the mannequin starts in a standard pose. Use Pose to match it to the drawing, then Save pose to library." : null });
  },
  fromImage() {
    const ov = overlay("Pose from your image");
    const view = ov.querySelector(".r3-view");
    view.style.display = "flex";
    view.innerHTML = `<div class="r3-drop" id="r3drop"><p style="font-size:15px;color:var(--foreground,#111);font-weight:600;margin:0 0 6px">Drop a photo or a pose drawing here</p><p style="margin:0 0 14px">One or two people, whole body in view. It is read in this browser only; nothing is uploaded.</p><label class="r3-file" style="background:var(--sel,#0a6cff);color:#fff;border-radius:7px;padding:7px 12px;cursor:pointer;display:inline-block">Choose image<input type="file" accept="image/*" hidden></label></div>`;
    const drop = view.querySelector("#r3drop");
    const run = async file => {
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const img = new Image(); img.src = url; await img.decode();
      view.innerHTML = `<div class="r3-status">Starting…</div>`;
      const status = m => { const s = view.querySelector(".r3-status"); if (s) s.textContent = m; };
      try {
        const entry = await detectImage(img, status);
        if (!entry || entry.score < 0.3) { view.innerHTML = `<div class="r3-status">No body could be found in this image. Try one with the whole figure in view and a plain background.</div>`; return; }
        const figures = figuresFromEntry(entry);
        await ensureBase();
        POSE_SIZING = null; buildBase();
        view.style.display = "";
        showRig(ov, { code: (file.name.replace(/\.[^.]+$/, "") || "image") + "-pose", title: `Pose from ${file.name}`, figures, imageURL: url, note: `Read as a ${entry.label}, ${entry.found} ${entry.found > 1 ? "people" : "person"}, confidence ${Math.round(entry.score * 100)}%. Drag to orbit, then download.` });
      } catch (err) { view.innerHTML = `<div class="r3-status">The pose detector could not load or run: ${err.message}. It needs an internet connection the first time.</div>`; }
    };
    drop.querySelector("input").onchange = e => run(e.target.files[0]);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); run(e.dataTransfer.files[0]); };
  },
};
