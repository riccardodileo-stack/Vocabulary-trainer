// Generato da sorgente/ricrea.mjs. Modificare i file leggibili in sorgente/.
export function createGorichecoEngine() {
  // Coordinate del modello. X cresce verso destra, Y verso il pavimento.
  const FLOOR = 367;
  const TRAVEL = 425;
  const WALK_END = 1.52;
  const TURN_END = 2.05;
  const GREET_AT = 2.36;
  const IDLE_AT = 3.20;

  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const lerp = (a, b, mix) => a + (b - a) * mix;
  const smooth = (t) => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };
  const between = (t, a, b) => smooth((t - a) / (b - a));

  const LEGS = [
    {
      id: 'frontFar', far: true, hind: false,
      hip: [113, 251], ankle: [103, 349], bones: [63, 63], bend: 1,
      toe: [19, 10, 4],
      windows: [[0.157, 0.289], [0.473, 0.609], [0.818, 0.974]],
      plants: [0.054, 0.381, 0.709, 1],
    },
    {
      id: 'backFar', far: true, hind: true,
      hip: [196, 270], ankle: [194, 351], bones: [56, 53], bend: -1,
      toe: [19, 10, 5],
      windows: [[0.078, 0.207], [0.400, 0.530], [0.744, 0.898]],
      plants: [0, 0.306, 0.627, 1],
    },
    {
      id: 'backNear', far: false, hind: true,
      hip: [222, 273], ankle: [238, 356], bones: [59, 53], bend: -1,
      toe: [21, 12, 4],
      windows: [[0.125, 0.256], [0.442, 0.576], [0.785, 0.942]],
      plants: [0.021, 0.352, 0.674, 1],
    },
    {
      id: 'frontNear', far: false, hind: false,
      hip: [144, 250], ankle: [137, 356], bones: [72, 66], bend: 1,
      toe: [23, 12, 7],
      windows: [[0.021, 0.164], [0.342, 0.481], [0.661, 0.829]],
      plants: [0, 0.245, 0.568, 1],
    },
  ];

  function walkProgress(time) {
    // Velocità costante al centro, con partenza e arresto morbidi.
    const x = clamp(time / WALK_END);
    const easeIn = 0.105;
    const easeOut = 0.16;
    const total = 1 - (easeIn + easeOut) / 2;
    if (x < easeIn) return x * x / (2 * easeIn * total);
    if (x > 1 - easeOut) return 1 - (1 - x) ** 2 / (2 * easeOut * total);
    return (x - easeIn / 2) / total;
  }

  function walkFoot(leg, progress) {
    let plant = leg.plants[0];
    let lift = 0;
    let pitch = 0;
    for (let i = 0; i < leg.windows.length; i += 1) {
      const [takeOff, land] = leg.windows[i];
      if (progress < takeOff) break;
      if (progress < land) {
        const phase = (progress - takeOff) / (land - takeOff);
        plant = lerp(leg.plants[i], leg.plants[i + 1], smooth(phase));
        lift = Math.pow(Math.sin(phase * Math.PI), 1.22) * (leg.hind ? 23 : 29);
        pitch = Math.sin(phase * Math.PI * 2) * 0.23;
        break;
      }
      plant = leg.plants[i + 1];
    }

    // L'ancora è nello spazio della scena. La zampa ha velocità zero a terra,
    // anche durante la decelerazione del busto.
    return [leg.ankle[0] + (progress - plant) * TRAVEL, leg.ankle[1] - lift, pitch];
  }

  function waveFoot(time) {
    const rise = between(time, TURN_END, GREET_AT);
    const lower = between(time, 2.80, 3.16);
    const raised = rise * (1 - lower);
    const wavePhase = (time - GREET_AT) * 18;
    const sway = between(time, GREET_AT, GREET_AT + 0.10)
      * (1 - between(time, 2.72, 2.84));
    return [
      lerp(137, 81, raised) + Math.sin(wavePhase) * 6 * sway,
      lerp(356, 252, raised) - Math.sin(wavePhase + 0.30) * 3.4 * sway,
      -0.73 * raised + Math.sin(wavePhase) * 0.15 * sway,
      raised,
    ];
  }

  function blinkPulse(time, center, width = 0.16) {
    if (time < center - width / 2 || time > center + width / 2) return 0;
    return Math.sin((time - center + width / 2) / width * Math.PI) ** 1.6;
  }

  function idleBlink(time) {
    // Intervalli diversi e un doppio battito occasionale.
    const t = time % 17.4;
    return Math.max(
      blinkPulse(t, 2.12), blinkPulse(t, 5.47), blinkPulse(t, 9.34),
      blinkPulse(t, 9.58, 0.12), blinkPulse(t, 14.08),
    );
  }

  function restingPose(time, still = false) {
    const breath = still ? 0 : Math.sin(time * 1.92);
    return {
      x: 0, bob: breath * 1.15, squash: breath * 0.006, lean: 0,
      yaw: 0.92, tilt: -0.018 + breath * 0.013, crest: breath * 0.018,
      gaze: [0.06, 0], blink: still ? 0 : idleBlink(time),
      smile: 0.28, curious: 0, sleepy: 0,
      tail: still ? 0 : (Math.sin(time * 1.72) * 0.26 + Math.sin(time * 0.68) * 0.12),
      curl: still ? 0 : Math.sin(time * 1.8 - 0.8) * 0.30,
      feet: LEGS.map((leg) => [...leg.ankle, 0, 0]),
    };
  }

  function homeFrame(time) {
    const t = Math.max(0, time);
    if (t >= IDLE_AT) return restingPose(t - IDLE_AT);
    const progress = walkProgress(t);
    const settle = between(t, WALK_END - 0.29, WALK_END + 0.05);
    const stepEnergy = between(t, 0, 0.23) * (1 - settle);
    const beat = progress * Math.PI * 6;
    const turn = between(t, WALK_END + 0.04, TURN_END);
    const wave = waveFoot(t);
    const blend = between(t, 2.83, IDLE_AT);
    const greetSmile = wave[3] * 0.48;

    return {
      x: (1 - progress) * TRAVEL,
      bob: (Math.cos(beat * 2 - 0.5) - 0.22) * 3.6 * stepEnergy
        + Math.sin(turn * Math.PI) * 2.1 - wave[3] * 1.75,
      squash: Math.cos(beat * 2) * 0.014 * stepEnergy - Math.sin(turn * Math.PI) * 0.01,
      lean: -0.018 * stepEnergy + Math.sin(beat + 0.9) * 0.021 * stepEnergy - wave[3] * 0.019,
      yaw: lerp(-0.98 + Math.sin(beat - 0.7) * 0.033 * stepEnergy, 1, turn) - blend * 0.08,
      tilt: -0.018 + Math.sin(beat - 0.4) * 0.061 * stepEnergy
        + Math.sin(turn * Math.PI) * 0.075 + wave[3] * 0.04,
      crest: Math.sin(beat - 1.4) * 0.057 * stepEnergy - Math.sin(turn * Math.PI) * 0.09,
      gaze: [lerp(-0.22, 0.06, turn), Math.sin(beat) * 0.08 * stepEnergy],
      blink: Math.max(blinkPulse(t, 0.83), blinkPulse(t, 1.81, 0.19)),
      smile: lerp(0.20, 0.28, turn) + greetSmile,
      curious: 0,
      sleepy: 0,
      tail: Math.sin(beat * 0.76 - 0.9) * stepEnergy
        + Math.sin((t - WALK_END) * 7.2) * 0.54 * settle * (1 - blend),
      curl: Math.sin(beat * 0.76 - 1.9) * stepEnergy + wave[3] * 0.20,
      feet: t < WALK_END
        ? LEGS.map((leg) => [...walkFoot(leg, progress), 0])
        : [...LEGS.slice(0, 3).map((leg) => [...leg.ankle, 0, 0]), wave],
    };
  }

  function solveLeg(leg, hip, ankle, relaxed = 0) {
    const [x, y] = hip;
    const deltaX = ankle[0] - x;
    const deltaY = ankle[1] - y;
    const rawDistance = Math.hypot(deltaX, deltaY) || 0.001;
    const [upper, lower] = leg.bones;
    const distance = clamp(rawDistance, Math.abs(upper - lower) + 0.01, upper + lower - 0.01);
    const along = (distance ** 2 + upper ** 2 - lower ** 2) / (2 * distance);
    // Una piccola piega a riposo evita l'aspetto a zig-zag di un arto sempre alla massima flessione.
    const apart = Math.sqrt(Math.max(0, upper ** 2 - along ** 2)) * (0.38 + 0.62 * relaxed);
    const ux = deltaX / rawDistance;
    const uy = deltaY / rawDistance;
    return [
      x + ux * along + leg.bend * uy * apart,
      y + uy * along - leg.bend * ux * apart,
    ];
  }

  // Illustrazione vettoriale di Goricheco. Le curve restano editabili nel sorgente.
  const INK = '#173719';
  const EDGE = '#214722';
  const LIME = '#bddf61';
  const HEAD_PIVOT = [127, 214];
  const ART = { left: 22, right: 384, top: -25, floor: FLOOR };

  function linear(ctx, x1, y1, x2, y2, colors) {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    for (const [at, color] of colors) gradient.addColorStop(at, color);
    return gradient;
  }

  function radial(ctx, x, y, rx, colors) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, rx);
    for (const [at, color] of colors) gradient.addColorStop(at, color);
    return gradient;
  }

  function paint(ctx, path, fill, stroke, weight = 2) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(path);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight;
      ctx.stroke(path);
    }
  }

  function ellipse(ctx, [x, y, rx, ry, angle = 0], fill, stroke, weight = 1) {
    if (rx <= 0 || ry <= 0) return;
    const path = new Path2D();
    path.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
    paint(ctx, path, fill, stroke, weight);
  }

  function marks(ctx, spots, fill = LIME) {
    for (const spot of spots) ellipse(ctx, spot, fill);
  }

  const BODY = {
    base: new Path2D('M87 205 C99 191 134 188 150 200 C159 208 156 216 177 217 C209 218 231 227 249 253 C258 265 259 282 248 294 C233 309 209 312 185 309 C156 307 129 302 110 287 C97 277 90 263 91 247 C92 230 92 218 87 205 Z'),
    belly: new Path2D('M91 211 C99 223 112 221 122 216 C120 233 120 251 135 270 C152 291 184 291 211 288 C225 287 237 283 251 276 C252 284 246 296 236 301 C212 313 174 306 155 301 C117 291 94 271 93 247 C94 228 92 222 91 211 Z'),
    bellyLight: new Path2D('M95 219 C105 222 111 221 117 219 C113 243 120 267 143 284 C128 278 119 271 110 260 C102 248 98 233 95 219 Z'),
    backLight: new Path2D('M147 212 C168 222 189 217 212 224 C228 229 238 241 245 251 C224 238 205 230 185 229 C173 228 154 227 147 212 Z'),
    chinShadow: new Path2D('M88 204 C105 198 132 190 151 200 C154 204 155 210 157 214 C145 224 117 238 92 228 C92 218 88 209 88 204 Z'),
    spots: [
      [160, 218.5, 8.5, 3.5, 0.56], [181, 228.4, 8.8, 5.0, 0.25],
      [208.5, 234.0, 10.4, 5.7, 0.39], [193.8, 244.0, 5.3, 3.4, 0.51],
      [225.4, 250.0, 5.8, 2.7, 0.63],
    ],
  };

  function drawBody(ctx) {
    paint(ctx, BODY.base, linear(ctx, 143, 216, 184, 311, [
      [0, '#53834d'], [0.42, '#3e7647'], [0.73, '#31633c'], [1, '#264e2e'],
    ]), EDGE, 2.6);
    paint(ctx, BODY.backLight, linear(ctx, 166, 215, 208, 251, [
      [0, 'rgba(162,197,111,.33)'], [1, 'rgba(139,179,91,0)'],
    ]));
    paint(ctx, BODY.belly, linear(ctx, 101, 228, 185, 319, [
      [0, '#cce77b'], [0.46, '#bdd864'], [0.79, '#a5c458'], [1, '#7ea247'],
    ]));
    paint(ctx, BODY.bellyLight, '#d2e98b');
    marks(ctx, BODY.spots, linear(ctx, 158, 217, 213, 249, [
      [0, '#c5e66b'], [1, '#afd458'],
    ]));
    paint(ctx, BODY.chinShadow, 'rgba(21,57,28,.23)');
    paint(ctx, BODY.base, null, EDGE, 2.1);
  }

  const HEADS = [
    // Profilo, tre quarti e frontale condividono gli stessi punti della silhouette.
    {
      crown: [137,55, 151,52, 158,64, 164,79],
      temple: [171,94, 186,104, 191,122],
      back: [200,147, 194,174, 177,193],
      jaw: [159,211, 128,218, 95,217],
      cheek: [63,217, 48,205, 45,192],
      muzzle: [43,184, 39,184, 32,182],
      nose: [19,178, 22,161, 31,154],
      bridge: [41,147, 42,142, 45,130],
      brow: [52,101, 75,80, 105,70],
      top: [119,65, 126,56, 137,55],
      eye: [84.2, 147.8, 0.921, 1.078, 0.018],
      eyeFar: [55, 149, 0.001, 0.84, -0.1],
      eyeAim: -10.6, farAim: 0, muzzleCenter: 48.8, muzzleY: 182.4, mouthWidth: 28,
      noseX: 37, noseY: 166.2, noseSpread: 11.4, farNostril: 0,
      cheekNear: [92.7,186,21,7.5,-0.43], cheekFar: [47,178,8,6,0],
      cheeks: [[87,189,3.6,4.9,-0.50], [96.5,185.2,4.1,5.4,-0.50]],
      forehead: [[86,89.7,8.2,3.8,-0.44], [126,91.3,13.6,8.9,0.11], [147.5,106.4,8.5,7.3,0.52], [156,124,5.4,6.1,-0.45], [159,140,3.7,4.8,0]],
    },
    {
      crown: [143,57, 157,56, 164,69, 171,83],
      temple: [182,95, 199,108, 207,132],
      back: [220,159, 214,181, 195,198],
      jaw: [172,216, 139,220, 109,219],
      cheek: [78,218, 59,208, 50,193],
      muzzle: [45,183, 47,179, 49,176],
      nose: [43,171, 47,160, 51,153],
      bridge: [57,143, 55,135, 59,124],
      brow: [67,103, 85,86, 107,76],
      top: [123,68, 133,57, 143,57],
      eye: [152.5, 151.5, 1.025, 1.012, 0.072],
      eyeFar: [67.0, 148.0, 0.398, 0.89, 0.12],
      eyeAim: -8.7, farAim: 4, muzzleCenter: 94.0, muzzleY: 185.2, mouthWidth: 45.9,
      noseX: 88, noseY: 171.8, noseSpread: 11.2, farNostril: 0.96,
      cheekNear: [163,185,23.5,9.0,-0.21], cheekFar: [55,176,11.0,7.5,-0.4],
      cheeks: [[156.6,192.6,3.8,4.8,-0.54], [166,188.7,4.6,5.1,-0.67]],
      forehead: [[102,88,8.5,3.8,-0.47], [124,96,11.5,8.5,-0.16], [113.7,112.0,7.2,6.8,-0.44], [108.5,126.4,4.8,5.3,0.38], [168.7,99,8.5,4.0,0.37]],
    },
    {
      crown: [145,57, 160,57, 168,71, 176,84],
      temple: [193,99, 209,110, 219,133],
      back: [233,160, 236,182, 215,199],
      jaw: [193,216, 159,221, 130,220],
      cheek: [101,221, 72,214, 54,199],
      muzzle: [43,190, 41,180, 45,172],
      nose: [47,166, 53,158, 55,147],
      bridge: [56,136, 54,129, 60,117],
      brow: [70,96, 92,85, 115,76],
      top: [129,66, 135,57, 145,57],
      eye: [188.4, 149.9, 1.012, 1.045, 0.103],
      eyeFar: [83.5, 148.7, 0.935, 1.04, -0.095],
      eyeAim: -4.2, farAim: 4.3, muzzleCenter: 134.7, muzzleY: 185.0, mouthWidth: 56.7,
      noseX: 134, noseY: 171.1, noseSpread: 11.2, farNostril: 1,
      cheekNear: [200,187,25,9.5,-0.15], cheekFar: [66.5,181.0,19,9.0,0.28],
      cheeks: [[196,190.3,4.0,5.0,-0.55], [205.7,187.4,4.3,5.3,-0.72]],
      forehead: [[105.9,91.9,8.1,3.8,-0.43], [146.5,92.3,10.6,8.9,-0.10], [143.6,111.7,6.6,6.4,-0.26], [142.1,127.8,4.6,4.5,0.18], [180.6,99,8.5,3.9,0.48]],
    },
  ];

  function morphHead(yaw) {
    const t = clamp(yaw, -1, 1);
    const index = t < 0 ? 0 : 1;
    const mix = t < 0 ? t + 1 : t;
    const a = HEADS[index];
    const b = HEADS[index + 1];
    const interpolate = (from, to) => Array.isArray(from)
      ? from.map((n, i) => interpolate(n, to[i]))
      : lerp(from, to, mix);
    return Object.fromEntries(Object.keys(a).map((key) => [key, interpolate(a[key], b[key])]));
  }

  function headOutline(h) {
    const p = new Path2D();
    p.moveTo(h.top[4], h.top[5]);
    for (const curve of [h.crown, h.temple, h.back, h.jaw, h.cheek, h.muzzle, h.nose, h.bridge, h.brow, h.top]) {
      p.bezierCurveTo(...curve);
    }
    p.closePath();
    return p;
  }

  const LEAF = {
    base: new Path2D('M0 0 C2 -25 15 -53 39 -67 C67 -84 91 -72 107 -58 C120 -47 133 -45 145 -55 C151 -61 154 -58 153 -49 C150 -25 126 -6 101 0 C77 8 57 -5 41 -5 C24 -5 17 6 12 12 C6 10 2 5 0 0 Z'),
    light: new Path2D('M4 -10 C11 -36 27 -59 49 -67 C74 -79 94 -67 111 -55 C125 -45 135 -46 148 -56 C141 -41 120 -28 101 -27 C79 -26 71 -47 50 -41 C34 -36 18 -25 4 -10 Z'),
    shade: new Path2D('M6 2 C19 -20 38 -31 58 -27 C74 -23 87 -14 104 -14 C121 -14 137 -24 147 -37 C143 -17 124 -5 101 0 C77 8 57 -5 41 -5 C24 -5 17 6 12 12 Z'),
    vein: new Path2D('M5 4 C20 -32 57 -56 105 -50 C74 -56 47 -47 31 -37 C17 -27 8 -13 3 -1 Z'),
    branch: new Path2D('M36 -39 C56 -45 80 -39 95 -24 C81 -43 61 -48 47 -45 Z'),
    glint: new Path2D('M7 -19 C15 -44 35 -63 58 -69 C44 -63 30 -52 19 -33 Z'),
  };

  function drawLeaf(ctx, head, pose) {
    ctx.save();
    ctx.translate(head.crown[4] - 10, head.crown[5] + 1);
    ctx.rotate(pose.crest + lerp(-0.002, -0.096, (pose.yaw + 1) / 2));
    ctx.scale(lerp(1.04, 0.92, (pose.yaw + 1) / 2), 1);
    paint(ctx, LEAF.base, linear(ctx, 20, -63, 108, 21, [
      [0, '#d6eb6b'], [0.4, '#c6e253'], [0.73, '#9abd40'], [1, '#668b2c'],
    ]), '#223e15', 2.8);
    paint(ctx, LEAF.light, 'rgba(228,242,125,.39)');
    paint(ctx, LEAF.shade, 'rgba(83,120,38,.26)');
    paint(ctx, LEAF.vein, '#325719');
    paint(ctx, LEAF.branch, 'rgba(58,102,25,.72)');
    paint(ctx, LEAF.glint, 'rgba(239,247,141,.26)');
    ctx.restore();
  }

  function eyeOpening(open) {
    const p = new Path2D();
    p.moveTo(-30, 15);
    p.bezierCurveTo(-34, 15 - 25 * open, -21, 15 - 53 * open, 1.6, 15 - 52 * open);
    p.bezierCurveTo(23, 15 - 53 * open, 35, 15 - 24 * open, 32, 15);
    p.bezierCurveTo(26, 15 + 10.3 * open, 2, 15 + 16.0 * open, -19, 15 + 8.4 * open);
    p.bezierCurveTo(-25, 15 + 6.6 * open, -28, 15 + 3.7 * open, -30, 15);
    p.closePath();
    return p;
  }

  const EYE_HOOD = new Path2D('M-34 12 C-40 -3 -33 -39 -7 -47 C16 -55 37 -35 40 -14 C41 -4 36 7 32 13 C23 -15 11 -25 -5 -25 C-19 -25 -28 -6 -34 12 Z');
  const EYE_HOOD_LIGHT = new Path2D('M-36 5 C-36 -24 -24 -43 -7 -47 C13 -52 28 -40 35 -24 C24 -41 8 -43 -5 -41 C-23 -37 -30 -20 -36 5 Z');

  function drawEye(ctx, anchor, baseAim, pose, colorShift = false) {
    const [x, y, sx, sy, rotation] = anchor;
    if (sx < 0.06) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation - pose.curious * 0.045);
    ctx.scale(sx, sy * (1 + pose.curious * 0.09));
    paint(ctx, EYE_HOOD, linear(ctx, 0, -50, 0, 13, [
      [0, colorShift ? '#63914e' : '#74a256'], [0.43, '#4b8247'], [1, '#3d713d'],
    ]));
    paint(ctx, EYE_HOOD_LIGHT, 'rgba(164,202,107,.32)');

    const open = Math.max(0, (1 - pose.blink) * (1 - pose.sleepy * 0.99));
    if (open > 0.035) {
      const lid = eyeOpening(open);
      ctx.save();
      ctx.clip(lid);
      paint(ctx, lid, linear(ctx, 6, -36, 6, 30, [
        [0, '#e4ddc4'], [0.18, '#faf3e4'], [0.62, '#fff9eb'], [1, '#dedcb0'],
      ]));
      paint(ctx, new Path2D('M-34 4 C-17 -32 6 -40 31 -23 C34 -41 -16 -60 -32 -20 Z'), 'rgba(116,94,73,.23)');
      const ix = baseAim + pose.gaze[0] * (colorShift ? 10 : 12);
      const iy = 0.9 + pose.gaze[1] * 8.0;
      ellipse(ctx, [ix, iy, 23.8, 28.5, -0.05], linear(ctx, ix, iy - 27, ix + 4, iy + 27, [
        [0, '#263f0b'], [0.26, '#56811c'], [0.56, '#83b328'], [0.89, '#c3e44a'], [1, '#d8ec6b'],
      ]), '#233909', 1.7);
      const iris = new Path2D();
      for (let fleck = 0; fleck < 26; fleck += 1) {
        const angle = fleck * Math.PI * 2 / 26;
        const strength = 0.87 + 0.09 * Math.sin(fleck * 4.9);
        iris.moveTo(ix + Math.cos(angle) * 14.1, iy + Math.sin(angle) * 18);
        iris.lineTo(ix + Math.cos(angle) * 23 * strength, iy + Math.sin(angle) * 28 * strength);
      }
      paint(ctx, iris, null, 'rgba(215,240,106,.26)', 0.62);
      ellipse(ctx, [ix - 3.7, iy - 4.2, 16.6, 22.1, 0.05], radial(ctx, ix - 9, iy - 13, 40, [
        [0, '#20390d'], [0.61, '#112509'], [1, '#0c1d08'],
      ]));
      ellipse(ctx, [ix + 4.5, iy - 16.7, 5.9, 6.45, -0.16], '#fffefa');
      ellipse(ctx, [ix + 3.6, iy - 5.1, 2.1, 2.2], '#fffcf1');
      ctx.restore();
      paint(ctx, lid, null, INK, 2.55);
    } else {
      const line = new Path2D('M-29 14 C-15 19 11 26 31 15');
      paint(ctx, line, null, '#214421', 2.6);
      paint(ctx, new Path2D('M-25 11 C-9 15 9 19 24 13'), null, 'rgba(148,180,89,.46)', 1.6);
    }
    ctx.restore();
  }

  function drawMouth(ctx, head, pose) {
    const curious = clamp(pose.curious);
    const x = head.muzzleCenter + curious * 1.8;
    const y = head.muzzleY + curious * 2.2;
    const w = head.mouthWidth * (1 - 0.69 * curious);
    const h = (9.0 + pose.smile * 18.6) * (1 - pose.sleepy * 0.91) + curious * 13;
    const left = x - w * 0.52;
    const right = x + w * 0.52;
    const corner = lerp(-4.3, 0.6, curious);
    const cup = lerp(9.5, -7.8, curious);
    const f = new Path2D();
    f.moveTo(left, y + corner);
    f.bezierCurveTo(x - w * 0.32, y + cup, x + w * 0.31, y + cup, right, y + corner + 0.8);
    if (h > 2.9) {
      f.bezierCurveTo(x + w * 0.27, y + h, x + w * 0.13, y + h * 1.14, x, y + h * 1.15);
      f.bezierCurveTo(x - w * 0.23, y + h * 1.18, x - w * 0.42, y + h * 0.47, left, y + corner);
      f.closePath();
      paint(ctx, f, linear(ctx, x, y, x, y + h, [[0, '#3e211a'], [1, '#813d35']]), '#1b3214', 1.65);
      ctx.save();
      ctx.clip(f);
      ellipse(ctx, [x + w * 0.02, y + h * 0.95, w * 0.34, h * 0.53, -0.1], linear(ctx, x, y + h * 0.1, x, y + h, [
        [0, '#a84c45'], [1, '#ec9483'],
      ]));
      ellipse(ctx, [x + w * 0.10, y + h * 1.07, w * 0.27, h * 0.38, -0.12], 'rgba(251,168,155,.52)');
      ctx.restore();
    } else {
      paint(ctx, f, null, '#244520', 1.85);
    }
    if (curious < 0.5 && pose.sleepy < 0.8) {
      const cap = new Path2D();
      cap.moveTo(right - 1.0, y + corner + 1.2);
      cap.quadraticCurveTo(right + 1.9, y + corner - 2.0, right + 3.1, y + corner + 1.3);
      paint(ctx, cap, null, '#243b1c', 1.65);
    }
  }

  function drawHead(ctx, pose, neck) {
    const head = morphHead(pose.yaw);
    ctx.save();
    ctx.translate(neck[0], neck[1]);
    ctx.rotate(pose.tilt);
    ctx.translate(-HEAD_PIVOT[0], -HEAD_PIVOT[1]);
    drawLeaf(ctx, head, pose);

    const shape = headOutline(head);
    const muzzle = head.muzzleCenter;
    paint(ctx, shape, linear(ctx, 78, 67, 169, 234, [
      [0, '#6b9e63'], [0.22, '#4d8751'], [0.58, '#3e7847'], [0.82, '#3e7546'], [1, '#285935'],
    ]), INK, 2.9);

    ctx.save();
    ctx.clip(shape);
    paint(ctx, shape, radial(ctx, muzzle - 4, 202, 99, [
      [0, '#c7e170'], [0.22, '#b4d264'], [0.49, 'rgba(143,183,87,.77)'],
      [0.76, 'rgba(101,153,76,.31)'], [1, 'rgba(75,132,73,0)'],
    ]));
    const rim = new Path2D();
    rim.moveTo(head.top[4] - 4.8, head.top[5] + 2.0);
    rim.bezierCurveTo(head.top[2], head.top[3] + 2, head.top[0], head.top[1] + 3, head.brow[4], head.brow[5] + 3);
    rim.bezierCurveTo(head.brow[2], head.brow[3] + 4, head.brow[0], head.brow[1] + 6, head.bridge[4] + 3, head.bridge[5] + 9);
    paint(ctx, rim, null, 'rgba(160,204,113,.31)', 3.8);

    const lowerRim = new Path2D();
    lowerRim.moveTo(head.back[4], head.back[5] - 7.3);
    lowerRim.bezierCurveTo(head.jaw[0], head.jaw[1] - 9, head.jaw[2], head.jaw[3] - 5, head.jaw[4], head.jaw[5] - 2);
    lowerRim.bezierCurveTo(head.cheek[0] - 4, head.cheek[1] - 3, head.cheek[2], head.cheek[3] - 3, head.cheek[4], head.cheek[5] - 0.5);
    paint(ctx, lowerRim, null, 'rgba(34,82,40,.46)', 6.3);

    marks(ctx, head.forehead, linear(ctx, 117, 86, 151, 135, [[0, '#c9e872'], [1, '#acd353']]));
    drawEye(ctx, head.eyeFar, head.farAim, pose, true);
    drawEye(ctx, head.eye, head.eyeAim, pose);
    for (const patch of [head.cheekNear, head.cheekFar]) {
      ellipse(ctx, patch, radial(ctx, patch[0] - 1, patch[1] - 3, patch[2] * 1.1, [
        [0, 'rgba(151,189,92,.58)'], [0.53, 'rgba(116,162,81,.23)'], [1, 'rgba(79,138,71,0)'],
      ]));
    }
    marks(ctx, head.cheeks, '#b9d862');
    const farCheek = clamp((pose.yaw + 0.83) / 1.1);
    marks(ctx, [
      [head.cheekFar[0] - 2.5, head.cheekFar[1] + 0.7, 4 * farCheek, 5 * farCheek, 0.48],
      [head.cheekFar[0] + 5.8, head.cheekFar[1] + 3.6, 3.1 * farCheek, 4.3 * farCheek, 0.57],
    ], '#b7d35f');
    ellipse(ctx, [head.noseX + head.noseSpread * head.farNostril, head.noseY + 0.8, 2.07, 2.68, 0.56], '#294b20');
    ellipse(ctx, [head.noseX - head.noseSpread, head.noseY - 0.3, head.farNostril * 1.88, head.farNostril * 2.62, -0.37], '#294b20');
    drawMouth(ctx, head, pose);
    ctx.restore();
    paint(ctx, shape, null, INK, 2.85);
    ctx.restore();
  }

  const CURL = [
    [218, 268, 26], [246, 285, 25], [278, 286, 23.5], [309, 280, 22.5],
    [337, 263, 21.7], [351, 235, 21.2], [351, 208, 20.8], [338, 185, 21],
    [314, 169, 20.7], [285, 165, 19.7], [261, 174, 18.7], [244, 191, 17.7],
    [241, 212, 16.6], [250, 232, 15.6], [270, 245, 13.7], [290, 243, 12.3],
    [305, 230, 11], [307, 213, 9.7], [298, 200, 8.7], [283, 199, 7.8],
    [274, 210, 6.4], [277, 220, 5.0], [285, 224, 3.8], [293, 220, 2.5],
    [295, 214, 1.65], [291, 212, 0.67],
  ];

  function ribbonPoints(centers, side, width = 1, center = 0) {
    return centers.map(([x, y, radius], index) => {
      const [px, py] = centers[Math.max(0, index - 1)];
      const [nx, ny] = centers[Math.min(centers.length - 1, index + 1)];
      const d = Math.hypot(nx - px, ny - py) || 1;
      const length = radius * (side * width + center);
      return [x - (ny - py) / d * length, y + (nx - px) / d * length];
    });
  }

  function traceSmooth(path, points, move) {
    const n = points.length;
    if (move) path.moveTo(...points[0]);
    else path.lineTo(...points[0]);
    for (let index = 0; index < n - 1; index += 1) {
      const [px, py] = points[Math.max(0, index - 1)];
      const [ax, ay] = points[index];
      const [bx, by] = points[index + 1];
      const [nx, ny] = points[Math.min(n - 1, index + 2)];
      path.bezierCurveTo(
        ax + (bx - px) / 6, ay + (by - py) / 6,
        bx - (nx - ax) / 6, by - (ny - ay) / 6, bx, by,
      );
    }
  }

  function ribbon(centers, width = 1, center = 0) {
    const path = new Path2D();
    traceSmooth(path, ribbonPoints(centers, 1, width, center), true);
    traceSmooth(path, ribbonPoints(centers, -1, width, center).reverse(), false);
    path.closePath();
    return path;
  }

  function drawTail(ctx, pose) {
    const points = CURL.map(([x, y, radius], index) => {
      const flex = Math.min(1, index / 5);
      const rotate = pose.tail * 0.085 * flex;
      const localX = x - CURL[0][0];
      const localY = y - CURL[0][1];
      return [
        CURL[0][0] + localX * Math.cos(rotate) - localY * Math.sin(rotate)
          + Math.sin(index * 0.20) * pose.curl * 3.3 * flex,
        CURL[0][1] + localX * Math.sin(rotate) + localY * Math.cos(rotate)
          + Math.sin(index * 0.28 - 0.9) * pose.curl * 5.9 * flex,
        radius,
      ];
    });
    const base = ribbon(points);
    paint(ctx, base, linear(ctx, 285, 144, 311, 309, [
      [0, '#6da15d'], [0.24, '#4b8651'], [0.60, '#3d7645'], [1, '#265433'],
    ]), INK, 2.5);
    paint(ctx, ribbon(points, 0.45, -0.48), linear(ctx, 312, 151, 268, 303, [
      [0, 'rgba(35,93,46,.36)'], [0.6, 'rgba(29,78,39,.41)'], [1, 'rgba(28,73,39,.43)'],
    ]));
    paint(ctx, ribbon(points, 0.27, 0.65), linear(ctx, 326, 158, 282, 308, [
      [0, 'rgba(168,206,120,.30)'], [0.6, 'rgba(123,181,99,.22)'], [1, 'rgba(88,142,76,.15)'],
    ]));
    const glint = new Path2D();
    traceSmooth(glint, ribbonPoints(points.slice(3, 15), 0.93), true);
    paint(ctx, glint, null, 'rgba(149,192,111,.27)', 1.55);

    const outside = ribbonPoints(points, 0.72);
    const indexes = [[4.6, 7.9, 4.3], [5.75, 9.2, 4.5], [7.03, 9.5, 4.9], [8.44, 11.3, 5.4], [9.76, 12.4, 4.9], [11.08, 10.0, 4.4]];
    for (const [i, width, height] of indexes) {
      const lo = Math.floor(i);
      const mix = i - lo;
      const [ax, ay] = outside[lo];
      const [bx, by] = outside[lo + 1];
      const x = lerp(ax, bx, mix);
      const y = lerp(ay, by, mix);
      ellipse(ctx, [x, y, width, height, Math.atan2(by - ay, bx - ax)], linear(ctx, x, y - 5, x, y + 5, [
        [0, '#c5e46b'], [1, '#a9cd53'],
      ]));
    }
  }

  function drawPaw(ctx, foot, leg) {
    const [x, y, pitch, raised] = foot;
    const [radiusX, radiusY, advance] = leg.toe;
    const turn = raised * 0.26;
    ctx.save();
    ctx.translate(x - advance, y - 0.6);
    ctx.rotate(pitch + turn);
    ctx.scale(lerp(1, 0.94, raised), 1 + raised * 0.18);
    const palm = new Path2D();
    palm.moveTo(-radiusX + 1, 3);
    palm.bezierCurveTo(-radiusX + 0.6, -8, -0.39 * radiusX, -0.98 * radiusY, 0, -0.92 * radiusY);
    palm.bezierCurveTo(radiusX * 0.66, -radiusY * 0.89, radiusX + 2.4, -7, radiusX, 3);
    palm.bezierCurveTo(radiusX + 0.4, radiusY * 0.91, radiusX * 0.51, radiusY + 0.9, -0.10 * radiusX, radiusY);
    palm.bezierCurveTo(-0.75 * radiusX, radiusY, -radiusX, radiusY * 0.82, -radiusX + 1, 3);
    paint(ctx, palm, linear(ctx, -3, -10, 4, radiusY, leg.far ? [
      [0, '#487e49'], [1, '#244c2d'],
    ] : [
      [0, '#73a157'], [0.40, '#4f864a'], [1, '#2f6036'],
    ]), EDGE, leg.far ? 1.7 : 2.25);
    for (let toe = 0; toe < 3; toe += 1) {
      const tx = (-0.57 + toe * 0.53) * radiusX;
      const ty = 2.1 + (toe === 1 ? 0.75 : 0);
      const rx = radiusX * (toe === 1 ? 0.383 : 0.30);
      const ry = radiusY * (toe === 1 ? 0.70 : 0.65);
      ellipse(ctx, [tx, ty, rx, ry, 0.17 - toe * 0.14], linear(ctx, tx, ty - ry, tx + 2, ty + ry, leg.far ? [
        [0, '#6a954f'], [0.4, '#538647'], [1, '#31673c'],
      ] : [
        [0, '#9fbd70'], [0.32, '#76a65a'], [0.7, '#578d4a'], [1, '#407542'],
      ]), '#2b5730', 1.2);
      if (raised > 0.05) {
        ctx.save();
        ctx.globalAlpha = raised * 0.77;
        ellipse(ctx, [tx - 0.55, ty + 0.7, rx * 0.49, ry * 0.54, 0.12], '#a7c768');
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawLeg(ctx, leg, hip, foot) {
    const [hx, hy] = hip;
    const [ax, ay, , raised] = foot;
    const [kx, ky] = solveLeg(leg, hip, foot, raised);
    const size = leg.far ? 0.84 : 1;
    const thick = leg.hind ? 25.6 : 19.1;
    const centers = [
      [hx - 1, hy - 20 * size, thick * 0.16 * size],
      [hx, hy - 12 * size, thick * 0.79 * size],
      [lerp(hx, kx, 0.25), lerp(hy, ky, 0.25), thick * size],
      [kx, ky, (leg.hind ? 17.5 : 13.3) * size],
      [lerp(kx, ax, 0.63), lerp(ky, ay, 0.63), 11.7 * size],
      [ax, ay - 1, (leg.hind ? 12.5 : 13.0) * size],
    ];
    const outline = ribbon(centers);
    const line = linear(ctx, hx - thick, hy - 22, ax + 5, ay + 6, [
      [0, leg.far ? '#2d5f38' : '#3a733e'], [0.24, leg.far ? '#285935' : '#31643a'], [1, EDGE],
    ]);
    paint(ctx, outline, linear(ctx, hx - thick - 4, hy - 16, kx + thick + 3, ay, leg.far ? [
      [0, '#4b7844'], [0.32, '#417749'], [0.81, '#295d37'], [1, '#244e32'],
    ] : [
      [0, '#7da562'], [0.2, '#598950'], [0.59, '#44804a'], [1, '#2c5e36'],
    ]), line, leg.far ? 1.75 : 2.15);
    paint(ctx, ribbon(centers, 0.28, 0.64), linear(ctx, hx, hy - 19, ax, ay, [
      [0, 'rgba(163,203,111,.22)'], [0.7, 'rgba(139,176,91,.13)'], [1, 'rgba(94,151,82,.03)'],
    ]));
    if (leg.hind && !leg.far) {
      const turn = Math.atan2(ky - hy, kx - hx) - Math.PI / 2;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(turn);
      marks(ctx, [
        [7.5, 1.0, 5.9, 8.6, -0.36], [11.6, 14.0, 3.1, 5.2, -0.20],
      ], '#b9dc61');
      ctx.restore();
    }
    drawPaw(ctx, foot, leg);
  }

  function createGrain(canvas) {
    const tile = canvas.ownerDocument.createElement('canvas');
    tile.width = 114;
    tile.height = 114;
    const ctx = tile.getContext('2d');
    if (!ctx) return null;
    const pixels = ctx.createImageData(tile.width, tile.height);
    let seed = 912761;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const light = (seed >>> 24) / 255;
      const color = light > 0.51 ? 234 : 22;
      pixels.data[i] = color;
      pixels.data[i + 1] = light > 0.51 ? 246 : 40;
      pixels.data[i + 2] = light > 0.51 ? 188 : 20;
      pixels.data[i + 3] = Math.floor(Math.abs(light - 0.51) * 22);
    }
    ctx.putImageData(pixels, 0, 0);
    return tile;
  }

  function makePainter(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D non disponibile');
    const grainTile = createGrain(canvas);
    const grain = grainTile && ctx.createPattern(grainTile, 'repeat');

    function draw(pose, frame) {
      const { dpr, x, y, scale, shadow } = frame;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (x + pose.x * scale), dpr * y);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (shadow) {
        ctx.save();
        ctx.translate(165, FLOOR + 0.8);
        ctx.scale(1, 0.095);
        ellipse(ctx, [0, 0, 116, 116], radial(ctx, 0, 0, 116, [
          [0, 'rgba(3,21,12,.31)'], [0.54, 'rgba(3,21,12,.19)'], [1, 'rgba(3,21,12,0)'],
        ]));
        ctx.restore();
      }

      // Il busto ha un proprio centro di oscillazione. Zampe e testa
      // ricevono soltanto i rispettivi punti di attacco trasformati.
      const cy = 263;
      const cx = 171;
      const angle = pose.lean;
      const skew = 1 + pose.squash;
      const bodyPoint = ([px, py]) => {
        const dx = px - cx;
        const dy = (py - cy) * skew;
        return [cx + dx * Math.cos(angle) - dy * Math.sin(angle),
          cy + pose.bob + dx * Math.sin(angle) + dy * Math.cos(angle)];
      };
      const body = (render) => {
        ctx.save();
        ctx.translate(cx, cy + pose.bob);
        ctx.rotate(angle);
        ctx.scale(1, skew);
        ctx.translate(-cx, -cy);
        render();
        ctx.restore();
      };
      body(() => drawTail(ctx, pose));
      for (let i = 0; i < 2; i += 1) drawLeg(ctx, LEGS[i], bodyPoint(LEGS[i].hip), pose.feet[i]);
      body(() => drawBody(ctx));
      for (let i = 2; i < LEGS.length; i += 1) drawLeg(ctx, LEGS[i], bodyPoint(LEGS[i].hip), pose.feet[i]);
      drawHead(ctx, pose, bodyPoint(HEAD_PIVOT));

      if (grain) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = grain;
        ctx.fillRect(
          dpr * (x + (pose.x + ART.left - 16) * scale), dpr * (y + (ART.top - 2) * scale),
          dpr * (ART.right - ART.left + 31) * scale, dpr * (FLOOR - ART.top + 19) * scale,
        );
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    return { draw };
  }

  function mountGoricheco(canvas, options = {}) {
    const doc = canvas.ownerDocument;
    const host = doc.defaultView;
    const painter = makePainter(canvas);
    const emit = options.onEvent || (() => {});
    const layout = options.layout || 'home';
    const preview = {
      yaw: 0.92, tilt: 0, tail: 0.45, expression: 'smile', gaze: [0.06, 0], feet: null,
    };
    let previewPose = restingPose(0);
    let settings = { mode: 'hold', active: false, reducedMotion: false, compact: false, edgeInset: 0 };
    let width = 0;
    let height = 0;
    let elapsed = 0;
    let lastTimestamp = null;
    let request = 0;
    let greeted = false;
    let ended = false;
    let ready = false;
    let destroyed = false;
    let blinkAt = -Infinity;
    let waveAt = -Infinity;

    function viewport() {
      const isStudio = layout === 'studio';
      const isTile = settings.mode === 'preview' && !isStudio;
      const drawnWidth = ART.right - ART.left;
      const homeWidth = Math.min(
        width * (settings.compact ? 0.39 : 0.49),
        settings.compact ? 146 : 198,
      );
      const maxWidth = isStudio ? width * 0.54 : isTile ? width * 0.92 : homeWidth;
      const scale = Math.min(
        maxWidth / drawnWidth,
        height * (isStudio ? 0.84 : 0.95) / (FLOOR - ART.top),
      );
      const rightPadding = isStudio ? width * 0.065 : settings.edgeInset + width * 0.006;
      const floor = height * (isStudio ? 0.88 : 0.967);

      return {
        dpr: canvas.width / width,
        x: isTile
          ? (width - drawnWidth * scale) / 2 - ART.left * scale
          : width - rightPadding - ART.right * scale,
        y: floor - ART.floor * scale,
        scale,
        shadow: options.shadow !== false,
      };
    }

    function previewFrame(dt) {
      const base = restingPose(elapsed, settings.reducedMotion);
      const settling = (settings.reducedMotion || !settings.active) ? 1 : 1 - Math.exp(-16 * dt);
      const effectTime = elapsed - waveAt + TURN_END;
      const wave = effectTime < 3.16 && effectTime >= TURN_END && !settings.reducedMotion
        ? waveFoot(effectTime)
        : base.feet[3];
      const blink = settings.reducedMotion ? 0 : Math.max(base.blink, blinkPulse(elapsed - blinkAt, 0.12, 0.21));
      const energy = preview.expression === 'sleepy' ? 0.19 : 1;
      previewPose = {
        ...base,
        yaw: lerp(previewPose.yaw, preview.yaw, settling),
        tilt: lerp(previewPose.tilt, base.tilt + preview.tilt + (preview.expression === 'curious' ? 0.096 : 0), settling),
        smile: lerp(previewPose.smile, (preview.expression === 'curious' ? 0.04 : 0.37) + wave[3] * 0.40, settling),
        curious: lerp(previewPose.curious, preview.expression === 'curious' ? 1 : 0, settling),
        sleepy: lerp(previewPose.sleepy, preview.expression === 'sleepy' ? 1 : 0, settling),
        gaze: base.gaze.map((previous, i) => lerp(previewPose.gaze[i] ?? previous, preview.gaze[i], settling)),
        blink,
        tail: settings.reducedMotion ? 0 : Math.sin(elapsed * 2.5) * preview.tail * energy,
        curl: settings.reducedMotion ? 0 : Math.sin(elapsed * 2.1 - 0.5) * preview.tail * energy,
        feet: LEGS.map((leg, i) => preview.feet?.[leg.id] ?? (i === 3 ? wave : base.feet[i])),
      };
      return previewPose;
    }

    function draw(dt = 0) {
      if (!ready || destroyed || !width || !height) return;
      const { mode, reducedMotion } = settings;
      if (mode === 'hold') {
        const ctx = canvas.getContext('2d');
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const pose = mode === 'preview' ? previewFrame(dt)
        : mode === 'intro' && !reducedMotion ? homeFrame(elapsed)
          : restingPose(reducedMotion ? 0 : elapsed, reducedMotion);
      painter.draw(pose, viewport());

      if (mode === 'intro') {
        if (!greeted && (elapsed >= GREET_AT || reducedMotion)) {
          greeted = true;
          emit('greet');
        }
        if (!ended && (elapsed >= IDLE_AT || reducedMotion)) {
          ended = true;
          emit('idle');
        }
      }
      options.onFrame?.({ mode, elapsed, phase: phaseAt(elapsed, mode, reducedMotion, ended) });
    }

    function canRun() {
      return !destroyed && ready && width > 0 && height > 0 && settings.active && !settings.reducedMotion
        && settings.mode !== 'hold' && !doc.hidden;
    }

    function schedule() {
      if (canRun() && !request) request = host.requestAnimationFrame(tick);
    }

    function stop() {
      if (request) host.cancelAnimationFrame(request);
      request = 0;
      lastTimestamp = null;
    }

    function tick(now) {
      request = 0;
      if (!canRun()) {
        lastTimestamp = null;
        return;
      }
      const dt = lastTimestamp === null ? 0 : clamp((now - lastTimestamp) / 1000, 0, 0.075);
      lastTimestamp = now;
      elapsed += dt;
      draw(dt);
      schedule();
    }

    function resize() {
      if (destroyed) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        width = 0;
        height = 0;
        stop();
        return;
      }
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(Math.max(1, host.devicePixelRatio || 1), 2.5);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      if (!ready) {
        ready = true;
        emit('ready');
      }
      draw();
      schedule();
    }

    function visibilityChanged() {
      if (doc.hidden) stop();
      else schedule();
    }

    const observer = typeof host.ResizeObserver === 'function' ? new host.ResizeObserver(resize) : null;
    observer?.observe(canvas);
    host.addEventListener('resize', resize);
    doc.addEventListener('visibilitychange', visibilityChanged);
    resize();

    return {
      configure(next) {
        const before = settings;
        if (Object.keys(next).every((key) => before[key] === next[key])) return;
        settings = { ...before, ...next };
        if (settings.mode !== before.mode) {
          elapsed = 0;
          blinkAt = -Infinity;
          waveAt = -Infinity;
          greeted = false;
          ended = false;
          stop();
        }
        // Una riduzione del movimento attivata a scena iniziata chiude l'intro.
        if (settings.mode === 'intro' && settings.reducedMotion) elapsed = Math.max(elapsed, IDLE_AT);
        if (!canRun()) stop();
        draw();
        schedule();
      },
      replay() {
        elapsed = 0;
        greeted = false;
        ended = false;
        stop();
        this.configure({ mode: 'intro', active: true });
        if (settings.reducedMotion) elapsed = IDLE_AT;
        draw();
        schedule();
      },
      seek(seconds) {
        if (settings.mode !== 'intro') this.configure({ mode: 'intro' });
        stop();
        settings.active = false;
        elapsed = clamp(seconds, 0, IDLE_AT);
        greeted = elapsed >= GREET_AT;
        ended = elapsed >= IDLE_AT;
        draw();
      },
      section(values) {
        if (typeof values.yaw === 'number' && Number.isFinite(values.yaw)) preview.yaw = clamp(values.yaw, -1, 1);
        if (typeof values.tilt === 'number' && Number.isFinite(values.tilt)) preview.tilt = clamp(values.tilt, -0.18, 0.18);
        if (typeof values.tail === 'number' && Number.isFinite(values.tail)) preview.tail = clamp(values.tail, 0, 1.25);
        if (['smile', 'curious', 'sleepy'].includes(values.expression)) preview.expression = values.expression;
        if (values.gaze?.length === 2 && values.gaze.every(Number.isFinite)) {
          preview.gaze = values.gaze.map((value) => clamp(value, -1, 1));
        }
        if ('feet' in values) {
          preview.feet = Object.fromEntries(LEGS.flatMap((leg) => {
            const target = values.feet?.[leg.id];
            if (!target || target.length !== 4 || !target.every(Number.isFinite)) return [];
            return [[leg.id, [
              clamp(target[0], leg.hip[0] - 100, leg.hip[0] + 100),
              clamp(target[1], leg.hip[1] - 29, leg.ankle[1]),
              clamp(target[2], -1.3, 1.3),
              clamp(target[3]),
            ]]];
          }));
        }
        if (settings.mode === 'preview') {
          if (settings.reducedMotion || !settings.active) draw();
          else schedule();
        }
      },
      perform(action) {
        if (settings.mode !== 'preview' || settings.reducedMotion) return;
        if (action === 'blink') blinkAt = elapsed;
        if (action === 'wave') waveAt = elapsed;
        schedule();
      },
      dispose() {
        destroyed = true;
        stop();
        observer?.disconnect();
        host.removeEventListener('resize', resize);
        doc.removeEventListener('visibilitychange', visibilityChanged);
      },
    };
  }

  function phaseAt(time, mode, still = false, ended = false) {
    if (mode === 'preview') return 'preview';
    if (mode === 'hold') return 'hold';
    if (mode === 'idle' || still || ended || time >= IDLE_AT) return 'idle';
    if (time < WALK_END) return 'walk';
    if (time < TURN_END) return 'turn';
    return 'wave';
  }
  return Object.freeze({
    mount: mountGoricheco,
    timing: Object.freeze({ walk: WALK_END, turn: TURN_END, greeting: GREET_AT, idle: IDLE_AT }),
  });
}
