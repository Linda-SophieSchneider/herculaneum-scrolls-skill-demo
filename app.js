const SIZE = 520;
const SAMPLE = 156;
const TWO_PI = Math.PI * 2;

const state = {
  scanExample: 0,
  prepExample: 0,
  modelExample: 0,
  activePatch: 0,
  paintMode: "brush",
  userMask: new Uint8Array(SAMPLE * SAMPLE),
  showTruth: false,
  labelDiff: false,
  hintIndex: 0,
  prep: { x: 210, y: 215, size: 86, dragging: false },
  trainTimer: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll(".panel")],
  scanCanvas: $("scanCanvas"),
  zSlider: $("zSlider"),
  zValue: $("zValue"),
  windowSlider: $("windowSlider"),
  windowValue: $("windowValue"),
  smoothSlider: $("smoothSlider"),
  smoothValue: $("smoothValue"),
  scanStatus: $("scanStatus"),
  scanScore: $("scanScore"),
  scanHint: $("scanHint"),
  scanHintText: $("scanHintText"),
  scanExamples: $("scanExamples"),
  labelCanvas: $("labelCanvas"),
  labelZSlider: $("labelZSlider"),
  labelZValue: $("labelZValue"),
  labelDiffBtn: $("labelDiffBtn"),
  labelDiffHelp: $("labelDiffHelp"),
  brushBtn: $("brushBtn"),
  brushSizeSlider: $("brushSizeSlider"),
  brushSizeValue: $("brushSizeValue"),
  eraseBtn: $("eraseBtn"),
  clearLabelBtn: $("clearLabelBtn"),
  showTruthBtn: $("showTruthBtn"),
  labelStatus: $("labelStatus"),
  labelScore: $("labelScore"),
  patchChoices: $("patchChoices"),
  activePatchName: $("activePatchName"),
  prepCanvas: $("prepCanvas"),
  patchPreview: $("patchPreview"),
  patchSizeSlider: $("patchSizeSlider"),
  patchSizeValue: $("patchSizeValue"),
  strideSlider: $("strideSlider"),
  strideValue: $("strideValue"),
  backgroundSlider: $("backgroundSlider"),
  backgroundValue: $("backgroundValue"),
  randomPatchBtn: $("randomPatchBtn"),
  prepExamples: $("prepExamples"),
  prepStatus: $("prepStatus"),
  prepScore: $("prepScore"),
  inkMetric: $("inkMetric"),
  structureMetric: $("structureMetric"),
  noiseMetric: $("noiseMetric"),
  patchCountMetric: $("patchCountMetric"),
  modelExamples: $("modelExamples"),
  modelInput: $("modelInput"),
  guessInput: $("guessInput"),
  guessBtn: $("guessBtn"),
  guessStatus: $("guessStatus"),
  modelPred: $("modelPred"),
  lossCanvas: $("lossCanvas"),
  detectMetric: $("detectMetric"),
  falseMetric: $("falseMetric"),
  generalMetric: $("generalMetric"),
  learnMetric: $("learnMetric"),
  epochSlider: $("epochSlider"),
  epochValue: $("epochValue"),
  trainDataSlider: $("trainDataSlider"),
  trainDataValue: $("trainDataValue"),
  testDataSlider: $("testDataSlider"),
  testDataValue: $("testDataValue"),
  lrSlider: $("lrSlider"),
  lrValue: $("lrValue"),
  trainBtn: $("trainBtn"),
};

const smoothQuality = [0.72, 0.94, 1, 0.82, 0.56];

const examples = [
  { title: "Beispiel 1", words: ["ΧΑΙΡΕ", "ΣΟΦΙΑ"], aliases: ["CHAIRE", "SOFIA"], targetZ: 37, rotation: -0.18, x: 0.52, y: 0.49, seed: 0, noise: 1 },
  { title: "Beispiel 2", words: ["ΛΟΓΟΣ", "ΠΥΡΟΣ"], aliases: ["LOGOS", "PYROS"], targetZ: 29, rotation: 0.13, x: 0.49, y: 0.52, seed: 9, noise: 1.15 },
  { title: "Beispiel 3", words: ["ΝΙΚΗ", "ΦΩΣ"], aliases: ["NIKE", "FOS"], targetZ: 45, rotation: -0.06, x: 0.55, y: 0.47, seed: 17, noise: 0.9 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hashNoise(x, y, z = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x, y, z = 0, scale = 18) {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const tx = smoothstep(0, 1, sx - x0);
  const ty = smoothstep(0, 1, sy - y0);
  const a = hashNoise(x0, y0, z);
  const b = hashNoise(x0 + 1, y0, z);
  const c = hashNoise(x0, y0 + 1, z);
  const d = hashNoise(x0 + 1, y0 + 1, z);
  const top = a + (b - a) * tx;
  const bottom = c + (d - c) * tx;
  return top + (bottom - top) * ty;
}

function fiber(x, y, example = examples[0]) {
  const seed = example.seed;
  const a = Math.sin(y * 0.12 + Math.sin((x + seed * 3) * 0.035) * 2.2);
  const b = Math.sin((x + y * 0.42 + seed * 11) * 0.055);
  const c = valueNoise(x, y, seed + 9, 7);
  return a * 0.45 + b * 0.35 + (c - 0.5) * 0.35;
}

function surfaceZ(x, y, example = examples[0]) {
  return example.targetZ + Math.sin((x + example.seed * 5) * 0.036) * 5.5 + Math.cos((y - example.seed * 2) * 0.047) * 4.2 + Math.sin((x + y) * 0.018) * 2.3;
}

function layerDensity(x, y, z, example = examples[0]) {
  let density = 0;
  const layers = [18, 26, 36, 45, 54];
  for (let i = 0; i < layers.length; i += 1) {
    const wave = layers[i] + Math.sin((x + example.seed * 8) * (0.026 + i * 0.003)) * (3 + i * 0.6) + Math.cos(y * 0.031 + i + example.seed) * 3.5;
    const distance = Math.abs(z - wave);
    density += Math.exp(-(distance * distance) / 18) * (0.22 + i * 0.035);
  }
  return density;
}

function drawGreekMask(width, height, variant = 0, example = examples[variant % examples.length]) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width * example.x, height * example.y);
  ctx.rotate(example.rotation);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = `700 ${Math.round(width * 0.145)}px Georgia, "Times New Roman", serif`;
  ctx.fillText(example.words[0], 0, -height * 0.12);
  ctx.font = `700 ${Math.round(width * 0.118)}px Georgia, "Times New Roman", serif`;
  ctx.fillText(example.words[1], width * 0.02, height * 0.13);
  ctx.restore();
  return ctx.getImageData(0, 0, width, height).data;
}

const fullGreekMasks = examples.map((example, index) => drawGreekMask(SIZE, SIZE, index, example));
const labelMasks = examples.map((example, index) => drawGreekMask(SAMPLE, SAMPLE, index, example));

function inkAlphaFromMask(mask, width, x, y) {
  const ix = clamp(Math.floor(x), 0, width - 1);
  const iy = clamp(Math.floor(y), 0, width - 1);
  return mask[(iy * width + ix) * 4 + 3] / 255;
}

function inkSignal(x, y, z, mask = fullGreekMasks[0], width = SIZE, example = examples[0]) {
  const a = inkAlphaFromMask(mask, width, x, y);
  if (a <= 0) return 0;
  const dz = Math.abs(z - surfaceZ(x, y, example));
  return a * Math.exp(-(dz * dz) / 5.8);
}

function crackSignal(x, y, example = examples[0]) {
  const lineA = Math.abs(y - (85 + example.seed * 2 + Math.sin(x * 0.022 + example.seed) * 28 + x * 0.12));
  const lineB = Math.abs(x - (410 - example.seed * 5 + Math.cos(y * 0.025) * 22 - y * 0.08));
  return -0.09 * Math.exp(-(lineA * lineA) / 12) - 0.07 * Math.exp(-(lineB * lineB) / 18);
}

function ctValue(x, y, z, mask = fullGreekMasks[0], width = SIZE, noiseBoost = 1, example = examples[0]) {
  const base = 0.42 + layerDensity(x, y, z, example) + fiber(x, y, example) * 0.075;
  const cracks = crackSignal(x * (SIZE / width), y * (SIZE / width), example);
  const fineNoise = (hashNoise(x, y, z + example.seed) - 0.5) * 0.17 * noiseBoost * example.noise;
  const broadNoise = (valueNoise(x, y, z + example.seed, 28) - 0.5) * 0.16;
  const ink = inkSignal(x, y, z, mask, width, example) * 0.33;
  return clamp(base + cracks + fineNoise + broadNoise - ink, 0, 1);
}

function canvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  const clientX = touch ? touch.clientX : event.clientX;
  const clientY = touch ? touch.clientY : event.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function renderScan() {
  const example = examples[state.scanExample];
  const mask = fullGreekMasks[state.scanExample];
  const z = Number(els.zSlider.value);
  const windowWidth = Number(els.windowSlider.value) / 100;
  const smooth = Number(els.smoothSlider.value);
  els.zValue.textContent = z;
  els.windowValue.textContent = els.windowSlider.value;
  els.smoothValue.textContent = smooth;

  const ctx = els.scanCanvas.getContext("2d");
  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  const center = 0.55;
  const noiseBoost = 1 - smooth * 0.13;
  let visibleInk = 0;
  let truthInk = 0;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let v = ctValue(x, y, z, mask, SIZE, noiseBoost, example);
      if (smooth > 1) {
        v = (v + ctValue(x + 1, y, z, mask, SIZE, noiseBoost, example) + ctValue(x, y + 1, z, mask, SIZE, noiseBoost, example)) / 3;
      }
      const normalized = clamp((v - (center - windowWidth / 2)) / windowWidth, 0, 1);
      const papyrus = Math.round(26 + normalized * 224);
      const ink = inkSignal(x, y, z, mask, SIZE, example);
      if (inkAlphaFromMask(mask, SIZE, x, y) > 0.35) truthInk += 1;
      if (ink > 0.19) visibleInk += 1;
      const idx = (y * SIZE + x) * 4;
      data[idx] = clamp(papyrus + fiber(x, y, example) * 16, 0, 255);
      data[idx + 1] = clamp(papyrus * 0.95 + 12, 0, 255);
      data[idx + 2] = clamp(papyrus * 0.82 + 10, 0, 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  drawScanOverlay(ctx, z, example);

  const rawVisibility = truthInk ? visibleInk / truthInk : 0;
  const depthQuality = Math.exp(-((z - example.targetZ) ** 2) / 36);
  const windowQuality = Math.exp(-((Number(els.windowSlider.value) - 42) ** 2) / 520);
  const filterQuality = smoothQuality[smooth] ?? 0.75;
  const score = clamp(Math.round(100 * rawVisibility * depthQuality * windowQuality * filterQuality), 0, 100);
  els.scanScore.textContent = `Erkennung: ${score}%`;
  if (score > 70) {
    els.scanStatus.textContent = "Gute Einstellung: die Linien sind in dieser Anzeige gut vom Papyrus getrennt.";
  } else if (score > 35) {
    els.scanStatus.textContent = "Teiltreffer: Tiefe oder Dichtefenster sind nah dran, aber noch nicht optimal.";
  } else {
    els.scanStatus.textContent = "Wenig Signal: vergleiche benachbarte Schichten und passe das Dichtefenster an.";
  }
}

function drawScanOverlay(ctx, z, example) {
  ctx.save();
  ctx.strokeStyle = "rgba(0, 109, 119, 0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(86, 118, 348, 248);
  ctx.restore();
  if (Math.abs(z - example.targetZ) <= 3) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(102, 35, 28, 0.32)";
    ctx.font = "700 72px Georgia, serif";
    ctx.textAlign = "center";
    ctx.translate(SIZE * example.x, SIZE * example.y);
    ctx.rotate(example.rotation);
    ctx.fillText(example.words[0], 0, -60);
    ctx.font = "700 60px Georgia, serif";
    ctx.fillText(example.words[1], 10, 70);
    ctx.restore();
  }
}

function renderPatchToCanvas(canvas, patchIndex, showTruth = false, userMask = null, zOverride = null, diffMode = false) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const example = examples[patchIndex % examples.length];
  const mask = labelMasks[patchIndex % labelMasks.length];
  const z = zOverride ?? example.targetZ;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = (x / width) * SAMPLE;
      const sy = (y / height) * SAMPLE;
      let v = ctValue(sx, sy, z, mask, SAMPLE, 1.1 + patchIndex * 0.06, example);
      if (diffMode) {
        const before = ctValue(sx, sy, z - 1, mask, SAMPLE, 1.1, example);
        const after = ctValue(sx, sy, z + 1, mask, SAMPLE, 1.1, example);
        v = 0.28 + Math.abs(after - before) * 2.6 + inkSignal(sx, sy, z, mask, SAMPLE, example) * 0.25;
      }
      const g = Math.round(clamp((v - 0.26) / 0.55, 0, 1) * 230 + 18);
      const idx = (y * width + x) * 4;
      data[idx] = g;
      data[idx + 1] = Math.round(g * 0.94 + 8);
      data[idx + 2] = Math.round(g * 0.82 + 12);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  if (showTruth) {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sx = Math.floor((x / width) * SAMPLE);
        const sy = Math.floor((y / height) * SAMPLE);
        if (inkAlphaFromMask(mask, SAMPLE, sx, sy) > 0.35) {
          ctx.fillStyle = "rgba(0, 109, 119, 0.34)";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.restore();
  }

  if (userMask) {
    ctx.save();
    ctx.fillStyle = "rgba(215, 138, 0, 0.5)";
    for (let y = 0; y < SAMPLE; y += 1) {
      for (let x = 0; x < SAMPLE; x += 1) {
        if (userMask[y * SAMPLE + x]) {
          ctx.fillRect((x / SAMPLE) * width, (y / SAMPLE) * height, width / SAMPLE + 1, height / SAMPLE + 1);
        }
      }
    }
    ctx.restore();
  }
}

function setupPatchChoices() {
  els.patchChoices.innerHTML = "";
  ["A", "B", "C"].forEach((name, index) => {
    const button = document.createElement("button");
    button.className = `patch-choice${index === 0 ? " active" : ""}`;
    button.type = "button";
    button.dataset.patch = String(index);
    const canvas = document.createElement("canvas");
    canvas.width = 140;
    canvas.height = 90;
    const label = document.createElement("span");
    label.textContent = `Ausschnitt ${name}`;
    button.append(canvas, label);
    els.patchChoices.append(button);
    renderPatchToCanvas(canvas, index);
  });
}

function renderLabel() {
  const z = Number(els.labelZSlider.value);
  els.labelZValue.textContent = z;
  renderPatchToCanvas(els.labelCanvas, state.activePatch, state.showTruth, state.userMask, z, state.labelDiff);
  els.activePatchName.textContent = String.fromCharCode(65 + state.activePatch);
}

function paintAt(point) {
  const radius = Number(els.brushSizeSlider.value);
  const x0 = Math.floor((point.x / els.labelCanvas.width) * SAMPLE);
  const y0 = Math.floor((point.y / els.labelCanvas.height) * SAMPLE);
  for (let y = y0 - radius; y <= y0 + radius; y += 1) {
    for (let x = x0 - radius; x <= x0 + radius; x += 1) {
      if (x < 0 || y < 0 || x >= SAMPLE || y >= SAMPLE) continue;
      const d = Math.hypot(x - x0, y - y0);
      if (d <= radius) state.userMask[y * SAMPLE + x] = state.paintMode === "brush" ? 1 : 0;
    }
  }
  state.showTruth = false;
  renderLabel();
}

function scoreUserMask() {
  const mask = labelMasks[state.activePatch % labelMasks.length];
  let intersection = 0;
  let union = 0;
  for (let y = 0; y < SAMPLE; y += 1) {
    for (let x = 0; x < SAMPLE; x += 1) {
      const truth = inkAlphaFromMask(mask, SAMPLE, x, y) > 0.35;
      const user = Boolean(state.userMask[y * SAMPLE + x]);
      if (truth && user) intersection += 1;
      if (truth || user) union += 1;
    }
  }
  const iou = union ? Math.round((intersection / union) * 100) : 0;
  els.labelScore.textContent = `IoU: ${iou}%`;
  els.labelStatus.textContent = iou > 45 ? "Viele markierte Punkte passen zur synthetischen Wahrheit." : "Einige Spuren fehlen oder wurden mit normalen Papyrusstrukturen verwechselt.";
}

function renderPrep() {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  const ctx = els.prepCanvas.getContext("2d");
  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  const z = example.targetZ;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const v = ctValue(x, y, z, mask, SIZE, 0.95, example);
      const g = Math.round(clamp((v - 0.22) / 0.62, 0, 1) * 220 + 18);
      const idx = (y * SIZE + x) * 4;
      data[idx] = g;
      data[idx + 1] = Math.round(g * 0.95 + 6);
      data[idx + 2] = Math.round(g * 0.82 + 10);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  drawStrideGrid(ctx);

  const { x, y, size } = state.prep;
  ctx.save();
  ctx.strokeStyle = "#d78a00";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = "rgba(215, 138, 0, 0.08)";
  ctx.fillRect(x, y, size, size);
  ctx.restore();

  renderPatchPreview();
  updatePatchMetrics();
}

function drawStrideGrid(ctx) {
  const stride = Number(els.strideSlider.value);
  const size = state.prep.size;
  ctx.save();
  ctx.strokeStyle = "rgba(0, 109, 119, 0.32)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= SIZE; x += stride) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= SIZE; y += stride) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(56, 90, 159, 0.28)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= SIZE - size; y += stride) {
    for (let x = 0; x <= SIZE - size; x += stride) {
      ctx.strokeRect(x, y, size, size);
    }
  }

  const yGuide = SIZE - 26;
  ctx.strokeStyle = "#d78a00";
  ctx.fillStyle = "#d78a00";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(18, yGuide);
  ctx.lineTo(18 + stride, yGuide);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18 + stride, yGuide);
  ctx.lineTo(18 + stride - 9, yGuide - 6);
  ctx.lineTo(18 + stride - 9, yGuide + 6);
  ctx.closePath();
  ctx.fill();
  ctx.font = "700 15px Inter, sans-serif";
  ctx.fillText(`Stride ${stride}px`, 24, yGuide - 10);
  ctx.restore();
}

function renderPatchPreview() {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  const ctx = els.patchPreview.getContext("2d");
  const size = els.patchPreview.width;
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const prep = state.prep;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = prep.x + (x / size) * prep.size;
      const sy = prep.y + (y / size) * prep.size;
      const v = ctValue(sx, sy, example.targetZ, mask, SIZE, 1, example);
      const g = Math.round(clamp((v - 0.22) / 0.62, 0, 1) * 220 + 18);
      const idx = (y * size + x) * 4;
      data[idx] = g;
      data[idx + 1] = Math.round(g * 0.95 + 6);
      data[idx + 2] = Math.round(g * 0.82 + 10);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function updatePatchMetrics() {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  const { x, y, size } = state.prep;
  const stride = Number(els.strideSlider.value);
  const backgroundTarget = Number(els.backgroundSlider.value);
  let ink = 0;
  let structure = 0;
  let samples = 0;
  for (let py = 0; py < 40; py += 1) {
    for (let px = 0; px < 40; px += 1) {
      const sx = x + (px / 40) * size;
      const sy = y + (py / 40) * size;
      const v = ctValue(sx, sy, example.targetZ, mask, SIZE, 1, example);
      const vx = ctValue(sx + 1, sy, example.targetZ, mask, SIZE, 1, example);
      const vy = ctValue(sx, sy + 1, example.targetZ, mask, SIZE, 1, example);
      ink += inkSignal(sx, sy, example.targetZ, mask, SIZE, example) > 0.14 ? 1 : 0;
      structure += Math.abs(v - vx) + Math.abs(v - vy);
      samples += 1;
    }
  }
  const inkPct = Math.round((ink / samples) * 100);
  const structurePct = clamp(Math.round(structure * 85), 0, 100);
  const noisePct = clamp(Math.round(32 + hashNoise(x, y, size) * 35), 0, 100);
  const gridCount = Math.max(1, Math.floor((SIZE - size) / stride) + 1);
  const patchCount = gridCount * gridCount;
  els.strideValue.textContent = `${stride} px`;
  els.backgroundValue.textContent = `${backgroundTarget}%`;
  els.inkMetric.textContent = `${inkPct}%`;
  els.structureMetric.textContent = `${structurePct}%`;
  els.noiseMetric.textContent = `${noisePct}%`;
  els.patchCountMetric.textContent = `${patchCount}`;

  let rating = "mittel";
  if (inkPct >= 4 && inkPct <= 22 && structurePct > 35 && noisePct < 58) rating = "gut";
  if (inkPct < 2 || inkPct > 35 || noisePct > 70) rating = "schwach";
  els.prepScore.textContent = `Qualität: ${rating}`;
  if (inkPct < 2) {
    els.prepStatus.textContent = `Negativbeispiel: sinnvoll, aber nur etwa ${backgroundTarget}% der Trainingspatches sollten so leer sein.`;
  } else {
    els.prepStatus.textContent = rating === "gut" ? `Nützlicher Patch. Kleiner Stride erzeugt mehr Überlappung und aktuell etwa ${patchCount} Patches.` : "Der Patch ist möglich, aber nicht ideal für das Training.";
  }
}

function movePrepTo(point) {
  const size = state.prep.size;
  state.prep.x = clamp(point.x - size / 2, 0, SIZE - size);
  state.prep.y = clamp(point.y - size / 2, 0, SIZE - size);
  renderPrep();
}

function modelStats(epoch = Number(els.epochSlider.value)) {
  const trainAmount = Number(els.trainDataSlider.value) / 100;
  const testAmount = Number(els.testDataSlider.value) / 100;
  const lr = Number(els.lrSlider.value) / 10000;
  const progress = smoothstep(0, 30, epoch);
  const lrQuality = Math.exp(-Math.abs(lr - 0.0035) * 210);
  const lrTooHigh = Math.max(0, lr - 0.006);
  const lrTooLow = Math.max(0, 0.002 - lr);
  const dataQuality = Math.sqrt(trainAmount);
  const skill = clamp(progress * (0.14 + dataQuality * 0.55 + lrQuality * 0.34 - lrTooHigh * 22 - lrTooLow * 35), 0, 1);
  const detection = clamp(Math.round(100 * (skill * 0.82 + trainAmount * 0.16)), 0, 100);
  const falseAlarms = clamp(Math.round(68 * (1 - skill) + lrTooHigh * 8200 + (1 - testAmount) * 9), 0, 99);
  const generalization = clamp(Math.round(100 * (skill * 0.58 + testAmount * 0.48 - lrTooHigh * 30 - lrTooLow * 24)), 0, 100);
  let behavior = "stabil";
  if (trainAmount < 0.25) behavior = "zu wenig Daten";
  else if (testAmount < 0.12) behavior = "Testset klein";
  else if (lrTooLow > 0) behavior = "lernt langsam";
  else if (lrTooHigh > 0) behavior = "instabil";
  else if (epoch < 8) behavior = "lernt noch";
  return { trainAmount, testAmount, lr, lrQuality, lrTooHigh, lrTooLow, skill, detection, falseAlarms, generalization, behavior };
}

function renderModel() {
  renderModelInput();
  renderPrediction();
  renderLoss();
  els.epochValue.textContent = els.epochSlider.value;
  els.trainDataValue.textContent = `${els.trainDataSlider.value}%`;
  els.testDataValue.textContent = `${els.testDataSlider.value}%`;
  els.lrValue.textContent = (Number(els.lrSlider.value) / 10000).toFixed(4);
  const stats = modelStats();
  els.detectMetric.textContent = `${stats.detection}%`;
  els.falseMetric.textContent = `${stats.falseAlarms}%`;
  els.generalMetric.textContent = `${stats.generalization}%`;
  els.learnMetric.textContent = stats.behavior;
}

function renderModelInput() {
  const example = examples[state.modelExample];
  const mask = fullGreekMasks[state.modelExample];
  const ctx = els.modelInput.getContext("2d");
  const image = ctx.createImageData(300, 300);
  const data = image.data;
  for (let y = 0; y < 300; y += 1) {
    for (let x = 0; x < 300; x += 1) {
      const sx = x * (SIZE / 300);
      const sy = y * (SIZE / 300);
      const v = ctValue(sx, sy, example.targetZ, mask, SIZE, 1.08, example);
      const g = Math.round(clamp((v - 0.23) / 0.6, 0, 1) * 225 + 18);
      const idx = (y * 300 + x) * 4;
      data[idx] = g;
      data[idx + 1] = Math.round(g * 0.94 + 8);
      data[idx + 2] = Math.round(g * 0.83 + 12);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function renderPrediction() {
  const example = examples[state.modelExample];
  const mask = fullGreekMasks[state.modelExample];
  const ctx = els.modelPred.getContext("2d");
  const image = ctx.createImageData(300, 300);
  const data = image.data;
  const epoch = Number(els.epochSlider.value);
  const stats = modelStats(epoch);

  for (let y = 0; y < 300; y += 1) {
    for (let x = 0; x < 300; x += 1) {
      const sx = x * (SIZE / 300);
      const sy = y * (SIZE / 300);
      const truth = inkSignal(sx, sy, example.targetZ, mask, SIZE, example);
      const falseAlarm = valueNoise(sx, sy, epoch + example.seed, 12) * (1 - stats.skill) * 0.62 + stats.lrTooHigh * hashNoise(sx, sy, epoch) * 36;
      const pred = clamp(truth * stats.skill * 2.35 + falseAlarm - (1 - stats.trainAmount) * 0.08, 0, 1);
      const idx = (y * 300 + x) * 4;
      data[idx] = Math.round(25 + pred * 230);
      data[idx + 1] = Math.round(28 + pred * 150);
      data[idx + 2] = Math.round(42 + (1 - pred) * 80);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function renderLoss() {
  const ctx = els.lossCanvas.getContext("2d");
  const epoch = Number(els.epochSlider.value);
  const stats = modelStats(epoch);
  ctx.clearRect(0, 0, 300, 300);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, 300, 300);
  ctx.strokeStyle = "#d9d2c4";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = 26 + i * 46;
    ctx.beginPath();
    ctx.moveTo(34, y);
    ctx.lineTo(276, y);
    ctx.stroke();
  }
  drawLossCurve(ctx, epoch, "#006d77", (progress) => {
    const rate = clamp(1.7 + stats.trainAmount * 2.8 - Math.abs(stats.lr - 0.0035) * 44, 0.35, 5.2);
    return 0.86 * Math.exp(-progress * rate) + 0.07 + (1 - stats.trainAmount) * 0.08 + stats.lrTooHigh * 10;
  });
  drawLossCurve(ctx, epoch, "#d78a00", (progress) => {
    const rate = clamp(1.35 + stats.trainAmount * 2.1 - Math.abs(stats.lr - 0.0035) * 36, 0.25, 4.2);
    const overfitGap = Math.max(0, stats.trainAmount - stats.testAmount - 0.25) * progress * 0.34;
    return 0.9 * Math.exp(-progress * rate) + 0.12 + (1 - stats.testAmount) * 0.12 + stats.lrTooHigh * 12 + overfitGap;
  });
  ctx.fillStyle = "#202124";
  ctx.font = "700 14px Inter, sans-serif";
  ctx.fillText("hoch", 38, 38);
  ctx.fillText("niedrig", 38, 270);
  ctx.fillStyle = "#006d77";
  ctx.fillText("Training", 170, 42);
  ctx.fillStyle = "#d78a00";
  ctx.fillText("Test", 170, 62);
}

function drawLossCurve(ctx, epoch, color, lossFn) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let e = 0; e <= epoch; e += 1) {
    const progress = e / 30;
    const loss = clamp(lossFn(progress), 0, 1);
    const x = 34 + progress * 242;
    const y = 252 - clamp(1 - loss, 0, 1) * 200;
    if (e === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function normalizeGreekGuess(value) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function checkGuess() {
  const example = examples[state.modelExample];
  const guess = normalizeGreekGuess(els.guessInput.value);
  if (!guess) {
    els.guessStatus.textContent = "Gib zuerst eine Vermutung ein.";
    return;
  }
  const hits = example.words.filter((word, index) => guess.includes(word) || guess.includes(example.aliases[index])).length;
  if (hits === example.words.length) {
    els.guessStatus.textContent = "Passt: beide gesuchten Wörter wurden erkannt.";
  } else if (hits === 1) {
    els.guessStatus.textContent = "Teiltreffer: ein Wort passt, das zweite noch nicht.";
  } else {
    els.guessStatus.textContent = "Noch kein Treffer. Versuche, die stärksten Linien in der Vorhersage zu lesen.";
  }
}

function wireEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === tab.dataset.tab));
    });
  });

  [els.zSlider, els.windowSlider, els.smoothSlider].forEach((input) => input.addEventListener("input", renderScan));
  els.scanHint.addEventListener("click", () => {
    const hints = [
      "Bewege die Tiefe langsam und achte auf Linien, die nicht sofort wieder verschwinden.",
      "Wenn alles gleich aussieht, verenge das Dichtefenster leicht.",
      "Ein kleiner Rauschfilter hilft; zu viel Filter macht feine Spuren unsichtbar.",
    ];
    state.hintIndex = (state.hintIndex + 1) % hints.length;
    els.scanHintText.textContent = hints[state.hintIndex];
  });
  els.scanExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.scanExample = Number(button.dataset.example);
    [...els.scanExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    const example = examples[state.scanExample];
    els.zSlider.value = clamp(example.targetZ - 8, 0, 65);
    els.scanHintText.textContent = "Starte etwas neben der Oberfläche und suche die Schichtfolge.";
    renderScan();
  });

  els.labelZSlider.addEventListener("input", renderLabel);
  els.labelDiffBtn.addEventListener("click", () => {
    state.labelDiff = !state.labelDiff;
    els.labelDiffBtn.classList.toggle("active", state.labelDiff);
    els.labelDiffHelp.textContent = state.labelDiff
      ? "Aktiv: angezeigt wird die Veränderung zwischen z-1 und z+1. Das hilft, schwache Tintenspuren von ruhiger Papyrusstruktur zu trennen."
      : "Aus: angezeigt wird die aktuelle Tiefenschicht. Schiebe die Tiefe langsam und suche Spuren, die nur in wenigen Schichten auftauchen.";
    els.labelStatus.textContent = state.labelDiff ? "Vergleichsmodus: helle Stellen ändern sich zwischen Nachbarschichten." : "Normalmodus: slice durch das Volumen und markiere stabile Spuren.";
    renderLabel();
  });

  els.patchChoices.addEventListener("click", (event) => {
    const button = event.target.closest(".patch-choice");
    if (!button) return;
    state.activePatch = Number(button.dataset.patch);
    state.userMask.fill(0);
    state.showTruth = false;
    [...els.patchChoices.children].forEach((child) => child.classList.toggle("active", child === button));
    els.labelScore.textContent = "IoU: -";
    els.labelZSlider.value = examples[state.activePatch].targetZ - 3;
    els.labelStatus.textContent = "Slice durch die Tiefen und markiere Spuren, die in wenigen Schichten auftauchen.";
    renderLabel();
  });

  let painting = false;
  const startPaint = (event) => {
    event.preventDefault();
    painting = true;
    paintAt(canvasPoint(event, els.labelCanvas));
  };
  const movePaint = (event) => {
    if (!painting) return;
    event.preventDefault();
    paintAt(canvasPoint(event, els.labelCanvas));
  };
  const stopPaint = () => {
    painting = false;
  };
  els.labelCanvas.addEventListener("mousedown", startPaint);
  els.labelCanvas.addEventListener("mousemove", movePaint);
  window.addEventListener("mouseup", stopPaint);
  els.labelCanvas.addEventListener("touchstart", startPaint, { passive: false });
  els.labelCanvas.addEventListener("touchmove", movePaint, { passive: false });
  window.addEventListener("touchend", stopPaint);

  els.brushBtn.addEventListener("click", () => {
    state.paintMode = "brush";
    els.brushBtn.classList.add("active");
    els.eraseBtn.classList.remove("active");
  });
  els.eraseBtn.addEventListener("click", () => {
    state.paintMode = "erase";
    els.eraseBtn.classList.add("active");
    els.brushBtn.classList.remove("active");
  });
  els.brushSizeSlider.addEventListener("input", () => {
    els.brushSizeValue.textContent = els.brushSizeSlider.value;
  });
  els.clearLabelBtn.addEventListener("click", () => {
    state.userMask.fill(0);
    state.showTruth = false;
    els.labelScore.textContent = "IoU: -";
    renderLabel();
  });
  els.showTruthBtn.addEventListener("click", () => {
    state.showTruth = true;
    scoreUserMask();
    renderLabel();
  });

  els.patchSizeSlider.addEventListener("input", () => {
    state.prep.size = Number(els.patchSizeSlider.value);
    els.patchSizeValue.textContent = `${state.prep.size} px`;
    state.prep.x = clamp(state.prep.x, 0, SIZE - state.prep.size);
    state.prep.y = clamp(state.prep.y, 0, SIZE - state.prep.size);
    renderPrep();
  });
  [els.strideSlider, els.backgroundSlider].forEach((input) => input.addEventListener("input", renderPrep));
  els.prepExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.prepExample = Number(button.dataset.example);
    [...els.prepExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    renderPrep();
  });
  els.randomPatchBtn.addEventListener("click", () => {
    const size = state.prep.size;
    state.prep.x = Math.round(hashNoise(Date.now(), 4, 2) * (SIZE - size));
    state.prep.y = Math.round(hashNoise(2, Date.now(), 7) * (SIZE - size));
    renderPrep();
  });
  els.prepCanvas.addEventListener("pointerdown", (event) => {
    state.prep.dragging = true;
    els.prepCanvas.setPointerCapture(event.pointerId);
    movePrepTo(canvasPoint(event, els.prepCanvas));
  });
  els.prepCanvas.addEventListener("pointermove", (event) => {
    if (!state.prep.dragging) return;
    movePrepTo(canvasPoint(event, els.prepCanvas));
  });
  els.prepCanvas.addEventListener("pointerup", () => {
    state.prep.dragging = false;
  });

  els.modelExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.modelExample = Number(button.dataset.example);
    [...els.modelExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    els.guessInput.value = "";
    els.guessStatus.textContent = "Keine Wahrheit anzeigen: erst aus Scan und Vorhersage eine Vermutung bilden.";
    renderModel();
  });
  els.guessBtn.addEventListener("click", checkGuess);
  els.guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkGuess();
  });
  [els.epochSlider, els.trainDataSlider, els.testDataSlider, els.lrSlider].forEach((input) => input.addEventListener("input", renderModel));
  els.trainBtn.addEventListener("click", () => {
    if (state.trainTimer) clearInterval(state.trainTimer);
    els.epochSlider.value = 0;
    renderModel();
    state.trainTimer = setInterval(() => {
      const next = Number(els.epochSlider.value) + 1;
      els.epochSlider.value = next;
      renderModel();
      if (next >= 30) {
        clearInterval(state.trainTimer);
        state.trainTimer = null;
      }
    }, 160);
  });
}

function init() {
  wireEvents();
  setupPatchChoices();
  renderScan();
  renderLabel();
  renderPrep();
  renderModel();
}

init();
