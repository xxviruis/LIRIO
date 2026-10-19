
const canvas = document.querySelector("#garden");
const ctx = canvas.getContext("2d");

const flowerButton = document.querySelector("#flowerButton");
const letter = document.querySelector("#letter");
const closeLetter = document.querySelector("#closeLetter");

const W = 240;
const H = 180;

const background = document.createElement("canvas");
background.width = W;
background.height = H;
const bg = background.getContext("2d");

const flowerLayer = document.createElement("canvas");
flowerLayer.width = W;
flowerLayer.height = H;
const fl = flowerLayer.getContext("2d");

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let drawnCount = 0;

const pixels = [];
const fireflies = [];
const magicParticles = [];
const grassBlades = [];

const clouds = [
  { x: 12, y: 39, w: 13, speed: 0.7 },
  { x: 92, y: 26, w: 10, speed: 0.45 },
  { x: 190, y: 46, w: 12, speed: 0.6 }
];

let shootingStar = null;
let nextShootingStar =
  performance.now() + 12000 + Math.random() * 8000;

const PAL = {
  stemLight: "#91bd78",
  stem: "#47764a",
  stemDark: "#294b34",

  leafLight: "#7fac65",
  leaf: "#426f43",
  leafDark: "#2b5035",
  leafEdge: "#1d3828",
  rib: "#689454",

  pedicel: "#70965a",
  shadow: "#172c24"
};

const BELL_COLORS = {
  H: "#ffffff",
  W: "#fff9ed",
  Y: "#edf2ff",
  w: "#cbd4e8",
  V: "#929dbb"
};

const BELL = [
  "...H...",
  "..HWW..",
  ".HWWYw.",
  ".WYYYYw",
  "WYYYYYw",
  ".WYYYw.",
  "..wVw.."
];

const BELL_SMALL = [
  "..H..",
  ".HWW.",
  "HWWYw",
  "WYYYw",
  ".wVw."
];

const BUD = [
  "..H..",
  ".HWW.",
  "HWWYw",
  ".HYYw",
  "..wV."
];

const flowerMap = new Map();
const bellPixels = [];
const flowerParts = new Map();
let currentFlowerPart = "base";

// ==================================================
// FONDO: CIELO, LUNA, MONTAÑAS Y PRADERA
// ==================================================

function buildBackground() {
  // Generador con semilla: el paisaje queda igual en cada recarga
  let seed = 20240611;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Cielo azul oscuro de medianoche
  const sky = bg.createLinearGradient(0, 0, 0, H);

  sky.addColorStop(0, "#080f25");
  sky.addColorStop(0.35, "#151e3d");
  sky.addColorStop(0.65, "#252d4a");
  sky.addColorStop(1, "#354858");

  bg.fillStyle = sky;
  bg.fillRect(0, 0, W, H);

  // Luna pixelada fija
  bg.fillStyle = "#d5e3ff";
  bg.fillRect(169, 20, 17, 17);
  bg.fillRect(165, 24, 25, 9);

  bg.fillStyle = "#f5f7ff";
  bg.fillRect(172, 22, 11, 12);

  bg.fillStyle = "#c2d4f4";
  bg.fillRect(180, 25, 3, 3);
  bg.fillRect(174, 30, 3, 2);

  // Montañas lejanas
  bg.fillStyle = "#303451";
  bg.beginPath();
  bg.moveTo(0, 99);

  for (let x = 0; x <= W; x += 4) {
    bg.lineTo(
      x,
      87 +
        Math.sin(x * 0.055) * 7 +
        Math.sin(x * 0.12) * 3
    );
  }

  bg.lineTo(W, 127);
  bg.lineTo(0, 127);
  bg.closePath();
  bg.fill();

  // Montañas cercanas
  bg.fillStyle = "#202940";
  bg.beginPath();
  bg.moveTo(0, 108);

  for (let x = 0; x <= W; x += 4) {
    bg.lineTo(
      x,
      100 +
        Math.sin(x * 0.04 + 2) * 8 +
        Math.sin(x * 0.095) * 3
    );
  }

  bg.lineTo(W, 135);
  bg.lineTo(0, 135);
  bg.closePath();
  bg.fill();

  // Árboles pequeños en las colinas lejanas
  function distantTree(x, y, size = 1) {
    bg.fillStyle = "#172638";
    bg.fillRect(
      x + 2 * size,
      y,
      size,
      7 * size
    );

    bg.fillStyle = "#1b303b";
    bg.fillRect(
      x,
      y + 2 * size,
      5 * size,
      3 * size
    );

    bg.fillRect(
      x + size,
      y,
      3 * size,
      4 * size
    );

    bg.fillRect(
      x + 2 * size,
      y - 2 * size,
      size,
      3 * size
    );
  }

  distantTree(17, 101);
  distantTree(42, 106);
  distantTree(66, 100);
  distantTree(178, 105);
  distantTree(204, 99);
  distantTree(226, 108);

  // Colinas: un verde azulado muy oscuro, con un filo de luz de luna
  bg.fillStyle = "#223638";
  bg.beginPath();
  bg.moveTo(0, 120);

  for (let x = 0; x <= W; x += 4) {
    bg.lineTo(
      x,
      116 + Math.sin(x * 0.045) * 5
    );
  }

  bg.lineTo(W, 145);
  bg.lineTo(0, 145);
  bg.closePath();
  bg.fill();

  bg.fillStyle = "#3a5658";
  for (let x = 0; x < W; x += 2) {
    const y = Math.round(116 + Math.sin(x * 0.045) * 5);
    if (x > 90) bg.fillRect(x, y, 2, 1);
  }

  // ---------- SUELO ----------
  // El suelo es un solo degradado con grano (sin franjas): más claro y azulado
  // a lo lejos por la neblina, más oscuro y verde cerca de la cámara,
  // y con un charco de luz de luna a la derecha, de donde cae la luz.
  const groundEdge = x =>
    127 + Math.sin(x * 0.031 + 1.2) * 3 + Math.sin(x * 0.083) * 1.5;

  const moonLit = (x, y) =>
    Math.exp(-(((x - 158) / 80) ** 2 + ((y - 152) / 28) ** 2));

  const groundPal = [
    "#3a5858", // neblina lejana
    "#35554a",
    "#304f3a",
    "#2a4631",
    "#233b27",
    "#1b2e1f",
    "#131f16"  // primer plano
  ];
  const n = groundPal.length;

  let groundNoise = [];

  for (let x = 0; x < W; x++) {
    // grano de 2px de ancho: parece pasto, no ruido de televisión
    if (x % 2 === 0) {
      groundNoise = Array.from({ length: H }, () => rnd());
    }

    const top = Math.round(groundEdge(x));

    for (let y = top; y < H; y++) {
      const t = clamp((y - 124) / 56, 0, 1);
      const patch =
        Math.sin(x * 0.07 + Math.sin(y * 0.11) * 1.7) *
        Math.sin(y * 0.19 + x * 0.03);

      const pos = clamp(
        Math.pow(t, 0.8) * (n - 1) - moonLit(x, y) * 1.1 + patch * 0.45,
        0,
        n - 1
      );

      const base = Math.floor(pos);
      const idx =
        base < n - 1 && pos - base > groundNoise[y] ? base + 1 : base;

      bg.fillStyle = groundPal[idx];
      bg.fillRect(x, y, 1, 1);
    }
  }

  // Filo del terreno iluminado por la luna
  for (let x = 0; x < W; x++) {
    const top = Math.round(groundEdge(x));
    const lit = moonLit(x, top);

    bg.fillStyle = lit > 0.25 ? "#587d78" : "#44655f";
    bg.fillRect(x, top, 1, 1);
  }

  // Neblina baja en el horizonte
  const haze = bg.createLinearGradient(0, 122, 0, 146);
  haze.addColorStop(0, "rgba(120,150,185,0)");
  haze.addColorStop(0.45, "rgba(120,150,185,0.17)");
  haze.addColorStop(1, "rgba(120,150,185,0)");
  bg.fillStyle = haze;
  bg.fillRect(0, 122, W, 24);

  // Manchas de sombra en el pasto (rompen la uniformidad)
  for (let i = 0; i < 16; i++) {
    const cx = rnd() * W;
    const cy = 140 + rnd() * 36;
    const rx = 6 + rnd() * 9;
    const ry = 1.5 + rnd() * 2;

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
        if ((dx / rx) ** 2 + (dy / ry) ** 2 <= 1 && rnd() < 0.75) {
          bg.fillStyle = "rgba(4,12,10,0.22)";
          bg.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
        }
      }
    }
  }

  // Destellos de luna sobre el pasto
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * W);
    const y = 134 + Math.floor(rnd() * 38);

    if (rnd() < moonLit(x, y) * 1.3) {
      bg.fillStyle = "rgba(175,205,240,0.2)";
      bg.fillRect(x, y, 2, 1);
    }
  }

  // Matas de pasto: más altas y numerosas cerca de la cámara,
  // con la punta más clara donde pega la luna
  const bladeBody = ["#1d3824", "#23422b", "#1a3120"];
  const bladeTip = ["#2c4f36", "#3a6045", "#4f7a60"];
  const tufts = [];

  for (let i = 0; i < 280; i++) {
    const x = Math.floor(rnd() * W);
    const depth = Math.pow(rnd(), 0.8);
    const y = Math.floor(132 + depth * 46);

    if (y < groundEdge(x) + 3) continue;

    tufts.push({ x, y, depth, r: rnd(), r2: rnd() });
  }

  tufts.sort((a, b) => a.y - b.y);

  tufts.forEach(({ x, y, depth, r, r2 }) => {
    const lit = clamp(moonLit(x, y) * 1.4 + r * 0.35, 0, 1);
    const h = 1 + Math.floor(depth * 3 + r2 * 2);
    const blades = 1 + Math.floor(r * 3);
    const lean = r2 < 0.5 ? -1 : 1;

    for (let b = 0; b < blades; b++) {
      const bx = x + b * 2 - 1;
      const bh = Math.max(1, b === 1 ? h : h - 1);

      for (let k = 0; k < bh; k++) {
        bg.fillStyle =
          k === bh - 1
            ? bladeTip[Math.min(2, Math.floor(lit * 3))]
            : bladeBody[(k + b) % 3];
        bg.fillRect(bx + (k >= 2 ? lean : 0), y - k, 1, 1);
      }
    }
  });

  // Florecitas del campo, en grupos pequeños y lejos de la flor principal
  const flowerColors = ["#d9c9ff", "#f5d6ed", "#a8d9e8"];

  for (let c = 0; c < 9; c++) {
    const cx = 8 + rnd() * 224;
    const cy = 138 + rnd() * 32;
    const color = flowerColors[Math.floor(rnd() * flowerColors.length)];
    const count = 2 + Math.floor(rnd() * 3);

    for (let k = 0; k < count; k++) {
      const x = Math.round(cx + (rnd() - 0.5) * 16);
      const y = Math.round(cy + (rnd() - 0.5) * 7);

      if (x > 98 && x < 142 && y < 152) continue;

      if (y < 146) {
        // lejos: solo un punto
        bg.fillStyle = color;
        bg.fillRect(x, y, 1, 1);
      } else {
        // cerca: tallito, pétalos y centro
        bg.fillStyle = "#2f5d44";
        bg.fillRect(x, y + 2, 1, 2);

        bg.fillStyle = color;
        bg.fillRect(x, y, 2, 2);

        bg.fillStyle = "#ffffff";
        bg.fillRect(x, y, 1, 1);
      }
    }
  }

  // Piedritas con luz arriba y sombra abajo
  for (let c = 0; c < 5; c++) {
    const cx = 10 + rnd() * 220;
    const cy = 156 + rnd() * 18;
    const count = 2 + Math.floor(rnd() * 2);

    for (let k = 0; k < count; k++) {
      const x = Math.round(cx + (rnd() - 0.5) * 14);
      const y = Math.round(cy + (rnd() - 0.5) * 5);
      const w = rnd() < 0.4 ? 3 : 2;

      bg.fillStyle = "rgba(0,0,0,0.28)";
      bg.fillRect(x + 1, y + 2, w, 1);

      bg.fillStyle = "#4a5a60";
      bg.fillRect(x, y, w, 1);

      bg.fillStyle = "#3a484e";
      bg.fillRect(x, y + 1, w, 1);

      bg.fillStyle = "#7d8f98";
      bg.fillRect(x + w - 1, y, 1, 1);
    }
  }

  // Pasto oscuro en el borde inferior, para dar profundidad
  for (let x = 0; x < W; x++) {
    if (rnd() < 0.4) {
      const h = 1 + Math.floor(rnd() * rnd() * 5);

      bg.fillStyle = "#0d1913";
      bg.fillRect(x, H - h, 1, h);

      if (h > 2) {
        bg.fillStyle = "#1a2f24";
        bg.fillRect(x, H - h, 1, 1);
      }
    }
  }
}

// ==================================================
// CONSTRUCCIÓN DE LA FLOR
// ==================================================

function put(x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  const key = `${px},${py}`;

  flowerMap.set(key, color);
  flowerParts.set(key, currentFlowerPart);
}

function bezier(p0, p1, p2, p3) {
  return t => {
    const u = 1 - t;

    return {
      x:
        u ** 3 * p0[0] +
        3 * u ** 2 * t * p1[0] +
        3 * u * t ** 2 * p2[0] +
        t ** 3 * p3[0],

      y:
        u ** 3 * p0[1] +
        3 * u ** 2 * t * p1[1] +
        3 * u * t ** 2 * p2[1] +
        t ** 3 * p3[1]
    };
  };
}

function sweep(curve, halfWidth, paint) {
  const N = 300;
  const best = new Map();

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = curve(t);

    const a = curve(Math.max(0, t - 0.01));
    const b = curve(Math.min(1, t + 0.01));

    const len =
      Math.hypot(b.x - a.x, b.y - a.y) || 1;

    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;

    const hw = Math.max(halfWidth(t), 0.75);
    const r = Math.ceil(hw);

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(c.x) + dx;
        const py = Math.round(c.y) + dy;

        const ox = px - c.x;
        const oy = py - c.y;
        const d = Math.hypot(ox, oy);

        if (d > hw) continue;

        const key = `${px},${py}`;
        const prev = best.get(key);

        if (prev && prev.d <= d) continue;

        best.set(key, {
          px,
          py,
          d,
          hw,
          t,
          lat: ox * nx + oy * ny,
          light: -(ox + oy) / (Math.SQRT2 * hw)
        });
      }
    }
  }

  best.forEach(s => {
    put(s.px, s.py, paint(s));
  });
}

function paintLeaf(s) {
  const edge = s.d / s.hw;

  // Bordes con contraste tipo voxel
  if (edge > 0.82) {
    return s.light > 0.1
      ? PAL.leafLight
      : PAL.leafEdge;
  }

  // Nervadura central discreta
  if (
    Math.abs(s.lat) < 0.55 &&
    s.t > 0.2 &&
    s.t < 0.84
  ) {
    return PAL.rib;
  }

  if (s.light > 0.3) return PAL.leafLight;
  if (s.light < -0.3) return PAL.leafDark;

  return PAL.leaf;
}

function paintStem(s) {
  if (s.light > 0.35) return PAL.stemLight;
  if (s.light < -0.35) return PAL.stemDark;

  return PAL.stem;
}

const leafWidth = max => t =>
  max *
  Math.pow(
    Math.sin(Math.PI * Math.pow(t, 0.75)),
    0.8
  );

function pointAtX(curve, targetX) {
  let best = curve(1);
  let bestD = Infinity;

  for (let i = 0; i <= 500; i++) {
    const p = curve(0.4 + 0.6 * (i / 500));
    const d = Math.abs(p.x - targetX);

    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }

  return best;
}

function addBell(cx, cy, len, sprite, index = 0) {
  // Tallito que sostiene la campanilla
  for (let i = 1; i <= len; i++) {
    bellPixels.push({
      x: cx,
      y: cy + i,
      color: PAL.pedicel,
      part: "bell",
      bellIndex: index,
      anchorX: cx,
      anchorY: cy
    });
  }

  const ox = cx - Math.floor(sprite[0].length / 2);
  const oy = cy + len + 1;

  sprite.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== ".") {
        bellPixels.push({
          x: ox + rx,
          y: oy + ry,
          color: BELL_COLORS[ch],
          part: "bell",
          bellIndex: index,
          anchorX: cx,
          anchorY: cy
        });
      }
    });
  });
}

function buildFlower() {
  flowerMap.clear();
  flowerParts.clear();
  bellPixels.length = 0;
  currentFlowerPart = "base";

  // Sombra pequeña bajo la planta
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -13; dx <= 13; dx++) {
      if (
        (dx / 13) ** 2 +
        (dy / 2.5) ** 2 <= 1
      ) {
        put(119 + dx, 144 + dy, PAL.shadow);
      }
    }
  }
currentFlowerPart = "leftLeaf";
  // Hoja izquierda: larga, puntiaguda y abierta
  sweep(
    bezier(
      [117, 142],
      [103, 135],
      [92, 112],
      [101, 91]
    ),
    leafWidth(5.0),
    paintLeaf
  );
currentFlowerPart = "stem";
  // Tallo principal: conserva su curva original
  const stemCurve = bezier(
    [119, 143],
    [117, 92],
    [128, 70],
    [150, 90]
  );

  sweep(
    stemCurve,
    t => 1.65 - t * 0.45,
    paintStem
  );
currentFlowerPart = "rightLeaf";
  // Hoja derecha: más corta y orientada hacia afuera
  sweep(
    bezier(
      [121, 142],
      [137, 137],
      [151, 120],
      [141, 104]
    ),
    leafWidth(4.5),
    paintLeaf
  );
currentFlowerPart = "base";
  // Pequeñas briznas en la base
  [
    [104, 143, 2],
    [109, 144, 4],
    [127, 144, 3],
    [132, 143, 3],
    [137, 144, 2]
  ].forEach(([x, y, h]) => {
    for (let i = 0; i < h; i++) {
      put(
        x + (i > 2 ? 1 : 0),
        y - i,
        i === h - 1
          ? PAL.leafLight
          : PAL.stem
      );
    }
  });

  // Campanillas de distintos tamaños
  [
    { x: 125, len: 2, sprite: BELL_SMALL },
    { x: 131, len: 4, sprite: BELL },
    { x: 137, len: 2, sprite: BELL },
    { x: 143, len: 4, sprite: BELL_SMALL },
    { x: 148, len: 2, sprite: BUD }
  ].forEach((b, index) => {
    const p = pointAtX(stemCurve, b.x);

    addBell(
      Math.round(p.x),
      Math.round(p.y),
      b.len,
      b.sprite,
      index
    );
  });

  // Organizar los píxeles para construir la flor
  const base = [...flowerMap].map(([key, color]) => {
  const [x, y] = key.split(",").map(Number);

  return {
    x,
    y,
    color,
    part: flowerParts.get(key) || "base"
  };
});

  base.sort((a, b) => b.y - a.y || a.x - b.x);

  pixels.length = 0;
  pixels.push(...base, ...bellPixels);

  drawnCount = 0;
  fl.clearRect(0, 0, W, H);
}

// ==================================================
// AJUSTE DE PANTALLA
// ==================================================

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  scale = Math.min(width / W, height / H);

  offsetX = (width - W * scale) / 2;
  offsetY = (height - H * scale) / 2;

  // Área invisible de interacción sobre el lirio
  const box = {
    x: 78,
    y: 80,
    w: 82,
    h: 66
  };

  flowerButton.style.left =
    `${offsetX + (box.x + box.w / 2) * scale}px`;

  flowerButton.style.top =
    `${offsetY + (box.y + box.h / 2) * scale}px`;

  flowerButton.style.width = `${box.w * scale}px`;
  flowerButton.style.height = `${box.h * scale}px`;
}

// Convierte coordenadas del mundo pixelado a pantalla
function worldRect(x, y, w, h) {
  ctx.fillRect(
    offsetX + x * scale,
    offsetY + y * scale,
    w * scale,
    h * scale
  );
}

// ==================================================
// ILUMINACIÓN DE LA LUNA
// ==================================================



function drawMoonlight(time) {
  // Halo lunar suave y respiración lenta
  const pulse = 1 + Math.sin(time * 0.00045) * 0.035;

  const x = offsetX + 177 * scale;
  const y = offsetY + 28 * scale;
  const radius = 62 * scale * pulse;

  const glow = ctx.createRadialGradient(
    x, y, 2 * scale,
    x, y, radius
  );

  glow.addColorStop(0, "rgba(205, 222, 255, 0.32)");
  glow.addColorStop(0.25, "rgba(165, 195, 255, 0.17)");
  glow.addColorStop(0.6, "rgba(125, 160, 220, 0.07)");
  glow.addColorStop(1, "rgba(100, 130, 210, 0)");

  ctx.fillStyle = glow;
  ctx.fillRect(
    x - radius,
    y - radius,
    radius * 2,
    radius * 2
  );

  // Destellos discretos sobre la luna
  const shimmer = (Math.sin(time * 0.0018) + 1) / 2;

  ctx.save();

  ctx.globalAlpha = 0.3 + shimmer * 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    offsetX + 173 * scale,
    offsetY + 23 * scale,
    2 * scale,
    2 * scale
  );

  ctx.globalAlpha = 0.2 + (1 - shimmer) * 0.3;
  ctx.fillStyle = "#a9caff";
  ctx.fillRect(
    offsetX + 180 * scale,
    offsetY + 29 * scale,
    2 * scale,
    2 * scale
  );

  ctx.restore();

  // Luz lunar extendida sobre el césped
  const groundX = offsetX + 166 * scale;
  const groundY = offsetY + 143 * scale;
  const groundRadiusX = 66 * scale;
  const groundRadiusY = 24 * scale;

  const reflection = ctx.createRadialGradient(
    groundX,
    groundY,
    1 * scale,
    groundX,
    groundY,
    groundRadiusX
  );

  reflection.addColorStop(0, "rgba(166, 201, 226, 0.10)");
  reflection.addColorStop(0.4, "rgba(132, 174, 205, 0.055)");
  reflection.addColorStop(1, "rgba(132, 174, 205, 0)");

  ctx.save();

  // Comprimir el reflejo para que se extienda sobre el suelo
  ctx.translate(0, groundY);
  ctx.scale(1, groundRadiusY / groundRadiusX);
  ctx.translate(0, -groundY);

  ctx.fillStyle = reflection;
  ctx.fillRect(
    groundX - groundRadiusX,
    groundY - groundRadiusX,
    groundRadiusX * 2,
    groundRadiusX * 2
  );

  ctx.restore();
}
// ==================================================
// NUBES DELGADAS Y LENTAS
// ==================================================

function drawClouds(time) {
  clouds.forEach(cloud => {
    const travel =
      (time * 0.001 * cloud.speed) % (W + 40);

    const x =
      (cloud.x + travel + W + 40) % (W + 40) - 25;

    const y = cloud.y;

    ctx.fillStyle = "rgba(93, 112, 157, 0.16)";
    worldRect(x, y, cloud.w + 10, 1);
    worldRect(x + 4, y - 1, cloud.w, 1);

    ctx.fillStyle = "rgba(166, 187, 229, 0.10)";
    worldRect(x + 3, y, cloud.w - 1, 1);
  });
}

// ==================================================
// ESTRELLAS DISCRETAS
// ==================================================

function drawStars(time) {
  for (let i = 0; i < 18; i++) {
    const x = (i * 53 + 19) % W;
    const y = (i * 31 + 8) % 72;

    const alpha =
      0.3 +
      (Math.sin(time * 0.001 + i * 1.7) + 1) * 0.2;

    ctx.fillStyle =
      `rgba(225, 235, 255, ${alpha})`;

    const size = i % 5 === 0 ? 1.5 : 1;

    worldRect(x, y, size, size);

    // Unos pocos destellos cruzados
    if (i % 6 === 0 && alpha > 0.55) {
      ctx.fillStyle =
        `rgba(255, 255, 255, ${alpha * 0.6})`;

      worldRect(x - 1, y + 0.5, 3, 0.5);
    }
  }
}

// ==================================================
// ESTRELLAS FUGACES: CADA 12–20 SEGUNDOS
// ==================================================



function drawShootingStars(time) {
  if (!shootingStar && time >= nextShootingStar) {
    shootingStar = {
      start: time,
      duration: 2200,
      y: 15 + Math.random() * 22,
      slope: 0.13 + Math.random() * 0.05
    };
  }

  if (!shootingStar) return;

  const progress =
    (time - shootingStar.start) / shootingStar.duration;

  if (progress >= 1) {
    shootingStar = null;
    nextShootingStar = time + 12000 + Math.random() * 6000;
    return;
  }

  // La estrella se desplaza por el cielo del mundo virtual.
  const headX = -35 + progress * (W + 70);
  const headY = shootingStar.y + headX * shootingStar.slope;

  const tailLength = 29;
  const tailX = headX - tailLength;
  const tailY = headY - tailLength * shootingStar.slope;

  // Convertir las coordenadas del jardín a la pantalla.
  const x1 = offsetX + tailX * scale;
  const y1 = offsetY + tailY * scale;
  const x2 = offsetX + headX * scale;
  const y2 = offsetY + headY * scale;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  // Halo suave.
  const halo = ctx.createLinearGradient(x1, y1, x2, y2);
  halo.addColorStop(0, "rgba(130, 170, 255, 0)");
  halo.addColorStop(0.6, "rgba(155, 190, 255, 0.3)");
  halo.addColorStop(1, "rgba(235, 243, 255, 0.9)");

  ctx.strokeStyle = halo;
  ctx.lineWidth = Math.max(3, scale * 3.5);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Cola luminosa central.
  const tail = ctx.createLinearGradient(x1, y1, x2, y2);
  tail.addColorStop(0, "rgba(150, 180, 255, 0)");
  tail.addColorStop(0.75, "rgba(200, 220, 255, 0.85)");
  tail.addColorStop(1, "#ffffff");

  ctx.strokeStyle = tail;
  ctx.lineWidth = Math.max(1, scale * 1.2);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Cabeza brillante.
  const radius = Math.max(4, scale * 4.5);
  const glow = ctx.createRadialGradient(
    x2, y2, 0,
    x2, y2, radius * 2
  );

  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.25, "rgba(220,235,255,0.95)");
  glow.addColorStop(1, "rgba(150,180,255,0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x2, y2, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x2, y2, Math.max(1, scale), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}



// ==================================================
// PASTO CON BRIZNAS INDEPENDIENTES
// ==================================================

function drawAnimatedGrass(time) {
  grassBlades.forEach(blade => {
    const wind =
      Math.sin(time * 0.0012 + blade.phase) *
        blade.sway +
      Math.sin(
        time * 0.0007 + blade.phase * 1.8
      ) * 0.5;

    // Cada brizna tiene su propio movimiento
    const tipX = blade.x + wind;
    const tipY = blade.y - blade.height;

    // Parte inferior oscura
    ctx.fillStyle = "#294b3d";

    worldRect(
      blade.x,
      blade.y - 1,
      1,
      1
    );

    // Tallo inclinado
    ctx.fillStyle = "#426b50";

    worldRect(
      blade.x + wind * 0.45,
      blade.y - blade.height * 0.55,
      1,
      Math.max(1, blade.height * 0.45)
    );

    // Borde iluminado por la luna
    ctx.fillStyle = "#91b7c0";

    worldRect(
      tipX,
      tipY,
      1,
      1
    );
  });
}

// ==================================================
// LUCiÉRNAGAS Y DESTELLOS AMBIENTALES
// ==================================================


function drawEffects(time) {
  const colors = [
    [210, 226, 255], // azul lunar
    [207, 198, 255], // lila suave
    [190, 224, 255], // azul claro
    [235, 240, 255], // blanco frío
    [180, 220, 190]  // verde tenue
  ];

  fireflies.forEach((f, i) => {
    // Movimiento lento y natural
    const driftX =
      Math.sin(time * 0.00028 + f.phase) * 0.8 +
      Math.sin(time * 0.00016 + f.phase * 1.7) * 0.35;

    const driftY =
      Math.cos(time * 0.00032 + f.phase) * 0.9;

    const x = f.x + driftX;
    const y = f.y + driftY;

    // Brillo independiente para cada luciérnaga
    const pulse =
      (Math.sin(time * 0.00065 + f.phase * 1.4) + 1) / 2;

    const alpha = 0.12 + pulse * 0.28;
    const [r, g, b] = colors[i % colors.length];

    const sx = offsetX + x * scale;
    const sy = offsetY + y * scale;

    // Halo suave
    const radius = Math.max(2, scale * (1.8 + pulse * 0.8));

    const glow = ctx.createRadialGradient(
      sx, sy, 0,
      sx, sy, radius
    );

    glow.addColorStop(
      0,
      `rgba(${r}, ${g}, ${b}, ${alpha})`
    );

    glow.addColorStop(
      0.45,
      `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`
    );

    glow.addColorStop(
      1,
      `rgba(${r}, ${g}, ${b}, 0)`
    );

    ctx.fillStyle = glow;
    ctx.fillRect(
      sx - radius,
      sy - radius,
      radius * 2,
      radius * 2
    );

    // Núcleo diminuto, más brillante al pulsar
    ctx.fillStyle =
      `rgba(240, 246, 255, ${0.25 + pulse * 0.55})`;

    worldRect(x, y, 1, 1);
  });
}

// ================= POLVO DE LUNA =================
// Motitas de luz nacen en la luna, flotan hacia las campanillas del lirio
// y, al llegar, la campanilla se ilumina un instante con unas chispas.

// De dónde sale el polvo (el centro de la luna)
const MOON_DUST_SOURCE = { x: 177, y: 29 };

// Dónde aterriza: el centro de cada campanilla, en coordenadas del mundo (240x180).
// Si mueves o cambias las campanillas, ajusta estos números.
const MOON_DUST_TARGETS = [
  { x: 125, y: 97 },
  { x: 131, y: 92 },
  { x: 137, y: 89 },
  { x: 143, y: 93 },
  { x: 148, y: 93 }
];

const moonDust = [];
const dustSparks = [];
const bellFlash = MOON_DUST_TARGETS.map(() => -99999);
const DUST_COLORS = ["235,244,255", "190,215,255", "215,230,255", "255,255,255"];

let nextDustAt = 0;
let lastDustFrame = 0;
let lastDustTarget = -1;

// Rectángulo en pantalla usando coordenadas del mundo (bordes redondeados: sin rendijas)
function dustPx(x, y, w, h, color) {
  const x0 = Math.round(offsetX + x * scale);
  const y0 = Math.round(offsetY + y * scale);
  const x1 = Math.round(offsetX + (x + w) * scale);
  const y1 = Math.round(offsetY + (y + h) * scale);

  ctx.fillStyle = color;
  ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
}

function spawnMoonDust(time) {
  // Nace por el lado de la luna que mira a la flor (abajo y a la izquierda)
  const a = ((100 + Math.random() * 90) * Math.PI) / 180;
  const sx = MOON_DUST_SOURCE.x + Math.cos(a) * 13;
  const sy = MOON_DUST_SOURCE.y + Math.sin(a) * 12;

  // Elige una campanilla distinta a la anterior
  let idx = Math.floor(Math.random() * MOON_DUST_TARGETS.length);
  if (idx === lastDustTarget) idx = (idx + 1) % MOON_DUST_TARGETS.length;
  lastDustTarget = idx;

  const tx = MOON_DUST_TARGETS[idx].x;
  const ty = MOON_DUST_TARGETS[idx].y;

  // Punto de control: hace que el camino sea un arco suave y no una línea recta
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const side = Math.random() < 0.5 ? -1 : 1;
  const off = len * (0.08 + Math.random() * 0.12) * side;

  moonDust.push({
    sx, sy, tx, ty,
    cx: (sx + tx) / 2 + (-dy / len) * off,
    cy: (sy + ty) / 2 + (dx / len) * off,
    t0: time,
    dur: 4200 + Math.random() * 2200,
    idx,
    phase: Math.random() * Math.PI * 2,
    amp: 0.8 + Math.random() * 1.5,
    big: Math.random() < 0.3,
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
    trail: [],
    lastTrail: 0
  });
}

function dustPos(m, u) {
  const e = u * u * (3 - 2 * u);
  const v = 1 - e;

  let x =
    v * v * m.sx +
    2 * v * e * m.cx +
    e * e * m.tx;

  let y =
    v * v * m.sy +
    2 * v * e * m.cy +
    e * e * m.ty;

  const dx = m.tx - m.sx;
  const dy = m.ty - m.sy;
  const len = Math.hypot(dx, dy) || 1;

  const float =
    Math.sin(u * Math.PI * 2.2 + m.phase) *
    m.amp *
    Math.sin(Math.PI * u);

  x += (-dy / len) * float;
  y += (dx / len) * float;

  return { x, y };
}

function landMoonDust(m, time) {
  bellFlash[m.idx] = time;

  // Chispitas que salen de la campanilla
  for (let k = 0; k < 6; k++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 0.008 + Math.random() * 0.014;

    dustSparks.push({
      x: m.tx,
      y: m.ty,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.004,
      t0: time,
      dur: 450 + Math.random() * 350
    });
  }
}

function drawMoonDust(time) {
  // Solo cuando la flor ya terminó de crecer (las campanillas son lo último)
  if (drawnCount < pixels.length) return;

  // Si la pestaña estuvo en segundo plano, no sueltes todo el polvo de golpe
  if (time - lastDustFrame > 400) nextDustAt = time + 300;
  lastDustFrame = time;

  // La luna "sopla" más polvo cuando su luz está en lo más alto de la respiración
  const mp = typeof moonPulse === "number" ? moonPulse : 1;

  if (time >= nextDustAt && moonDust.length < 8) {
    spawnMoonDust(time);
    nextDustAt = time + (450 + Math.random() * 800) / Math.max(0.6, mp);
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Brillo de las campanillas que acaban de recibir polvo
  MOON_DUST_TARGETS.forEach((t, i) => {
    const age = time - bellFlash[i];
    if (age > 1500) return;

    const k = Math.pow(1 - age / 1500, 2);
    const pop = age < 160 ? 0.6 + 0.4 * (age / 160) : 1;
    const r = (9 + 3 * k) * scale;
    const gx = offsetX + t.x * scale;
    const gy = offsetY + t.y * scale;

    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    glow.addColorStop(0, `rgba(215,230,255,${0.38 * k * pop})`);
    glow.addColorStop(1, "rgba(215,230,255,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(gx - r, gy - r, r * 2, r * 2);

    dustPx(t.x - 1, t.y - 1, 2, 2, `rgba(255,255,255,${0.5 * k})`);
  });

  // Las motas
  for (let i = moonDust.length - 1; i >= 0; i--) {
    const m = moonDust[i];
    const age = time - m.t0;
    const u = age / m.dur;

    if (u >= 1) {
      if (age - m.dur < 300) landMoonDust(m, time);
      moonDust.splice(i, 1);
      continue;
    }

    const p = dustPos(m, u);
    const x = Math.round(p.x);
    const y = Math.round(p.y);

    // Estela de píxeles que se desvanece
   if (time - m.lastTrail > 65) {
  m.trail.push({ x, y, t: time });

  // Conservar únicamente los puntos recientes
  m.trail = m.trail.filter(
    point => time - point.t < 450
  );

  if (m.trail.length > 7) {
    m.trail.shift();
  }

  m.lastTrail = time;
}

    // Nace poco a poco desde la luna
    const fadeIn = Math.min(1, age / 450);
const fadeOut = Math.min(1, (1 - u) * 8);
const fade = fadeIn * fadeOut;

    m.trail.forEach((point, k) => {
  const trailAge = time - point.t;
  const trailFade = Math.max(0, 1 - trailAge / 450);

  const alpha =
    fade *
    0.38 *
    trailFade *
    ((k + 1) / m.trail.length);

  dustPx(
    point.x,
    point.y,
    1,
    1,
    `rgba(${m.color},${alpha})`
  );
});

    const twinkle =
  0.82 +
  0.18 * Math.sin(time * 0.006 + m.phase);
    const gx = offsetX + p.x * scale;
    const gy = offsetY + p.y * scale;
    const r = 5 * scale;

    const halo = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    halo.addColorStop(0, `rgba(${m.color},${0.2 * fade})`);
    halo.addColorStop(1, `rgba(${m.color},0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(gx - r, gy - r, r * 2, r * 2);

    const head = `rgba(${m.color},${fade * twinkle})`;

    if (m.big) {
      dustPx(x, y, 2, 2, head);

      if (twinkle > 0.9) {
        const arm = `rgba(${m.color},${fade * 0.5})`;
        dustPx(x - 1, y, 1, 1, arm);
        dustPx(x + 2, y, 1, 1, arm);
        dustPx(x, y - 1, 1, 1, arm);
        dustPx(x, y + 2, 1, 1, arm);
      }
    } else {
      dustPx(x, y, 1, 1, head);
    }
  }

  // Chispas de aterrizaje
  for (let i = dustSparks.length - 1; i >= 0; i--) {
    const s = dustSparks[i];
    const age = time - s.t0;

    if (age >= s.dur) {
      dustSparks.splice(i, 1);
      continue;
    }

    const x = Math.round(s.x + s.vx * age);
    const y = Math.round(s.y + s.vy * age + 0.000012 * age * age);

    dustPx(x, y, 1, 1, `rgba(235,244,255,${1 - age / s.dur})`);
  }

  ctx.restore();
}
// ==================================================
// MOVIMIENTO DE LAS HOJAS
// ==================================================


function drawFlower(time) {
  // Brisa suave y continua
  const breeze =
    Math.sin(time * 0.00038) * 0.016 +
    Math.sin(time * 0.00022 + 1.1) * 0.006;

  // Punto fijo en la base del lirio
  const baseX = offsetX + 119 * scale;
  const baseY = offsetY + 143 * scale;

  ctx.save();

  // La base permanece quieta y la parte superior se flexiona
  ctx.translate(baseX, baseY);
  ctx.transform(1, 0, breeze, 1, 0, 0);

  // Dibujar la flor completa, sin separar sus píxeles
  ctx.drawImage(
    flowerLayer,
    -119 * scale,
    -143 * scale,
    W * scale,
    H * scale
  );

  ctx.restore();
}


// ==================================================
// PARTÍCULAS DE LA CARTA
// ==================================================

function drawParticles() {
  for (
    let i = magicParticles.length - 1;
    i >= 0;
    i--
  ) {
    const p = magicParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.008;
    p.life -= 0.012;

    if (p.life <= 0) {
      magicParticles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;

    worldRect(
      Math.round(p.x),
      Math.round(p.y),
      Math.max(1, p.size),
      Math.max(1, p.size)
    );
  }

  ctx.globalAlpha = 1;
}

// ==================================================
// ANIMACIÓN PRINCIPAL
// ==================================================

function render(time) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  // Fondo estático
  ctx.drawImage(
    background,
    offsetX,
    offsetY,
    W * scale,
    H * scale
  );
 
  // Animaciones del paisaje
  drawMoonlight(time);
  drawStars(time);
  drawClouds(time);
  drawEffects(time);
  drawAnimatedGrass(time);

  // Construcción progresiva de la flor
  const pixelsPerFrame = 2;

  for (
    let i = 0;
    i < pixelsPerFrame && drawnCount < pixels.length;
    i++
  ) {
    const p = pixels[drawnCount++];

    fl.fillStyle = p.color;
    fl.fillRect(p.x, p.y, 1, 1);
  }

  // Flor siempre por delante del paisaje
  drawFlower(time);
  
  drawMoonDust(time);
  // Partículas decorativas de la carta
  drawParticles();

  requestAnimationFrame(render);
}

// ==================================================
// BOTÓN Y CARTA ROMÁNTICA
// ==================================================

flowerButton.addEventListener("click", () => {
  const colors = [
    "#fff8e8",
    "#ffd6e8",
    "#e8caff",
    "#ffffff"
  ];

  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 1.2;

    magicParticles.push({
      x: 135 + (Math.random() - 0.5) * 30,
      y: 88 + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.3,
      life: 1,
      size: 1 + Math.floor(Math.random() * 2),
      color:
        colors[Math.floor(Math.random() * colors.length)]
    });
  }

  letter.classList.remove("hidden");
});

closeLetter.addEventListener("click", () => {
  letter.classList.add("hidden");
});

letter.addEventListener("click", event => {
  if (event.target === letter) {
    letter.classList.add("hidden");
  }
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    letter.classList.add("hidden");
  }
});

// ==================================================
// PREPARAR EL AMBIENTE
// ==================================================

// Nueve luciérnagas cerca del lirio y tres al fondo
for (let i = 0; i < 12; i++) {
  const nearFlower = i < 9;

  fireflies.push({
    x: nearFlower
      ? 100 + Math.random() * 65
      : 15 + Math.random() * 210,

    y: nearFlower
      ? 92 + Math.random() * 53
      : 48 + Math.random() * 65,

    phase: Math.random() * Math.PI * 2
  });
}

// Crear briznas con movimientos independientes
for (let i = 0; i < 85; i++) {
  grassBlades.push({
    x: Math.random() * W,
    y: 132 + Math.random() * 45,
    height: 2 + Math.random() * 5,
    phase: Math.random() * Math.PI * 2,
    sway: 0.5 + Math.random() * 1.5
  });
}

// ==================================================
// INICIO
// ==================================================

buildBackground();
buildFlower();
resize();

window.addEventListener("resize", resize);

requestAnimationFrame(render);
