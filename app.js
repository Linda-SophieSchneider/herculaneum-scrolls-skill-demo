const SIZE = 520;
const SAMPLE = 156;
const LABEL_RES = 520;
const TWO_PI = Math.PI * 2;

const state = {
  mode: "youth",
  scanExample: 0,
  prepExample: 0,
  modelExample: 0,
  activePatch: 0,
  paintMode: "brush",
  userMask: new Uint8Array(LABEL_RES * LABEL_RES),
  showTruth: false,
  labelDiff: false,
  hintIndex: 0,
  prep: { x: 210, y: 215, size: 86, checked: false },
  trainTimer: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  modeSwitch: $("modeSwitch"),
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll(".panel")],
  scanCanvas: $("scanCanvas"),
  scanTitle: $("scanTitle"),
  scanNote: $("scanNote"),
  scanLearning: $("scanLearning"),
  zSlider: $("zSlider"),
  zValue: $("zValue"),
  windowSlider: $("windowSlider"),
  windowValue: $("windowValue"),
  windowCenterSlider: $("windowCenterSlider"),
  windowCenterValue: $("windowCenterValue"),
  noiseAmpSlider: $("noiseAmpSlider"),
  noiseAmpValue: $("noiseAmpValue"),
  smoothSlider: $("smoothSlider"),
  smoothValue: $("smoothValue"),
  scanStatus: $("scanStatus"),
  scanScore: $("scanScore"),
  scanHint: $("scanHint"),
  scanHintText: $("scanHintText"),
  scanExamples: $("scanExamples"),
  labelCanvas: $("labelCanvas"),
  labelTitle: $("labelTitle"),
  labelNote: $("labelNote"),
  labelLearning: $("labelLearning"),
  labelZSlider: $("labelZSlider"),
  labelZValue: $("labelZValue"),
  labelViewMode: $("labelViewMode"),
  labelDiffHelp: $("labelDiffHelp"),
  diffDeltaSlider: $("diffDeltaSlider"),
  diffDeltaValue: $("diffDeltaValue"),
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
  dataTitle: $("dataTitle"),
  dataNote: $("dataNote"),
  dataLearning: $("dataLearning"),
  patchPreview: $("patchPreview"),
  patchSizeSlider: $("patchSizeSlider"),
  patchSizeValue: $("patchSizeValue"),
  strideSlider: $("strideSlider"),
  strideValue: $("strideValue"),
  backgroundSlider: $("backgroundSlider"),
  backgroundValue: $("backgroundValue"),
  augmentationSlider: $("augmentationSlider"),
  augmentationValue: $("augmentationValue"),
  classWeightSlider: $("classWeightSlider"),
  classWeightValue: $("classWeightValue"),
  evaluatePrepBtn: $("evaluatePrepBtn"),
  prepExamples: $("prepExamples"),
  prepStatus: $("prepStatus"),
  prepScore: $("prepScore"),
  inkMetric: $("inkMetric"),
  structureMetric: $("structureMetric"),
  noiseMetric: $("noiseMetric"),
  patchCountMetric: $("patchCountMetric"),
  modelExamples: $("modelExamples"),
  modelTitle: $("modelTitle"),
  modelNote: $("modelNote"),
  modelLearning: $("modelLearning"),
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
  modelSizeSlider: $("modelSizeSlider"),
  modelSizeValue: $("modelSizeValue"),
  testDataSlider: $("testDataSlider"),
  testDataValue: $("testDataValue"),
  lrSlider: $("lrSlider"),
  lrValue: $("lrValue"),
  regularizationSlider: $("regularizationSlider"),
  regularizationValue: $("regularizationValue"),
  thresholdSlider: $("thresholdSlider"),
  thresholdValue: $("thresholdValue"),
  trainBtn: $("trainBtn"),
  modelControlHelp: $("modelControlHelp"),
};

const smoothQuality = [0.72, 0.94, 1, 0.82, 0.56];

const examples = [
  { title: "Beispiel 1", sizeLabel: "mittel", words: ["ΧΑΙΡΕ", "ΣΟΦΙΑ"], aliases: ["CHAIRE", "SOFIA"], targetZ: 37, rotation: -0.18, x: 0.52, y: 0.49, seed: 0, noise: 1, scriptScale: 0.86 },
  { title: "Beispiel 2", sizeLabel: "groß", words: ["ΛΟΓΟΣ", "ΠΥΡΟΣ"], aliases: ["LOGOS", "PYROS"], targetZ: 29, rotation: 0.13, x: 0.49, y: 0.52, seed: 9, noise: 1.15, scriptScale: 1.28 },
  { title: "Beispiel 3", sizeLabel: "sehr klein", words: ["ΝΙΚΗ", "ΦΩΣ"], aliases: ["NIKE", "FOS"], targetZ: 45, rotation: -0.06, x: 0.55, y: 0.47, seed: 17, noise: 0.9, scriptScale: 0.48 },
];

const copy = {
  youth: {
    scanTitle: "Schicht für Schicht durch den künstlichen Papyrus",
    scanNote: "Die Schrift ist Griechisch und liegt nur auf einer dünnen, gewellten Oberfläche.",
    scanLearning: "",
    labelTitle: "Tinte über Tiefenveränderungen markieren",
    labelNote: "Die Tinte ist nicht einfach im Einzelbild sichtbar. Suche Spuren, die beim Slicen durch Nachbarschichten kurz auftauchen.",
    labelLearning: "",
    dataTitle: "Aus dem Volumen wird ein Trainingsbeispiel",
    dataNote: "Auch Hintergrund-Patches gehören ins Training. Entscheidend sind Anteil, Überlappung und Stride, damit leere Bereiche nicht alles dominieren.",
    dataLearning: "",
    modelTitle: "Eine KI-Vorhersage entsteht Schritt für Schritt",
    modelNote: "Das Training ist simuliert. Verändere Datenmenge, Testanteil und Learning Rate und beobachte Vorhersage, Fehlalarme und Loss.",
    modelLearning: "",
    labelDiffHelp: "Schicht zeigt den aktuellen Schnitt. Änderung zeigt, was sich zwischen z-1 und z+1 verändert.",
    modelControlHelp: "Trainingsrunde = Fortschritt. Trainingsdaten = gelabelte Patches. Modellgröße = Lernkapazität. Testdaten = zurückgehaltene Kontrolle. Learning Rate = Schrittweite beim Lernen.",
  },
  upper: {
    scanTitle: "CT-Volumen als Messfeld untersuchen",
    scanNote: "Der künstliche Scan ist ein 3D-Skalarfeld I(x,y,z). Tiefe, Dichtefenster und Filter bestimmen, welche Strukturen sichtbar werden.",
    scanLearning: "<p><strong>Lernziel Oberstufe:</strong> Ihr interpretiert einen CT-Scan als Funktion mit Rauschen und schwachem Signal.</p><ul><li>z-Slider: Schnitt durch ein 3D-Volumen</li><li>Dichtefenster und Fensterzentrum: lineare Abbildung eines Messbereichs auf Grauwerte</li><li>Rauschamplitude und Filter: Kompromiss zwischen Signalglättung und Detailverlust</li></ul>",
    labelTitle: "Annotation als Maske und Messproblem",
    labelNote: "Tinte ist kein klarer Farbkanal. Labels entstehen aus Hypothesen über lokale Änderungen im Volumen und bleiben unsicher.",
    labelLearning: "<p><strong>Lernziel Oberstufe:</strong> Ein Label ist eine binäre Maske, keine absolute Wahrheit.</p><ul><li>Die Änderungsansicht entspricht anschaulich einer endlichen Differenz entlang der z-Achse.</li><li>Die IoU misst Überlappung: Schnittmenge geteilt durch Vereinigungsmenge.</li><li>Gute Labels markieren nur das Signal, nicht die Papyrusstruktur.</li></ul>",
    dataTitle: "Sampling-Strategie für Trainingsdaten wählen",
    dataNote: "Patch-Größe, Stride und Hintergrundanteil bestimmen, welche Statistik das Modell später sieht.",
    dataLearning: "<p><strong>Lernziel Oberstufe:</strong> Datenvorbereitung ist eine Modellannahme.</p><ul><li>Kleine Patches sehen Details, große Patches sehen Kontext.</li><li>Stride steuert die Überlappung und damit die Zahl stark ähnlicher Beispiele.</li><li>Hintergrundanteil, Augmentation und Klassengewichtung verändern die Trainingsverteilung.</li></ul>",
    modelTitle: "Modellparameter und Generalisierung untersuchen",
    modelNote: "Die Simulation zeigt typische Trainingsphänomene: Unterfitting, Overfitting, Fehlalarme und den Einfluss der Lernrate.",
    modelLearning: "<p><strong>Lernziel Oberstufe:</strong> Ein neuronales Netz optimiert eine Verlustfunktion, liefert aber nur Wahrscheinlichkeiten.</p><ul><li>Trainingsdaten verbessern Anpassung an bekannte Beispiele.</li><li>Testdaten prüfen Generalisierung auf zurückgehaltene Beispiele.</li><li>Modellgröße, Regularisierung, Schwelle und Learning Rate steuern Stabilität, Overfitting und Fehlalarme.</li></ul>",
    labelDiffHelp: "Schicht zeigt I(x,y,z). Änderung zeigt näherungsweise |I(x,y,z+1)-I(x,y,z-1)| und hebt lokale Tiefenänderungen hervor.",
    modelControlHelp: "Trainingsrunde = Optimierungsschritt. Trainingsdaten = gelabelte Stichprobe. Modellgröße = Kapazität. Testdaten = Kontrollmenge für Generalisierung. Learning Rate = Schrittweite im Gradientenverfahren.",
  },
};

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
  ctx.font = `700 ${Math.round(width * 0.145 * example.scriptScale)}px Georgia, "Times New Roman", serif`;
  ctx.fillText(example.words[0], 0, -height * 0.12);
  ctx.font = `700 ${Math.round(width * 0.118 * example.scriptScale)}px Georgia, "Times New Roman", serif`;
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

function setTextOrHtml(element, value) {
  if (!element) return;
  if (value.includes("<")) element.innerHTML = value;
  else element.textContent = value;
}

function applyMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  const activeCopy = copy[mode];
  [
    "scanTitle",
    "scanNote",
    "scanLearning",
    "labelTitle",
    "labelNote",
    "labelLearning",
    "dataTitle",
    "dataNote",
    "dataLearning",
    "modelTitle",
    "modelNote",
    "modelLearning",
    "labelDiffHelp",
    "modelControlHelp",
  ].forEach((key) => setTextOrHtml(els[key], activeCopy[key]));
  [...els.modeSwitch.children].forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  renderScan();
  renderLabel();
  renderPrep();
  renderModel();
}

function isUpperMode() {
  return state.mode === "upper";
}

function labelViewHelp() {
  if (isUpperMode()) {
    return state.labelDiff
      ? "Änderung: angezeigt wird näherungsweise |I(x,y,z+1)-I(x,y,z-1)|. Hohe Werte bedeuten lokale Änderung entlang der z-Achse, nicht automatisch Tinte."
      : "Schicht: angezeigt wird I(x,y,z). Eine plausible Tintenstelle sollte über wenige z-Schichten kohärent bleiben.";
  }
  return state.labelDiff
    ? "Änderung: helle Stellen sind Pixel, die sich zwischen z-1 und z+1 verändern. Das macht schwache Tintenspuren leichter auffindbar."
    : "Schicht: du siehst den aktuellen Schnitt. Schiebe die Tiefe langsam und suche Spuren, die nur in wenigen Schichten auftauchen.";
}

function renderScan() {
  const example = examples[state.scanExample];
  const mask = fullGreekMasks[state.scanExample];
  const z = Number(els.zSlider.value);
  const windowWidth = Number(els.windowSlider.value) / 100;
  const center = isUpperMode() ? Number(els.windowCenterSlider.value) / 100 : 0.55;
  const noiseAmplitude = isUpperMode() ? Number(els.noiseAmpSlider.value) / 100 : 1;
  const smooth = Number(els.smoothSlider.value);
  els.zValue.textContent = z;
  els.windowValue.textContent = els.windowSlider.value;
  els.windowCenterValue.textContent = center.toFixed(2);
  els.noiseAmpValue.textContent = noiseAmplitude.toFixed(2);
  els.smoothValue.textContent = smooth;

  const ctx = els.scanCanvas.getContext("2d");
  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  const noiseBoost = (1 - smooth * 0.13) * noiseAmplitude;
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
  const idealCenter = 0.55 + (example.seed % 5 - 2) * 0.012;
  const windowQuality = Math.exp(-((Number(els.windowSlider.value) - 42) ** 2) / 520) * Math.exp(-((center - idealCenter) ** 2) / 0.004);
  const filterQuality = smoothQuality[smooth] ?? 0.75;
  const noiseQuality = Math.exp(-((noiseAmplitude - 1) ** 2) / 0.55);
  const score = clamp(Math.round(100 * rawVisibility * depthQuality * windowQuality * filterQuality * noiseQuality), 0, 100);
  els.scanScore.textContent = `Erkennung: ${score}%`;
  if (score > 70) {
    els.scanStatus.textContent = isUpperMode() ? "Hoher Kontrast: z-Lage, Intensitätsfenster und Glättung trennen Signal und Papyrus gut." : "Gute Einstellung: die Linien sind in dieser Anzeige gut vom Papyrus getrennt.";
  } else if (score > 35) {
    els.scanStatus.textContent = isUpperMode() ? "Mittlere Signalqualität: mindestens ein Parameter liegt nahe am Optimum, aber Rauschen oder Fensterung stören noch." : "Teiltreffer: Tiefe oder Dichtefenster sind nah dran, aber noch nicht optimal.";
  } else {
    els.scanStatus.textContent = isUpperMode() ? "Niedrige Signalqualität: prüfe z-Lage, Fensterbreite und den Bias durch zu starke oder zu schwache Glättung." : "Wenig Signal: vergleiche benachbarte Schichten und passe das Dichtefenster an.";
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
    ctx.font = `700 ${Math.round(72 * example.scriptScale)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.translate(SIZE * example.x, SIZE * example.y);
    ctx.rotate(example.rotation);
    ctx.fillText(example.words[0], 0, -60);
    ctx.font = `700 ${Math.round(60 * example.scriptScale)}px Georgia, serif`;
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
        const delta = isUpperMode() ? Number(els.diffDeltaSlider.value) : 1;
        const before = ctValue(sx, sy, z - delta, mask, SAMPLE, 1.1, example);
        const after = ctValue(sx, sy, z + delta, mask, SAMPLE, 1.1, example);
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
    for (let y = 0; y < LABEL_RES; y += 1) {
      for (let x = 0; x < LABEL_RES; x += 1) {
        if (userMask[y * LABEL_RES + x]) {
          ctx.fillRect((x / LABEL_RES) * width, (y / LABEL_RES) * height, width / LABEL_RES + 1, height / LABEL_RES + 1);
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
  els.diffDeltaValue.textContent = els.diffDeltaSlider.value;
  renderPatchToCanvas(els.labelCanvas, state.activePatch, state.showTruth, state.userMask, z, state.labelDiff);
  els.activePatchName.textContent = String.fromCharCode(65 + state.activePatch);
}

function paintAt(point) {
  const radius = Number(els.brushSizeSlider.value) / 2;
  const x0 = Math.floor((point.x / els.labelCanvas.width) * LABEL_RES);
  const y0 = Math.floor((point.y / els.labelCanvas.height) * LABEL_RES);
  for (let y = y0 - radius; y <= y0 + radius; y += 1) {
    for (let x = x0 - radius; x <= x0 + radius; x += 1) {
      if (x < 0 || y < 0 || x >= LABEL_RES || y >= LABEL_RES) continue;
      const d = Math.hypot(x - x0, y - y0);
      if (d <= radius) state.userMask[Math.floor(y) * LABEL_RES + Math.floor(x)] = state.paintMode === "brush" ? 1 : 0;
    }
  }
  state.showTruth = false;
  renderLabel();
}

function scoreUserMask() {
  const mask = labelMasks[state.activePatch % labelMasks.length];
  let intersection = 0;
  let union = 0;
  for (let y = 0; y < LABEL_RES; y += 1) {
    for (let x = 0; x < LABEL_RES; x += 1) {
      const sx = (x / LABEL_RES) * SAMPLE;
      const sy = (y / LABEL_RES) * SAMPLE;
      const truth = inkAlphaFromMask(mask, SAMPLE, sx, sy) > 0.35;
      const user = Boolean(state.userMask[y * LABEL_RES + x]);
      if (truth && user) intersection += 1;
      if (truth || user) union += 1;
    }
  }
  const iou = union ? Math.round((intersection / union) * 100) : 0;
  els.labelScore.textContent = `IoU: ${iou}%`;
  if (isUpperMode()) {
    els.labelStatus.textContent =
      iou > 55
        ? "Gute Annotation: Schnittmenge und Vereinigungsmenge liegen nahe beieinander."
        : "Niedrige IoU: entweder fehlen True Positives oder es wurden False Positives markiert.";
  } else {
    els.labelStatus.textContent = iou > 45 ? "Viele markierte Punkte passen zur synthetischen Wahrheit." : "Einige Spuren fehlen oder wurden mit normalen Papyrusstrukturen verwechselt.";
  }
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

  ctx.fillStyle = "rgba(0, 109, 119, 0.88)";
  ctx.font = "700 15px Inter, sans-serif";
  ctx.fillText(`Patch ${size} Voxel · Stride ${stride} Voxel`, 18, SIZE - 18);
  ctx.restore();
}

function renderPatchPreview() {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  const ctx = els.patchPreview.getContext("2d");
  const size = els.patchPreview.width;
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const patchSize = state.prep.size;
  const originX = clamp(example.x * SIZE - patchSize / 2, 0, SIZE - patchSize);
  const originY = clamp(example.y * SIZE - patchSize / 2, 0, SIZE - patchSize);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = originX + (x / size) * patchSize;
      const sy = originY + (y / size) * patchSize;
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
  const size = state.prep.size;
  const stride = Number(els.strideSlider.value);
  const backgroundTarget = Number(els.backgroundSlider.value);
  const augmentation = Number(els.augmentationSlider.value);
  const classWeight = Number(els.classWeightSlider.value);
  const gridCount = Math.max(1, Math.floor((SIZE - size) / stride) + 1);
  const patchCount = gridCount * gridCount;
  const overlap = clamp(Math.round((1 - stride / size) * 100), 0, 95);
  els.patchSizeValue.textContent = `${size} Voxel`;
  els.strideValue.textContent = `${stride} Voxel`;
  els.backgroundValue.textContent = `${backgroundTarget}%`;
  els.augmentationValue.textContent = `${augmentation}%`;
  els.classWeightValue.textContent = `${classWeight}x`;
  els.inkMetric.textContent = example.sizeLabel;
  els.structureMetric.textContent = `${overlap}%`;
  els.noiseMetric.textContent = `${backgroundTarget}%`;
  els.patchCountMetric.textContent = `${patchCount}`;

  if (!state.prep.checked) {
    els.prepScore.textContent = "Noch nicht geprüft";
    els.prepStatus.textContent = "Wähle Patch-Größe, Stride und Hintergrundanteil, dann prüfe die Entscheidung.";
  }
}

function prepTargets(example) {
  if (example.sizeLabel === "groß") return { size: [105, 160], overlap: [20, 55], background: [25, 50] };
  if (example.sizeLabel === "sehr klein") return { size: [24, 58], overlap: [55, 85], background: [30, 60] };
  return { size: [64, 105], overlap: [35, 70], background: [25, 55] };
}

function inRange(value, range) {
  return value >= range[0] && value <= range[1];
}

function evaluatePrepDecision() {
  state.prep.checked = true;
  const example = examples[state.prepExample];
  const size = state.prep.size;
  const stride = Number(els.strideSlider.value);
  const background = Number(els.backgroundSlider.value);
  const augmentation = Number(els.augmentationSlider.value);
  const classWeight = Number(els.classWeightSlider.value);
  const overlap = clamp(Math.round((1 - stride / size) * 100), 0, 95);
  const target = prepTargets(example);
  const augmentationOk = !isUpperMode() || (example.sizeLabel === "sehr klein" ? augmentation >= 45 : augmentation >= 20 && augmentation <= 70);
  const classWeightOk = !isUpperMode() || (example.sizeLabel === "sehr klein" ? classWeight >= 3 : classWeight >= 1 && classWeight <= 4);
  const checks = [
    inRange(size, target.size),
    inRange(overlap, target.overlap),
    inRange(background, target.background),
    augmentationOk,
    classWeightOk,
  ];
  const relevantChecks = isUpperMode() ? checks : checks.slice(0, 3);
  const score = relevantChecks.filter(Boolean).length;
  const hints = [];
  if (!checks[0]) hints.push(size < target.size[0] ? "Patch zu klein" : "Patch zu groß");
  if (!checks[1]) hints.push(overlap < target.overlap[0] ? "zu wenig Überlappung" : "zu viel Überlappung");
  if (!checks[2]) hints.push(background < target.background[0] ? "zu wenige Hintergrund-Patches" : "zu viele Hintergrund-Patches");
  if (isUpperMode() && !checks[3]) hints.push("Augmentation unpassend");
  if (isUpperMode() && !checks[4]) hints.push("Klassengewichtung unpassend");
  const maxScore = relevantChecks.length;
  if (score === maxScore) {
    els.prepScore.textContent = isUpperMode() ? "Sampling: ausgewogen" : "Entscheidung: gut";
    els.prepStatus.textContent = isUpperMode()
      ? `Sampling passt: Patchgröße erfasst die ${example.sizeLabel}e Schrift, Stride erzeugt sinnvolle Redundanz, Hintergrundanteil stabilisiert Negative.`
      : `Passt für ${example.sizeLabel}e Schrift: Größe, Stride und Hintergrundanteil sind ausgewogen.`;
  } else if (score >= maxScore - 1) {
    els.prepScore.textContent = isUpperMode() ? "Sampling: akzeptabel" : "Entscheidung: mittel";
    els.prepStatus.textContent = isUpperMode()
      ? `Akzeptabel, aber Bias-Risiko: ${hints.join(" und ")}.`
      : `Fast brauchbar, aber ${hints.join(" und ")}.`;
  } else {
    els.prepScore.textContent = isUpperMode() ? "Sampling: problematisch" : "Entscheidung: schwach";
    els.prepStatus.textContent = isUpperMode()
      ? `Problematische Stichprobe: ${hints.join(", ")}. Das Modell würde eine verzerrte Datenverteilung lernen.`
      : `Für ${example.sizeLabel}e Schrift ungeeignet: ${hints.join(", ")}.`;
  }
}

function modelStats(epoch = Number(els.epochSlider.value)) {
  const trainAmount = Number(els.trainDataSlider.value) / 100;
  const testAmount = Number(els.testDataSlider.value) / 100;
  const modelSize = Number(els.modelSizeSlider.value);
  const regularization = isUpperMode() ? Number(els.regularizationSlider.value) / 100 : 0.35;
  const threshold = isUpperMode() ? Number(els.thresholdSlider.value) / 100 : 0.5;
  const lr = Number(els.lrSlider.value) / 10000;
  const progress = smoothstep(0, 30, epoch);
  const lrQuality = Math.exp(-Math.abs(lr - 0.0035) * 210);
  const lrTooHigh = Math.max(0, lr - 0.006);
  const lrTooLow = Math.max(0, 0.002 - lr);
  const dataQuality = Math.sqrt(trainAmount);
  const capacity = [0, 0.64, 0.88, 1.08][modelSize];
  const overfit = Math.max(0, (modelSize - 1) * 0.16 + trainAmount * 0.28 - testAmount * 0.5 - regularization * 0.32 - 0.04);
  const underfit = Math.max(0, regularization - 0.72) * 0.35;
  const skill = clamp(progress * (0.08 + dataQuality * 0.52 + lrQuality * 0.28 + capacity * 0.24 - underfit - lrTooHigh * 28 - lrTooLow * 38), 0, 1);
  const detection = clamp(Math.round(100 * (skill * 0.78 + trainAmount * 0.12 + capacity * 0.08 - Math.max(0, threshold - 0.5) * 0.28)), 0, 100);
  const falseAlarms = clamp(Math.round(72 * (1 - skill) + overfit * 54 + lrTooHigh * 9000 + (1 - testAmount) * 10 - Math.max(0, threshold - 0.5) * 38 + Math.max(0, 0.5 - threshold) * 42), 0, 99);
  const generalization = clamp(Math.round(100 * (skill * 0.52 + testAmount * 0.52 - overfit * 0.5 - underfit * 0.4 - lrTooHigh * 32 - lrTooLow * 24)), 0, 100);
  let behavior = "stabil";
  if (trainAmount < 0.25) behavior = "zu wenig Daten";
  else if (overfit > 0.22) behavior = "überfit";
  else if (testAmount < 0.12) behavior = "Testset klein";
  else if (underfit > 0.08) behavior = "unterfit";
  else if (lrTooLow > 0) behavior = "lernt langsam";
  else if (lrTooHigh > 0) behavior = "instabil";
  else if (epoch < 8) behavior = "lernt noch";
  return { trainAmount, testAmount, modelSize, capacity, regularization, threshold, overfit, underfit, lr, lrQuality, lrTooHigh, lrTooLow, skill, detection, falseAlarms, generalization, behavior };
}

function renderModel() {
  renderModelInput();
  renderPrediction();
  renderLoss();
  els.epochValue.textContent = els.epochSlider.value;
  els.trainDataValue.textContent = `${els.trainDataSlider.value}%`;
  els.modelSizeValue.textContent = ["", "klein", "mittel", "groß"][Number(els.modelSizeSlider.value)];
  els.testDataValue.textContent = `${els.testDataSlider.value}%`;
  els.lrValue.textContent = (Number(els.lrSlider.value) / 10000).toFixed(4);
  els.regularizationValue.textContent = (Number(els.regularizationSlider.value) / 100).toFixed(2);
  els.thresholdValue.textContent = (Number(els.thresholdSlider.value) / 100).toFixed(2);
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
      const falseAlarm = valueNoise(sx, sy, epoch + example.seed, 12) * (1 - stats.skill) * 0.62 + stats.overfit * valueNoise(sx + 31, sy - 19, epoch, 7) * 0.45 + stats.lrTooHigh * hashNoise(sx, sy, epoch) * 36;
      const pred = clamp(truth * stats.skill * (1.65 + stats.capacity) + falseAlarm - (1 - stats.trainAmount) * 0.08 - Math.max(0, stats.threshold - 0.5) * 0.22, 0, 1);
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
    return 0.9 * Math.exp(-progress * rate) + 0.12 + (1 - stats.testAmount) * 0.12 + stats.lrTooHigh * 12 + overfitGap + stats.overfit * progress * 0.22 + stats.underfit * 0.18;
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
    els.guessStatus.textContent = isUpperMode() ? "Hypothese bestätigt: beide Wörter passen zur synthetischen Ground Truth." : "Passt: beide gesuchten Wörter wurden erkannt.";
  } else if (hits === 1) {
    els.guessStatus.textContent = isUpperMode() ? "Teilweise Evidenz: ein Wort stimmt, die zweite Lesung bleibt unsicher." : "Teiltreffer: ein Wort passt, das zweite noch nicht.";
  } else {
    els.guessStatus.textContent = isUpperMode() ? "Hypothese nicht gestützt. Prüfe, ob die Vorhersage eher Signal oder Fehlalarm zeigt." : "Noch kein Treffer. Versuche, die stärksten Linien in der Vorhersage zu lesen.";
  }
}

function wireEvents() {
  els.modeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    applyMode(button.dataset.mode);
  });

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === tab.dataset.tab));
    });
  });

  [els.zSlider, els.windowSlider, els.windowCenterSlider, els.noiseAmpSlider, els.smoothSlider].forEach((input) => input.addEventListener("input", renderScan));
  els.scanHint.addEventListener("click", () => {
    const hints = isUpperMode()
      ? [
          "Varriere z langsam: echte Struktur sollte über wenige benachbarte Schnitte kohärent bleiben.",
          "Verkleinere das Dichtefenster, wenn der Kontrast zu niedrig ist; vergrößere es, wenn alles gesättigt wirkt.",
          "Glättung reduziert Varianz, kann aber dünne Linien als Bias entfernen.",
        ]
      : [
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
    els.scanHintText.textContent = isUpperMode() ? "Starte neben der erwarteten Oberfläche und beobachte die Signalstabilität über z." : "Starte etwas neben der Oberfläche und suche die Schichtfolge.";
    renderScan();
  });

  els.labelZSlider.addEventListener("input", renderLabel);
  els.diffDeltaSlider.addEventListener("input", renderLabel);
  els.labelViewMode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    state.labelDiff = button.dataset.mode === "diff";
    [...els.labelViewMode.children].forEach((child) => child.classList.toggle("active", child === button));
    els.labelDiffHelp.textContent = labelViewHelp();
    els.labelStatus.textContent = state.labelDiff
      ? isUpperMode()
        ? "Differenzbild: markiere nur plausible Signaländerungen, nicht jede Kante."
        : "Änderungsansicht: markiere auffällige, lokal begrenzte Veränderungen."
      : isUpperMode()
        ? "Schichtbild: suche kohärente Strukturen über wenige Tiefenschichten."
        : "Schichtansicht: markiere stabile Spuren über wenige Tiefenschichten.";
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
    els.labelStatus.textContent = isUpperMode() ? "Annotiere eine binäre Maske für eine plausible Tintenhypothese." : "Slice durch die Tiefen und markiere Spuren, die in wenigen Schichten auftauchen.";
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
    state.prep.checked = false;
    state.prep.size = Number(els.patchSizeSlider.value);
    renderPrep();
  });
  [els.strideSlider, els.backgroundSlider, els.augmentationSlider, els.classWeightSlider].forEach((input) =>
    input.addEventListener("input", () => {
      state.prep.checked = false;
      renderPrep();
    }),
  );
  els.prepExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.prepExample = Number(button.dataset.example);
    state.prep.checked = false;
    [...els.prepExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    renderPrep();
  });
  els.evaluatePrepBtn.addEventListener("click", () => {
    evaluatePrepDecision();
    renderPrep();
  });

  els.modelExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.modelExample = Number(button.dataset.example);
    [...els.modelExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    els.guessInput.value = "";
    els.guessStatus.textContent = isUpperMode() ? "Formuliere eine Lesung als Hypothese und prüfe sie gegen die synthetische Ground Truth." : "Keine Wahrheit anzeigen: erst aus Scan und Vorhersage eine Vermutung bilden.";
    renderModel();
  });
  els.guessBtn.addEventListener("click", checkGuess);
  els.guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkGuess();
  });
  [els.epochSlider, els.trainDataSlider, els.modelSizeSlider, els.testDataSlider, els.lrSlider, els.regularizationSlider, els.thresholdSlider].forEach((input) => input.addEventListener("input", renderModel));
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
  applyMode("youth");
}

init();
