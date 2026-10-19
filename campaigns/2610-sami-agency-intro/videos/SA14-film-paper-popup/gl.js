// SA14 · bộ máy WebGL2 tối giản (không three.js): thẻ giấy hai mặt có alpha, hộp, lưới glTF,
// shadow map theo hình cắt (alpha test cả ở pass bóng), DOF tự viết (CoC theo độ sâu, gom xoắn ốc), vignette + ấm.
// Đơn vị: mét. Trục: x phải, y lên, z về phía người xem.

// ---------- ma trận 4x4 (cột-chính) ----------
export const M = {
  id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
  T: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  S: (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
  Rx: a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  Ry: a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  Rz: a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  chain(...ms) { return ms.reduce((a, b) => M.mul(a, b)); },
  persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; },
  ortho(l, r, b, t, n, f) { return [2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]; },
  look(e, c, up = [0, 1, 0]) {
    let z = norm(sub(e, c)), x = norm(cross(up, z)), y = cross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
  },
  xf(m, p) { const x = p[0], y = p[1], z = p[2]; const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w]; },
};
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ---------- shader ----------
const VS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in vec2 aT;
uniform mat4 uVP, uM, uLVP; uniform vec4 uUV;
out vec3 vW; out vec3 vN; out vec2 vT; out vec4 vL;
void main(){ vec4 w = uM*vec4(aP,1.); vW=w.xyz; vN=mat3(uM)*aN; vT=uUV.xy+aT*uUV.zw; vL=uLVP*w; gl_Position=uVP*w; }`;
const FS = `#version 300 es
precision highp float;
in vec3 vW; in vec3 vN; in vec2 vT; in vec4 vL;
uniform sampler2D uTF, uTB, uSh; uniform int uHasB, uHasF; uniform vec3 uBack, uTint, uLD, uLC, uAmb, uSky, uEye, uSpot;
uniform float uAT, uEmi, uSpec, uRecv, uSpotR, uSpotK, uGray, uFade; uniform vec2 uShTex;
out vec4 o;
float shadow(vec3 n){
  vec3 p = vL.xyz/vL.w*.5+.5; if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.) return 1.;
  float b = .0012 + .002*(1.-abs(dot(n,uLD))); float s=0.;
  for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++){ s += step(p.z-b, texture(uSh, p.xy+vec2(i,j)*uShTex*1.6).r); }
  return s/9.;
}
void main(){
  vec4 c; bool fr = gl_FrontFacing;
  if(fr){ c = uHasF==1 ? texture(uTF, vT) : vec4(uBack,1.); }
  else { if(uHasB==1){ c = texture(uTB, vec2(vT.x, 1.-vT.y)); } else { float a = uHasF==1 ? texture(uTF, vT).a : 1.; c = vec4(uBack, a); } }
  if(c.a < uAT) discard;
  c.rgb *= uTint;
  float g = dot(c.rgb, vec3(.3,.55,.15)); c.rgb = mix(c.rgb, vec3(g)*vec3(1.,.985,.96), uGray);
  vec3 n = normalize(vN); if(!fr) n = -n;
  float nl = dot(n, uLD); float dif = max(nl*.8+.2, 0.);                 // wrap: giấy cho ánh sáng tràn nhẹ
  float sh = uRecv > .5 ? mix(1., shadow(n), uRecv) : 1.;
  float spot = 1. - smoothstep(uSpotR*.35, uSpotR, distance(vW.xz, uSpot.xz)) * uSpotK;
  vec3 col = c.rgb * (uAmb + uSky*(n.y*.5+.5)*.35 + uLC*dif*sh*spot);
  if(uSpec > 0.){ vec3 v = normalize(uEye - vW); vec3 h = normalize(v+uLD); col += uLC * pow(max(dot(n,h),0.), 60.) * uSpec * sh * spot; }
  col = mix(col, c.rgb, uEmi);
  col *= uFade;
  o = vec4(col, 1.);
}`;
const DVS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=2) in vec2 aT;
uniform mat4 uLVP, uM; uniform vec4 uUV; out vec2 vT;
void main(){ vT=uUV.xy+aT*uUV.zw; gl_Position=uLVP*uM*vec4(aP,1.); }`;
const DFS = `#version 300 es
precision highp float; in vec2 vT; uniform sampler2D uTF; uniform int uHasF; uniform float uAT; out vec4 o;
void main(){ if(uHasF==1 && texture(uTF,vT).a < uAT) discard; o=vec4(1.); }`;
const PVS = `#version 300 es
out vec2 vU; void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vU=p; gl_Position=vec4(p*2.-1.,0.,1.); }`;
const PFS = `#version 300 es
precision highp float; in vec2 vU;
uniform sampler2D uC, uD; uniform vec2 uPx; uniform float uN, uF, uFocus, uAp, uMax, uVig, uWarm, uExpo, uLift;
out vec4 o;
float lin(float d){ float z = d*2.-1.; return 2.*uN*uF/(uF+uN-z*(uF-uN)); }
float coc(float z){ return clamp(uAp*abs(1./uFocus - 1./z), 0., uMax); }
void main(){
  float zc = lin(texture(uD, vU).r); float cc = coc(zc);
  vec3 acc = texture(uC, vU).rgb; float wsum = 1.;
  if(cc > .6){
    const int N = DOFN; float ga = 2.39996;
    for(int i=1;i<=N;i++){
      float r = sqrt(float(i)/float(N)) * cc; float a = float(i)*ga;
      vec2 uv = vU + vec2(cos(a),sin(a))*r*uPx;
      float zs = lin(texture(uD, uv).r); float cs = coc(zs);
      float w = zs < zc ? smoothstep(r-1., r+1., cs) : smoothstep(r-1., r+1., min(cs, cc*1.2));  // nền xa không tràn lên tiền cảnh nét
      acc += texture(uC, uv).rgb * w; wsum += w;
    }
  } else {
    acc += texture(uC, vU + vec2(.5,.5)*uPx).rgb + texture(uC, vU - vec2(.5,.5)*uPx).rgb + texture(uC, vU + vec2(.5,-.5)*uPx).rgb;
    wsum = 4.;
  }
  vec3 c = acc/wsum * uExpo;
  c = c/(1.+c*.08);
  c = mix(c, c*vec3(1.05,1.0,.92), uWarm);
  c += uLift*vec3(.03,.02,.015);
  vec2 q = vU-.5; c *= 1. - uVig*dot(q,q)*1.6;
  o = vec4(pow(clamp(c,0.,1.), vec3(1./1.0)), 1.);
}`;

function prog(g, vs, fs) {
  const mk = (t, s) => { const h = g.createShader(t); g.shaderSource(h, s); g.compileShader(h); if (!g.getShaderParameter(h, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(h)); return h; };
  const p = g.createProgram(); g.attachShader(p, mk(g.VERTEX_SHADER, vs)); g.attachShader(p, mk(g.FRAGMENT_SHADER, fs)); g.linkProgram(p);
  if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p));
  const U = {}; const n = g.getProgramParameter(p, g.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const a = g.getActiveUniform(p, i); U[a.name] = g.getUniformLocation(p, a.name); }
  return { p, U };
}

export function createGL(canvas, W, H, ss = 1.5, dofN = 40) {
  const g = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, alpha: false });
  if (!g) throw new Error('no webgl2');
  const RW = Math.round(W * ss), RH = Math.round(H * ss);
  const P = prog(g, VS, FS), PD = prog(g, DVS, DFS), PP = prog(g, PVS, PFS.replace('DOFN', String(dofN)));
  // FBO cảnh
  const mkTex = (w, h, ifmt, fmt, type, filt) => { const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t); g.texImage2D(g.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, filt); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, filt);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); return t; };
  const cT = mkTex(RW, RH, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, g.LINEAR), dT = mkTex(RW, RH, g.DEPTH_COMPONENT24, g.DEPTH_COMPONENT, g.UNSIGNED_INT, g.NEAREST);
  const fb = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, fb);
  g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, cT, 0); g.framebufferTexture2D(g.FRAMEBUFFER, g.DEPTH_ATTACHMENT, g.TEXTURE_2D, dT, 0);
  const SHN = 2048, sT = mkTex(SHN, SHN, g.DEPTH_COMPONENT24, g.DEPTH_COMPONENT, g.UNSIGNED_INT, g.NEAREST);
  const sfb = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, sfb); g.framebufferTexture2D(g.FRAMEBUFFER, g.DEPTH_ATTACHMENT, g.TEXTURE_2D, sT, 0);
  g.drawBuffers([g.NONE]); g.readBuffer(g.NONE);
  g.bindFramebuffer(g.FRAMEBUFFER, null);
  const white = g.createTexture(); g.bindTexture(g.TEXTURE_2D, white); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

  // ---------- lưới ----------
  function mesh(pos, nor, uv, idx, dynamic = false) {
    const vao = g.createVertexArray(); g.bindVertexArray(vao);
    const bufs = [pos, nor, uv].map((d, i) => { const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, d instanceof Float32Array ? d : new Float32Array(d), dynamic ? g.DYNAMIC_DRAW : g.STATIC_DRAW);
      g.enableVertexAttribArray(i); g.vertexAttribPointer(i, i === 2 ? 2 : 3, g.FLOAT, false, 0, 0); return b; });
    let ib = null, n = pos.length / 3, itype = 0;
    if (idx) { ib = g.createBuffer(); g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, ib); const arr = idx instanceof Uint32Array || idx instanceof Uint16Array ? idx : new Uint32Array(idx);
      g.bufferData(g.ELEMENT_ARRAY_BUFFER, arr, g.STATIC_DRAW); n = arr.length; itype = arr instanceof Uint16Array ? g.UNSIGNED_SHORT : g.UNSIGNED_INT; }
    g.bindVertexArray(null);
    return { vao, bufs, n, ib, itype, update(p, nn, u) { g.bindBuffer(g.ARRAY_BUFFER, bufs[0]); g.bufferSubData(g.ARRAY_BUFFER, 0, p); if (nn) { g.bindBuffer(g.ARRAY_BUFFER, bufs[1]); g.bufferSubData(g.ARRAY_BUFFER, 0, nn); } if (u) { g.bindBuffer(g.ARRAY_BUFFER, bufs[2]); g.bufferSubData(g.ARRAY_BUFFER, 0, u); } } };
  }
  // thẻ: x∈[-.5,.5], y∈[0,1], pháp tuyến +z
  const quad = mesh([-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], [0, 1, 2, 0, 2, 3]);
  // hộp đơn vị tâm gốc, uv mỗi mặt 0..1
  const box = (() => { const P = [], N = [], T = [], I = [];
    const F = [[[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
    F.forEach(([n, u, v], f) => { const b = f * 4; for (const [a, c, s, t] of [[-1, -1, 0, 1], [1, -1, 1, 1], [1, 1, 1, 0], [-1, 1, 0, 0]]) { P.push((n[0] + u[0] * a + v[0] * c) / 2, (n[1] + u[1] * a + v[1] * c) / 2, (n[2] + u[2] * a + v[2] * c) / 2); N.push(...n); T.push(s, t); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    return mesh(P, N, T, I); })();
  // dải trang cong: NS đoạn theo chiều v
  function strip(NS) {
    const n = (NS + 1) * 2, P = new Float32Array(n * 3), N = new Float32Array(n * 3), T = new Float32Array(n * 2), I = [];
    for (let i = 0; i <= NS; i++) { T.set([0, 1 - i / NS, 1, 1 - i / NS], i * 4); if (i < NS) { const a = i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
    const m = mesh(P, N, T, I, true); m.NS = NS; m.P = P; m.N = N; return m;
  }
  const texCache = new Map();
  function tex(src, opt = {}) {
    if (!src) return null;
    let e = texCache.get(src);
    const ver = src._ver || 0;
    if (e && e.ver === ver) return e.t;
    const t = e ? e.t : g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
    g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    const wrap = opt.repeat || src._repeat ? g.REPEAT : g.CLAMP_TO_EDGE;
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, wrap); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, wrap);
    const ext = g.getExtension('EXT_texture_filter_anisotropic'); if (ext && (src._aniso || 0) > 1) g.texParameterf(g.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, src._aniso);
    texCache.set(src, { t, ver }); return t;
  }

  // ---------- vẽ một khung ----------
  // scene = { items:[{mesh, m, tf, tb, back, tint, at, emi, spec, recv, cast, uv, gray, fade}], cam:{pos,tgt,fov,ap,focus}, light:{dir,col,amb,sky,box}, post }
  function draw(scene) {
    const { cam, light } = scene;
    const asp = W / H, V = M.look(cam.pos, cam.tgt, cam.up || [0, 1, 0]), Pm = M.persp(cam.fov * Math.PI / 180, asp, cam.near || .004, cam.far || 12), VP = M.mul(Pm, V);
    const L = light, ld = norm(L.dir), lc = L.center || [0, .08, .1], LV = M.look([lc[0] + ld[0] * 2, lc[1] + ld[1] * 2, lc[2] + ld[2] * 2], lc, Math.abs(ld[1]) > .95 ? [0, 0, -1] : [0, 1, 0]);
    const hb = L.half || .45, LP = M.ortho(-hb, hb, -hb, hb, .5, 4), LVP = M.mul(LP, LV);
    // pass bóng
    g.bindFramebuffer(g.FRAMEBUFFER, sfb); g.viewport(0, 0, SHN, SHN); g.enable(g.DEPTH_TEST); g.disable(g.CULL_FACE); g.clear(g.DEPTH_BUFFER_BIT);
    g.useProgram(PD.p); g.uniformMatrix4fv(PD.U.uLVP, false, LVP); g.activeTexture(g.TEXTURE0); g.uniform1i(PD.U.uTF, 0);
    const DBG = (typeof window !== 'undefined' && window.__DBG) || '';
    if (!DBG.includes('nosh')) for (const it of scene.items) { if (it.cast === false) continue; const tf = tex(it.tf);
      g.uniformMatrix4fv(PD.U.uM, false, it.m); g.uniform4fv(PD.U.uUV, it.uv || [0, 0, 1, 1]); g.uniform1i(PD.U.uHasF, tf ? 1 : 0); g.uniform1f(PD.U.uAT, it.at ?? .5);
      g.bindTexture(g.TEXTURE_2D, tf || white); drawMesh(it.mesh); }
    // pass cảnh
    g.bindFramebuffer(g.FRAMEBUFFER, fb); g.viewport(0, 0, RW, RH);
    const bg = scene.bg || [.1, .08, .07]; g.clearColor(bg[0], bg[1], bg[2], 1); g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    g.useProgram(P.p); const U = P.U;
    g.uniformMatrix4fv(U.uVP, false, VP); g.uniformMatrix4fv(U.uLVP, false, LVP);
    g.uniform3fv(U.uLD, ld); g.uniform3fv(U.uLC, L.col); g.uniform3fv(U.uAmb, L.amb); g.uniform3fv(U.uSky, L.sky || [0, 0, 0]); g.uniform3fv(U.uEye, cam.pos);
    g.uniform3fv(U.uSpot, L.spot || [0, 0, 0]); g.uniform1f(U.uSpotR, L.spotR || 1); g.uniform1f(U.uSpotK, L.spotK ?? 0);
    g.uniform2f(U.uShTex, 1.2 / SHN, 1.2 / SHN);
    g.uniform1i(U.uTF, 0); g.uniform1i(U.uTB, 1); g.uniform1i(U.uSh, 2);
    g.activeTexture(g.TEXTURE2); g.bindTexture(g.TEXTURE_2D, sT);
    for (const it of scene.items) {
      if (DBG.includes('noitems')) continue;
      if (DBG.includes('noprop') && it.mesh.ib && it.mesh.itype && it.mesh.n > 5000) continue;
      const tf = tex(it.tf), tb = tex(it.tb);
      g.uniformMatrix4fv(U.uM, false, it.m); g.uniform4fv(U.uUV, it.uv || [0, 0, 1, 1]);
      g.uniform1i(U.uHasF, tf ? 1 : 0); g.uniform1i(U.uHasB, tb ? 1 : 0);
      g.uniform3fv(U.uBack, it.back || [.94, .91, .85]); g.uniform3fv(U.uTint, it.tint || [1, 1, 1]);
      g.uniform1f(U.uAT, it.at ?? .5); g.uniform1f(U.uEmi, it.emi || 0); g.uniform1f(U.uSpec, it.spec || 0); g.uniform1f(U.uRecv, it.recv ?? 1);
      g.uniform1f(U.uGray, it.gray || 0); g.uniform1f(U.uFade, it.fade ?? 1);
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, tf || white);
      g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, tb || white);
      drawMesh(it.mesh);
    }
    // hậu kỳ
    g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, W, H); g.disable(g.DEPTH_TEST);
    g.useProgram(PP.p); const Q = PP.U, po = scene.post || {};
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, cT); g.uniform1i(Q.uC, 0);
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, dT); g.uniform1i(Q.uD, 1);
    g.uniform2f(Q.uPx, 1 / RW, 1 / RH); g.uniform1f(Q.uN, cam.near || .004); g.uniform1f(Q.uF, cam.far || 12);
    g.uniform1f(Q.uFocus, cam.focus); g.uniform1f(Q.uAp, cam.ap * RH / 1080); g.uniform1f(Q.uMax, (po.max || 16) * RH / 1080);
    g.uniform1f(Q.uVig, po.vig ?? .55); g.uniform1f(Q.uWarm, po.warm ?? .5); g.uniform1f(Q.uExpo, po.expo ?? 1); g.uniform1f(Q.uLift, po.lift ?? 0);
    if (!DBG.includes('nopost')) g.drawArrays(g.TRIANGLES, 0, 3);
    return { VP, W, H };
  }
  function drawMesh(m) { g.bindVertexArray(m.vao); if (m.ib) g.drawElements(g.TRIANGLES, m.n, m.itype, 0); else g.drawArrays(g.TRIANGLES, 0, m.n); }
  return { g, mesh, quad, box, strip, tex, draw, RW, RH };
}

// ---------- glTF tối giản (Poly Haven: node TRS + mesh, 1 vật liệu) ----------
export async function loadGLTF(R, url) {
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const j = await (await fetch(url)).json();
  const bin = await (await fetch(base + j.buffers[0].uri)).arrayBuffer();
  const acc = i => { const a = j.accessors[i], bv = j.bufferViews[a.bufferView], off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const n = a.count * ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 })[a.type];
    return a.componentType === 5126 ? new Float32Array(bin, off, n) : a.componentType === 5125 ? new Uint32Array(bin, off, n) : new Uint16Array(bin, off, n); };
  const img = async i => { const im = new Image(); im.src = base + j.images[i].uri; await im.decode(); return im; };
  const mat = j.materials[0], diff = await img(j.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source);
  const parts = {};
  for (const nd of j.nodes) {
    if (nd.mesh == null) continue;
    const pr = j.meshes[nd.mesh].primitives[0];
    const m = R.mesh(acc(pr.attributes.POSITION), acc(pr.attributes.NORMAL), acc(pr.attributes.TEXCOORD_0), acc(pr.indices));
    const t = nd.translation || [0, 0, 0], q = nd.rotation || [0, 0, 0, 1], s = nd.scale || [1, 1, 1];
    const [x, y, z, w] = q, rot = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1];
    parts[nd.name] = { mesh: m, local: M.chain(M.T(...t), rot, M.S(...s)), tex: diff, t };
  }
  return parts;
}
