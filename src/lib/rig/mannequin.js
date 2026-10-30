import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const BASE_BODY_URL = "/assets/base-female.glb";
const JOINT_OF = {
  root: "pelvis", spine: "spine_02", chest: "spine_03", neck: "neck_01", head: "Head",
  shL: "upperarm_l", elL: "lowerarm_l", wrL: "hand_l", haL: "middle_04_leaf_l",
  shR: "upperarm_r", elR: "lowerarm_r", wrR: "hand_r", haR: "middle_04_leaf_r",
  hipL: "thigh_l", knL: "calf_l", anL: "foot_l", toL: "ball_leaf_l",
  hipR: "thigh_r", knR: "calf_r", anR: "foot_r", toR: "ball_leaf_r",
};
const TORSO = ["root", "spine", "chest", "neck"];
function ourBone(name) {
  const side = name.endsWith("_l") ? "L" : name.endsWith("_r") ? "R" : "";
  if (/^(index|middle|ring|pinky|thumb)_/.test(name)) return "wr" + side;
  const table = { root: "root", pelvis: "root", spine_01: "root", spine_02: "spine", spine_03: "chest", clavicle_l: "chest", clavicle_r: "chest", neck_01: "neck", Head: "head", upperarm_l: "shL", upperarm_r: "shR", lowerarm_l: "elL", lowerarm_r: "elR", hand_l: "wrL", hand_r: "wrR", thigh_l: "hipL", thigh_r: "hipR", calf_l: "knL", calf_r: "knR", foot_l: "anL", foot_r: "anR", ball_l: "anL", ball_r: "anR", ball_leaf_l: "anL", ball_leaf_r: "anR" };
  return table[name] || "root";
}
const groupOf = bone => (TORSO.includes(bone) ? "torso" : bone);
function worldRotate(bone, q) {
  const parentQ = new THREE.Quaternion();
  bone.parent.getWorldQuaternion(parentQ);
  const boneQ = new THREE.Quaternion();
  bone.getWorldQuaternion(boneQ);
  bone.quaternion.copy(parentQ.invert().multiply(q.clone().multiply(boneQ)));
  bone.updateMatrixWorld(true);
}
function ellipsoid(centre, r, scale, taper) {
  const geo = new THREE.SphereGeometry(r, 48, 28);
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

export async function loadBaseBody(ORDER) {
  const response = await fetch(BASE_BODY_URL);
  if (!response.ok) throw new Error("base body file not loaded");
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "");
  let body = null;
  gltf.scene.traverse(o => { if (o.isSkinnedMesh && /Superhero/.test(o.name)) body = o; });
  if (!body) throw new Error("no body mesh in the base file");
  gltf.scene.updateMatrixWorld(true);
  const bones = Object.fromEntries(body.skeleton.bones.map(b => [b.name, b]));
  const wp = n => bones[n].getWorldPosition(new THREE.Vector3());
  for (const s of ["l", "r"]) {
    const down = new THREE.Vector3(0, -1, 0);
    for (const [a, b] of [["upperarm_", "lowerarm_"], ["lowerarm_", "hand_"], ["hand_", "middle_04_leaf_"]]) {
      const d = wp(b + s).sub(wp(a + s)).normalize();
      worldRotate(bones[a + s], new THREE.Quaternion().setFromUnitVectors(d, down));
    }
  }
  gltf.scene.updateMatrixWorld(true);
  body.skeleton.update();
  const src = body.geometry, n = src.attributes.position.count;
  const pos = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(src.attributes.position, i); body.applyBoneTransform(i, v); v.applyMatrix4(body.matrixWorld); pos.set([v.x, v.y, v.z], i * 3); }
  const P0 = {};
  for (const node of ORDER) P0[node] = wp(JOINT_OF[node]);
  const weights = new Array(n), dominant = new Array(n);
  for (let i = 0; i < n; i++) {
    const acc = {};
    for (let k = 0; k < 4; k++) { const w = src.attributes.skinWeight.getComponent(i, k); if (!w) continue; const b = ourBone(body.skeleton.bones[src.attributes.skinIndex.getComponent(i, k)].name); acc[b] = (acc[b] || 0) + w; }
    const list = Object.entries(acc).sort((a, b) => b[1] - a[1]);
    weights[i] = list;
    dominant[i] = list[0] ? list[0][0] : "root";
  }
  const index = Uint32Array.from(src.index.array);
  const hb = new THREE.Box3();
  for (let i = 0; i < n; i++) if (dominant[i] === "head") hb.expandByPoint(v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
  return { n, pos, index, weights, dominant, P0, headBox: { centre: hb.getCenter(new THREE.Vector3()), size: hb.getSize(new THREE.Vector3()) } };
}

export const DEFAULT_SIZING = { height: 1, head: 1, shoulders: 1, hips: 1, arms: 1, legs: 1, torso: 1, thickness: 1 };

export function buildMannequin(base, ORDER, sizing) {
  const S = Object.assign({}, DEFAULT_SIZING, sizing || {});
  const { n, P0 } = base;
  const boneIndex = Object.fromEntries(ORDER.map((b, i) => [b, i]));
  const rootY = P0.root.y;
  const torsoY = y => (y > rootY ? rootY + (y - rootY) * S.torso : y);
  const shoulderBand = y => Math.min(1, Math.max(0, (y - (P0.chest.y - 0.1)) / 0.2));
  const hipBand = y => 1 - Math.min(1, Math.max(0, (y - (rootY + 0.02)) / 0.16));
  const P = {};
  for (const k of TORSO.concat(["head"])) P[k] = new THREE.Vector3(P0[k].x, torsoY(P0[k].y), P0[k].z);
  const chain = (names, len) => { for (let i = 1; i < names.length; i++) P[names[i]] = P[names[i - 1]].clone().add(P0[names[i]].clone().sub(P0[names[i - 1]]).multiplyScalar(len)); };
  for (const s of ["L", "R"]) {
    P["sh" + s] = new THREE.Vector3(P0["sh" + s].x * S.shoulders, torsoY(P0["sh" + s].y), P0["sh" + s].z);
    chain(["sh" + s, "el" + s, "wr" + s, "ha" + s], S.arms);
    P["hip" + s] = new THREE.Vector3(P0["hip" + s].x * S.hips, P0["hip" + s].y, P0["hip" + s].z);
    chain(["hip" + s, "kn" + s, "an" + s], S.legs);
    P["to" + s] = P["an" + s].clone().add(P0["to" + s].clone().sub(P0["an" + s]));
  }
  const SEG = {};
  for (const s of ["L", "R"]) {
    SEG["sh" + s] = ["sh" + s, "el" + s, S.arms]; SEG["el" + s] = ["el" + s, "wr" + s, S.arms]; SEG["wr" + s] = ["wr" + s, "ha" + s, S.arms];
    SEG["hip" + s] = ["hip" + s, "kn" + s, S.legs]; SEG["kn" + s] = ["kn" + s, "an" + s, S.legs]; SEG["an" + s] = ["an" + s, "to" + s, 1];
  }
  const q = new THREE.Vector3(), d = new THREE.Vector3(), ax = new THREE.Vector3();
  const SLIM = { wrL: 0.8, wrR: 0.8, anL: 0.88, anR: 0.88, elL: 0.92, elR: 0.92, knL: 0.95, knR: 0.95 };
  const place = (x, y, z, group, out) => {
    if (group === "torso" || group === "head") {
      const sx = 1 + (S.shoulders - 1) * shoulderBand(y) + (S.hips - 1) * hipBand(y);
      const t = 1 + (S.thickness - 1) * 0.5;
      out.set(x * sx * t, torsoY(y), P0.root.z + (z - P0.root.z) * t);
    } else {
      const [a, b, len] = SEG[group];
      ax.copy(P0[b]).sub(P0[a]).normalize();
      d.set(x, y, z).sub(P0[a]);
      const along = d.dot(ax);
      d.addScaledVector(ax, -along);
      out.copy(P[a]).addScaledVector(ax, along * len).addScaledVector(d, S.thickness * (SLIM[group] || 1));
    }
    return out.multiplyScalar(S.height);
  };
  for (const k in P) P[k].multiplyScalar(S.height);

  const pos = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), group = new Array(n), o = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const g = groupOf(base.dominant[i]);
    group[i] = g;
    place(base.pos[i * 3], base.pos[i * 3 + 1], base.pos[i * 3 + 2], g, o);
    pos.set([o.x, o.y, o.z], i * 3);
    const allowed = g === "torso" ? TORSO.concat(["hipL", "hipR"]) : /^hip/.test(g) ? ["root", "spine", g] : null;
    if (allowed) {
      const list = base.weights[i].filter(([b]) => allowed.includes(b));
      const total = list.reduce((s, x) => s + x[1], 0) || 1;
      (list.length ? list : [[g === "torso" ? "root" : g, 1]]).slice(0, 4).forEach(([b, w], k) => { si[i * 4 + k] = boneIndex[b]; sw[i * 4 + k] = w / total; });
    } else { si[i * 4] = boneIndex[g]; sw[i * 4] = 1; }
  }
  const bodyGeo = new THREE.BufferGeometry();
  const rigid = (geo, node) => { const c = geo.attributes.position.count, a = new Uint16Array(c * 4), w = new Float32Array(c * 4); for (let i = 0; i < c; i++) { a[i * 4] = boneIndex[node]; w[i * 4] = 1; } geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(a, 4)); geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(w, 4)); return geo; };

  const hs = base.headBox.size, hc0 = base.headBox.centre, hk = S.head * S.height;
  const headR = Math.max(hs.x * 0.5 * 0.86, hs.z * 0.5 * 0.84) * hk;
  const headCentre = P.head.clone().add(new THREE.Vector3(hc0.x - P0.head.x, (hc0.y - P0.head.y) * 1.04 + hs.y * 0.03, hc0.z - P0.head.z - hs.z * 0.03).multiplyScalar(hk));
  const head = ellipsoid(headCentre, headR, [0.84, (hs.y * 0.5 * hk) / headR, (hs.z * 0.5 * 0.92 * hk) / headR], 0.3);
  const parts = [bodyGeo, rigid(head.geo, "head")];

  const limbRadius = (seg, t, maxR) => {
    const [a, b] = SEG[seg];
    const axis = P[b].clone().sub(P[a]), length = axis.length();
    axis.normalize();
    const at = t * length, list = [];
    for (let i = 0; i < n; i++) {
      if (group[i] !== seg) continue;
      d.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).sub(P[a]);
      const along = d.dot(axis);
      if (Math.abs(along - at) > 0.012 * S.height) continue;
      const radial = d.addScaledVector(axis, -along).length();
      if (radial < maxR * S.height * S.thickness) list.push(radial);
    }
    list.sort((x, y) => x - y);
    return list.length ? list[Math.floor(list.length * 0.55)] : maxR * 0.5 * S.height;
  };
  const jointR = {}, limbR = {};
  const ELONG = { sh: 1, el: 1, wr: 1, kn: 1.3, an: 1.2 };
  const band = (at, radius, height) => {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, false);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), round = 1 - 0.18 * (Math.abs(y) / (height / 2)) ** 2; p.setXYZ(i, p.getX(i) * round + at.x, y + at.y, p.getZ(i) * round + at.z); }
    geo.deleteAttribute("uv"); geo.deleteAttribute("normal");
    return geo;
  };
  for (const s of ["L", "R"]) {
    const spec = [
      ["sh", "sh" + s, 0.1, 0.09, 0.9], ["el", "el" + s, 0.06, 0.07, 0.92], ["wr", "wr" + s, 0.1, 0.05, 0.98],
      ["hip", "hip" + s, 0.12, 0.12, 0.82], ["kn", "kn" + s, 0.06, 0.09, 1.0], ["an", "an" + s, 0.14, 0.06, 0.9],
    ];
    for (const [j, seg, t, maxR, k] of spec) {
      const limb = limbRadius(seg, t, maxR);
      limbR[j] = Math.max(limbR[j] || 0, limb);
      jointR[j] = Math.max(jointR[j] || 0, limb * k);
      const r = limb * k;
      if (j === "hip") continue;
      const at = j === "sh" ? P["sh" + s].clone().add(new THREE.Vector3(0, -r * 0.1, 0)) : P[j + s].clone();
      const side = new THREE.Vector3(s === "L" ? 1 : -1, 0, 0);
      if (j === "wr") parts.push(rigid(band(at, r, limb * 0.55), seg));
      else if (j === "kn") {
        parts.push(rigid(ellipsoid(at.clone().add(new THREE.Vector3(0, 0, limb * 0.28)), r, [0.92, ELONG.kn, 0.78], 0).geo, seg));
        for (const k2 of [1, -1]) parts.push(rigid(ellipsoid(at.clone().addScaledVector(side, k2 * limb * 0.78), limb * 0.42, [0.7, 1, 1], 0).geo, seg));
      } else if (j === "an") {
        parts.push(rigid(ellipsoid(at, r, [1, ELONG.an, 1], 0).geo, seg));
        for (const k2 of [1, -1]) parts.push(rigid(ellipsoid(at.clone().addScaledVector(side, k2 * limb * 0.62).add(new THREE.Vector3(0, -limb * 0.15, 0)), limb * 0.26, [0.6, 1, 1], 0).geo, seg));
      } else parts.push(rigid(ellipsoid(at, r, [1, ELONG[j], 1], 0).geo, seg));
    }
  }
  const BALL = { sh: "sh", el: "el", wr: "wr", kn: "kn", an: "an" };
  const TIP = { sh: 0.6, el: 0.55, wr: 0.32, kn: 0.55, an: 0.5 };
  const DOME = { sh: 0.7, el: 0.8, wr: 0.7, kn: 0.8, an: 0.8 };
  const ends = {};
  for (const s of ["L", "R"]) {
    ends["sh" + s] = ["sh", "el"]; ends["el" + s] = ["el", "wr"]; ends["wr" + s] = ["wr", null];
    ends["hip" + s] = [null, "kn"]; ends["kn" + s] = ["kn", "an"];
  }
  const radialV = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const g = group[i], spec = ends[g];
    if (!spec) continue;
    const [a, b] = SEG[g];
    ax.copy(P[b]).sub(P[a]);
    const length = ax.length();
    ax.normalize();
    d.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).sub(P[a]);
    let along = d.dot(ax);
    radialV.copy(d).addScaledVector(ax, -along);
    let scale = 1;
    for (const [joint, fromStart] of [[spec[0], true], [spec[1], false]]) {
      if (!joint) continue;
      const tip = jointR[BALL[joint]] * TIP[joint] * ELONG[joint], reach = tip + limbR[joint] * DOME[joint];
      const s = fromStart ? along : length - along;
      if (s >= reach) continue;
      const u = Math.max(0, s / reach);
      const s2 = tip + (reach - tip) * u;
      along = fromStart ? s2 : length - s2;
      scale *= Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u)));
    }
    o.copy(P[a]).addScaledVector(ax, along).addScaledVector(radialV, scale);
    pos.set([o.x, o.y, o.z], i * 3);
  }

  const joinable = (x, y) => x === y || (x === "torso" && /^hip/.test(y)) || (y === "torso" && /^hip/.test(x));
  const keep = [];
  for (let t = 0; t < base.index.length; t += 3) {
    const a = base.index[t], b = base.index[t + 1], c = base.index[t + 2];
    if (group[a] === "head" || group[b] === "head" || group[c] === "head") continue;
    if (!joinable(group[a], group[b]) || !joinable(group[b], group[c]) || !joinable(group[a], group[c])) continue;
    keep.push(a, b, c);
  }
  const weld = new Map(), canon = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const key = Math.round(base.pos[i * 3] * 1e5) + "," + Math.round(base.pos[i * 3 + 1] * 1e5) + "," + Math.round(base.pos[i * 3 + 2] * 1e5);
    if (!weld.has(key)) weld.set(key, i);
    canon[i] = weld.get(key);
  }
  const directed = new Map();
  for (let t = 0; t < keep.length; t += 3) for (let e = 0; e < 3; e++) {
    const a = canon[keep[t + e]], b = canon[keep[t + (e + 1) % 3]];
    const k = a + ">" + b;
    directed.set(k, (directed.get(k) || 0) + 1);
  }
  const nextOf = new Map();
  for (const [k, count] of directed) {
    const [a, b] = k.split(">").map(Number);
    if (count !== 1 || directed.has(b + ">" + a)) continue;
    if (!nextOf.has(a)) nextOf.set(a, []);
    nextOf.get(a).push(b);
  }
  const extraPos = [], extraSi = [], extraSw = [];
  for (const start of [...nextOf.keys()]) {
    while (nextOf.get(start) && nextOf.get(start).length) {
      const loop = [start];
      let at = start;
      for (let guard = 0; guard < 4000; guard++) {
        const list = nextOf.get(at);
        if (!list || !list.length) break;
        const next = list.pop();
        if (next === start) { at = start; break; }
        loop.push(next);
        at = next;
      }
      if (at !== start || loop.length < 3) continue;
      const c = new THREE.Vector3();
      for (const v of loop) c.x += pos[v * 3], c.y += pos[v * 3 + 1], c.z += pos[v * 3 + 2];
      c.divideScalar(loop.length);
      const ci = n + extraPos.length / 3;
      extraPos.push(c.x, c.y, c.z);
      for (let m = 0; m < 4; m++) { extraSi.push(si[loop[0] * 4 + m]); extraSw.push(sw[loop[0] * 4 + m]); }
      for (let k = 0; k < loop.length; k++) keep.push(loop[(k + 1) % loop.length], loop[k], ci);
    }
  }
  const total = n + extraPos.length / 3;
  const allPos = new Float32Array(total * 3), allSi = new Uint16Array(total * 4), allSw = new Float32Array(total * 4);
  allPos.set(pos); allPos.set(extraPos, n * 3); allSi.set(si); allSi.set(extraSi, n * 4); allSw.set(sw); allSw.set(extraSw, n * 4);
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
  bodyGeo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(allSi, 4));
  bodyGeo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(allSw, 4));
  bodyGeo.setIndex(keep);
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();

  const probe = new THREE.Mesh(bodyGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster();
  const front = (x, y, allowed) => {
    ray.set(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
    const h = ray.intersectObject(probe, false)[0];
    if (!h || (allowed && ![h.face.a, h.face.b, h.face.c].every(k => k >= n || allowed.includes(group[k])))) return null;
    const corners = [h.face.a, h.face.b, h.face.c], bary = new THREE.Vector3();
    THREE.Triangle.getBarycoord(h.point, ...corners.map(k => new THREE.Vector3(allPos[k * 3], allPos[k * 3 + 1], allPos[k * 3 + 2])), bary);
    const mix = {};
    corners.forEach((k, c) => { for (let m = 0; m < 4; m++) { const w = allSw[k * 4 + m] * bary.getComponent(c); if (w > 0) mix[allSi[k * 4 + m]] = (mix[allSi[k * 4 + m]] || 0) + w; } });
    const skin = Object.entries(mix).sort((x, y) => y[1] - x[1]).slice(0, 4), total = skin.reduce((t, x) => t + x[1], 0) || 1;
    return { p: h.point.clone().addScaledVector(h.face.normal, 0.0016 * S.height), skin: skin.map(([b, w]) => [+b, w / total]) };
  };
  const lineParts = [];
  const tube = (hits, radius = 0.0019) => {
    const list = hits.filter(Boolean);
    if (list.length < 3) return;
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(list.map(h => h.p)), Math.max(12, list.length * 3), radius * S.height, 5, false);
    geo.deleteAttribute("uv"); geo.deleteAttribute("normal");
    const c = geo.attributes.position.count, a = new Uint16Array(c * 4), w = new Float32Array(c * 4), segs = geo.parameters.tubularSegments, radial = geo.parameters.radialSegments;
    for (let i = 0; i < c; i++) {
      const ring = Math.min(segs, Math.floor(i / (radial + 1)));
      const f = (ring / segs) * (list.length - 1), lo = Math.floor(f), hi = Math.min(list.length - 1, lo + 1), t = f - lo, mix = {};
      for (const [b, wt] of list[lo].skin) mix[b] = (mix[b] || 0) + wt * (1 - t);
      for (const [b, wt] of list[hi].skin) mix[b] = (mix[b] || 0) + wt * t;
      Object.entries(mix).sort((x, y) => y[1] - x[1]).slice(0, 4).forEach(([b, wt], m) => { a[i * 4 + m] = +b; w[i * 4 + m] = wt; });
    }
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(a, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(w, 4));
    lineParts.push(geo);
  };
  const T = ["torso"];
  const H = S.height;
  const crotchY = P.hipL.y - 0.07 * H;
  const centre = [];
  for (let y = P.neck.y - 0.03 * H; y > crotchY; y -= 0.012 * H) centre.push(front(0, y, T));
  tube(centre);
  let bustY = P.chest.y, bustZ = -Infinity;
  const bx = 0.075 * H * (1 + (S.shoulders - 1) * 0.5);
  for (let y = P.chest.y - 0.12 * H; y < P.chest.y + 0.12 * H; y += 0.004 * H) { const h = front(bx, y, T); if (h && h.p.z > bustZ) { bustZ = h.p.z; bustY = y; } }
  const bustR = 0.06 * H;
  for (const sx of [1, -1]) {
    const cols = [];
    for (let x = 0.012 * H; x <= 0.16 * H; x += 0.006 * H) {
      let prev = null, best = null, bestDrop = 0.0035 * H;
      for (let y = bustY + 0.02 * H; y > bustY - 0.16 * H; y -= 0.003 * H) {
        const h = front(sx * x, y, T);
        if (!h) { prev = null; continue; }
        if (prev && prev.p.z - h.p.z > bestDrop) { bestDrop = prev.p.z - h.p.z; best = y; }
        prev = h;
      }
      if (best != null) cols.push([x, best]);
    }
    const smooth = cols.map((c, i) => { const near = cols.slice(Math.max(0, i - 1), i + 2); return [c[0], near.reduce((t, q) => t + q[1], 0) / near.length]; });
    tube(smooth.map(([x, y]) => front(sx * x, y, T)));
    const s = sx > 0 ? "L" : "R";
    const band = [];
    const hipX = Math.abs(P["hip" + s].x);
    for (let k = 0; k <= 16; k++) { const f = k / 16, e = (1 - Math.cos(f * Math.PI)) / 2; band.push(front(sx * (hipX + 0.07 * H - (hipX + 0.065 * H) * e), P.hipL.y + 0.07 * H - (P.hipL.y + 0.07 * H - crotchY - 0.025 * H) * f, T)); }
    tube(band.map((h, k) => h || front(sx * (hipX + 0.07 * H - (hipX + 0.065 * H) * ((1 - Math.cos(k / 16 * Math.PI)) / 2)), P.hipL.y + 0.07 * H - (P.hipL.y + 0.07 * H - crotchY - 0.025 * H) * (k / 16), ["torso", "hipL", "hipR"])));
    const axisLine = (seg, t0, t1) => { const [a, b] = SEG[seg]; const pts = []; for (let k = 0; k <= 14; k++) { const t = t0 + (t1 - t0) * k / 14; const p = P[a].clone().lerp(P[b], t); pts.push(front(p.x, p.y, [seg])); } tube(pts, 0.0015); };
    axisLine("hip" + s, 0.14, 0.86);
    axisLine("kn" + s, 0.12, 0.86);
    axisLine("sh" + s, 0.22, 0.84);
    axisLine("el" + s, 0.16, 0.84);
  }
  const headLines = [];
  const meridian = [], eyeLine = [];
  for (let k = 0; k <= 24; k++) meridian.push(head.surface(-0.35 * Math.PI + (k / 24) * 1.27 * Math.PI, 0));
  for (let k = 0; k <= 16; k++) eyeLine.push(head.surface(0.56 * Math.PI, -1.15 + (k / 16) * 2.3));
  for (const pts of [meridian, eyeLine]) { const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.0019 * H, 5, false); g.deleteAttribute("uv"); g.deleteAttribute("normal"); headLines.push(rigid(g, "head")); }
  const lines = mergeGeometries(lineParts.concat(headLines), false);
  lines.computeVertexNormals();
  return { P, geo: { body: merged, lines }, jointR, headR, sizing: S };
}
