const SIZE = 520;
const SAMPLE = 156;
const LABEL_RES = 520;
const TWO_PI = Math.PI * 2;

const state = {
  mode: "upper",
  scanExample: 0,
  prepExample: 0,
  modelExample: 0,
  activePatch: 0,
  paintMode: "brush",
  userMask: new Uint8Array(LABEL_RES * LABEL_RES),
  showTruth: false,
  labelDiff: false,
  hintIndex: 0,
  prep: { x: 210, y: 215, size: 86, checked: false, extracting: false, extractionIndex: -1, extractedPatches: [], activeExtracted: -1 },
  labelView: { scale: 1, x: 0, y: 0, pinch: null },
  trainTimer: null,
  prepTimer: null,
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
  patchCountGuess: $("patchCountGuess"),
  patchCountFeedback: $("patchCountFeedback"),
  patchReview: $("patchReview"),
  patchGallery: $("patchGallery"),
  patchReviewNote: $("patchReviewNote"),
  selectedPatchCanvas: $("selectedPatchCanvas"),
  selectedPatchTitle: $("selectedPatchTitle"),
  selectedPatchMetrics: $("selectedPatchMetrics"),
  prevPatchBtn: $("prevPatchBtn"),
  nextPatchBtn: $("nextPatchBtn"),
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
  infoDialog: $("infoDialog"),
  infoClose: $("infoClose"),
  infoTitle: $("infoTitle"),
  infoGeneral: $("infoGeneral"),
  infoSpecific: $("infoSpecific"),
};

const smoothQuality = [0.72, 0.94, 1, 0.82, 0.56];

const examples = [
  { title: "Beispiel 1", sizeLabel: "mittel", words: ["ΧΑΙΡΕ", "ΣΟΦΙΑ"], aliases: ["CHAIRE", "SOFIA"], targetZ: 37, rotation: -0.18, x: 0.52, y: 0.49, seed: 0, noise: 1, scriptScale: 0.86 },
  { title: "Beispiel 2", sizeLabel: "groß", words: ["ΛΟΓΟΣ", "ΠΥΡΟΣ"], aliases: ["LOGOS", "PYROS"], targetZ: 29, rotation: 0.13, x: 0.49, y: 0.52, seed: 9, noise: 1.15, scriptScale: 1.28 },
  { title: "Beispiel 3", sizeLabel: "sehr klein", words: ["ΝΙΚΗ", "ΦΩΣ"], aliases: ["NIKE", "FOS"], targetZ: 45, rotation: -0.06, x: 0.55, y: 0.47, seed: 17, noise: 0.9, scriptScale: 0.48 },
];

const realScrollSample = {
  scanExample: 2,
  depth: 40,
  tileSize: 156,
  cols: 8,
  src: "assets/vesuvius_sample/real_scroll_atlas.png",
  source: "Vesuvius Challenge, Scroll 1, Segment 20230516112444",
};

const realScrollImage = new Image();
realScrollImage.src = realScrollSample.src;
realScrollImage.addEventListener("load", () => {
  if (state.scanExample === realScrollSample.scanExample) renderScan();
});

const copy = {
  youth: {
    scanTitle: "Schicht für Schicht durch den künstlichen Papyrus",
    scanNote: "Verändere Tiefe, Kontrast und Filter so, dass im Schichtbild möglichst viele zusammenhängende Schriftspuren sichtbar werden.",
    scanLearning: "",
    labelTitle: "Tinte über Tiefenveränderungen markieren",
    labelNote: "Aufgabe: Fahre durch die Tiefenschichten, finde alle Schriftspuren und markiere sie mit dem Pinsel. Vergleiche am Ende mit der synthetischen Wahrheit.",
    labelLearning: "",
    dataTitle: "Aus dem Volumen wird ein Trainingsbeispiel",
    dataNote: "Aufgabe: Wähle Patch-Größe, Stride und Hintergrundanteil so, dass aus dem Bild sinnvolle Trainingsbeispiele entstehen. Erzeuge danach die Patches.",
    dataLearning: "",
    modelTitle: "Eine KI-Vorhersage entsteht Schritt für Schritt",
    modelNote: "Aufgabe: Stelle die Trainingsparameter ein, starte das Training und beobachte, wann die Vorhersage lesbar wird oder Fehlalarme entstehen.",
    modelLearning: "",
    labelDiffHelp: "Schicht zeigt den aktuellen Schnitt. Differenzbild zeigt, was sich zwischen zwei benachbarten Tiefenschichten verändert.",
    modelControlHelp: "Trainingsrunde = Fortschritt. Trainingsdaten = erzeugte gelabelte Patches. Modellgröße = Lernkapazität. Testbild = zurückgehaltene Kontrolle. Learning Rate = Schrittweite beim Lernen.",
  },
  upper: {
    scanTitle: "CT-Volumen als Messfeld untersuchen",
    scanNote: "Aufgabe: Finde Parameter, bei denen aus dem verrauschten 3D-Messfeld möglichst viel zusammenhängende Schrift sichtbar wird. Tiefe, Dichtefenster und Filter verändern die Darstellung desselben Volumens.",
    scanLearning: "<p><strong>Lernziel:</strong> Ihr interpretiert einen CT-Scan als Funktion mit Rauschen und schwachem Signal.</p><ul><li>z-Slider: Schnitt durch ein 3D-Volumen</li><li>Dichtefenster und Dichte-Mitte: lineare Abbildung eines Messbereichs auf Grauwerte</li><li>Rauschamplitude und Filter: Kompromiss zwischen Signalglättung und Detailverlust</li></ul>",
    labelTitle: "Annotation als Maske und Messproblem",
    labelNote: "Aufgabe: Untersuche Schichtbild und Differenzbild, markiere alle plausiblen Schriftspuren über mehrere Tiefenschichten und bewerte deine Maske mit der IoU.",
    labelLearning: "<p><strong>Lernziel:</strong> Ein Label ist eine binäre Maske, keine absolute Wahrheit.</p><ul><li>Das Differenzbild vergleicht zwei benachbarte Tiefenschichten.</li><li>Die IoU misst Überlappung: Schnittmenge geteilt durch Vereinigungsmenge.</li><li>Gute Labels markieren nur das Signal, nicht die Papyrusstruktur.</li></ul>",
    dataTitle: "Sampling-Strategie für Trainingsdaten wählen",
    dataNote: "Aufgabe: Lege eine Sampling-Strategie fest: Wähle Patch-Größe, Stride und Hintergrundanteil, berechne die Patchzahl und erzeuge dann die Trainingspatches.",
    dataLearning: "<p><strong>Lernziel:</strong> Datenvorbereitung entscheidet, was ein Modell überhaupt lernen kann.</p><ul><li>Das Netz sieht nicht die ganze Rolle, sondern viele Patches als Stichprobe.</li><li>Kleine Patches sehen Details, große Patches sehen Kontext; beides verändert die gelernte Statistik.</li><li>Stride und Hintergrundanteil bestimmen, ob das Training echte Schrift, leere Papyrusstruktur oder redundante Beispiele dominiert.</li></ul>",
    modelTitle: "Modellparameter und Generalisierung untersuchen",
    modelNote: "Aufgabe: Trainiere mit verschiedenen Parametern und finde eine Einstellung, bei der die Vorhersage auf dem Testbild möglichst lesbar ist und wenige Fehlalarme enthält.",
    modelLearning: "<p><strong>Lernziel:</strong> Ein neuronales Netz optimiert eine Verlustfunktion, liefert aber nur Wahrscheinlichkeiten.</p><ul><li>Trainingsdaten verbessern die Anpassung an bekannte Beispiele; Testdaten messen sie nur auf zurückgehaltenen Bildern.</li><li>Augmentation und Klassengewichtung gehören zum Training, weil sie verändern, welche Beispiele und Fehler stärker zählen.</li><li>Modellgröße, Regularisierung, Schwelle und Learning Rate steuern Stabilität, Overfitting und Fehlalarme.</li></ul>",
    labelDiffHelp: "Differenzbild: angezeigt wird der Unterschied zwischen einer Schicht davor und einer Schicht danach. Helle Stellen bedeuten Änderung entlang der z-Achse, nicht automatisch Tinte.",
    modelControlHelp: "Trainingsrunde = Optimierungsschritt. Trainingsdaten = gelabelte Patch-Stichprobe. Testdaten = Kontrollmenge, nicht zusätzliche Lerninformation. Augmentation erzeugt Varianten, Klassengewichtung betont seltene Tinte. Learning Rate = Schrittweite im Gradientenverfahren.",
  },
};

const infoTerms = {
  volumeDepth: {
    title: "Tiefe im Volumen",
    general: "Ein Volumen hat neben x- und y-Koordinate auch eine z-Koordinate. Ein einzelner z-Wert zeigt nur eine Schicht des dreidimensionalen Messfelds.",
    specific: "Mit der z-Koordinate sieht man, dass Schriftspuren in unterschiedlichen Tiefenschichten unterschiedlich gut erhalten sind. Suche deshalb keine einzelne perfekte Ebene, sondern eine kurze Schichtfolge mit zusammenhängenden Linien.",
  },
  densityWindow: {
    title: "Dichtefenster",
    general: "Ein Dichtefenster legt fest, welcher Wertebereich eines Scans auf hell und dunkel abgebildet wird. Ein enges Fenster erhöht Kontrast, kann aber Werte abschneiden.",
    specific: () => `In dieser Station entscheidet das Dichtefenster mit darüber, ob die schwache Tinte vom Papyrus getrennt wird. Aktuell ist die Breite ${els.windowSlider.value}.`,
  },
  windowCenter: {
    title: "Dichte-Mitte",
    general: "Die Dichte-Mitte legt fest, um welchen Messwert herum das Dichtefenster liegt. Sie verschiebt also, welcher Dichtebereich im Bild besonders kontrastreich dargestellt wird.",
    specific: "In dieser Demo verschiebt die Dichte-Mitte den sichtbaren Schwerpunkt zwischen Papyrus, Rauschen und möglicher Tinte. Wenn sie ungünstig liegt, wird der Kontrast schlechter, obwohl die richtige Tiefe gewählt sein kann.",
  },
  noiseAmplitude: {
    title: "Rauschamplitude",
    general: "Rauschamplitude beschreibt, wie stark zufällige Messschwankungen gegenüber dem eigentlichen Signal sind. Je größer sie ist, desto schlechter wird das Signal-Rausch-Verhältnis.",
    specific: () => `In der Demo erschwert hohe Rauschamplitude das Erkennen der griechischen Linien. Bei niedrigerer Amplitude wirkt der Scan sauberer, aber auch weniger realistisch.`,
  },
  noiseFilter: {
    title: "Rauschfilter",
    general: "Ein Filter mittelt benachbarte Bildwerte, um zufällige Schwankungen zu reduzieren. Dabei gehen immer auch feine Details verloren.",
    specific: () => `Hier hilft ein kleiner Filter gegen körniges Rauschen. Zu starke Glättung verschmiert die dünnen Schriftspuren, besonders bei Beispiel 3 mit sehr kleiner Schrift.`,
  },
  sliceDepth: {
    title: "Tiefenschicht",
    general: "Eine Tiefenschicht ist ein zweidimensionaler Schnitt durch ein dreidimensionales Volumen. Sichtbare Strukturen können in benachbarten Schichten wandern oder verschwinden.",
    specific: "Beim Labeln sollst du nicht ein Einzelbild glauben, sondern mehrere Schichten vergleichen. Plausible Tinte zeigt sich als kurze, zusammenhängende Spur über wenige benachbarte Tiefenschichten.",
  },
  deltaZ: {
    title: "Differenzbild-Abstand",
    general: "Ja: Das ist ein Differenzbild. Es vergleicht zwei Tiefenschichten und zeigt hell an, wo sich die Bildwerte zwischen ihnen stark ändern.",
    specific: () => `Der Abstand ${els.diffDeltaSlider.value} bedeutet: Die Demo vergleicht eine Schicht davor mit einer Schicht danach. Kleine Abstände zeigen feine Änderungen, größere Abstände betonen gröbere Unterschiede.`,
  },
  brushSize: {
    title: "Pinseldicke",
    general: "Die Pinseldicke bestimmt, wie viele Pixel oder Voxel mit einem Strich markiert werden. Für dünne Strukturen ist ein zu breiter Pinsel ungenau.",
    specific: () => `Hier beeinflusst die Pinseldicke direkt die IoU. Wenn der Pinsel breiter als die Schriftspur ist, markierst du zu viel Hintergrund und die Überlappung wird schlechter.`,
  },
  patchSize: {
    title: "Patch-Größe",
    general: "Ein Patch ist ein kleiner Ausschnitt aus dem Scan, den das Modell als Trainingsbeispiel sieht. Die Größe entscheidet, wie viel lokaler Kontext enthalten ist.",
    specific: () => {
      const example = examples[state.prepExample];
      return `Dieses Beispiel enthält ${example.sizeLabel}e Schrift. Große Schrift braucht eher größere Patches, sehr kleine Schrift eher kleinere Patches mit genug Auflösung.`;
    },
  },
  stride: {
    title: "Stride / Überlappung",
    general: "Stride ist der Abstand zwischen zwei benachbarten Patches. Kleiner Stride bedeutet stärkere Überlappung und mehr, aber ähnlichere Trainingsbeispiele.",
    specific: () => {
      const size = state.prep.size;
      const stride = Number(els.strideSlider.value);
      const reused = clamp(Math.round((1 - stride / size) * 100), 0, 95);
      return `Aktuell wird das Fenster um ${stride} Voxel verschoben. Bei ${size} Voxel Patchgröße werden horizontal ungefähr ${reused}% des vorherigen Patches erneut genutzt.`;
    },
  },
  backgroundShare: {
    title: "Hintergrund-Anteil",
    general: "Der Hintergrund-Anteil beschreibt, wie viele Trainingsbeispiele keine gesuchte Struktur enthalten. Solche Negativbeispiele sind wichtig, dürfen aber nicht dominieren.",
    specific: () => `Hier sollen auch leere Papyrusbereiche ins Training, damit das Modell Fehlalarme vermeidet. Zu viel Hintergrund kann aber dazu führen, dass das Modell kaum noch Tinte erwartet.`,
  },
  augmentation: {
    title: "Augmentation",
    general: "Augmentation erzeugt künstliche Varianten von Trainingsdaten, zum Beispiel leicht verschobene, gedrehte oder verrauschte Patches. Das kann Generalisierung verbessern.",
    specific: () => `In dieser Demo hilft Augmentation besonders bei sehr kleiner Schrift, weil aus wenigen sichtbaren Spuren mehr plausible Trainingsvarianten entstehen.`,
  },
  classWeight: {
    title: "Klassengewichtung",
    general: "Klassengewichtung verändert, wie stark Fehler für seltene Klassen zählen. Seltene Tinte kann dadurch wichtiger werden als häufigerer Hintergrund.",
    specific: () => `Hier ist Tinte viel seltener als Papyrus. Eine höhere Gewichtung kann verhindern, dass das Modell einfach fast alles als Hintergrund behandelt.`,
  },
  epoch: {
    title: "Trainingsrunde",
    general: "Eine Trainingsrunde steht hier für fortschreitende Optimierung. Das Modell passt seine Parameter wiederholt an, um den Loss zu senken.",
    specific: () => `Bei niedriger Trainingsrunde ist die Vorhersage unsicher. Mit mehr Runden werden Linien klarer, solange Learning Rate und Datenqualität passen.`,
  },
  trainData: {
    title: "Trainingsdaten",
    general: "Trainingsdaten sind die gelabelten Beispiele, mit denen ein Modell seine Parameter lernt. Mehr Daten helfen nur, wenn sie repräsentativ und nicht zu einseitig sind.",
    specific: () => {
      const count = state.prep.extractedPatches.length;
      return count
        ? `In dieser Simulation steht der Regler für den Anteil der zuvor erzeugten ${count} Trainingspatches, die ins Training gehen. Schlechte Sampling-Parameter erzeugen trotzdem Fehlalarme.`
        : "In dieser Simulation steht der Regler für den Anteil der erzeugten Trainingspatches. Erzeuge in Station 3 erst Patches, dann ist dieser Bezug anschaulicher.";
    },
  },
  modelSize: {
    title: "Modellgröße",
    general: "Modellgröße steht für Kapazität: Ein größeres Modell kann komplexere Muster lernen, kann aber auch leichter Rauschen auswendig lernen.",
    specific: () => `Hier erkennt ein größeres Modell mehr Schriftstruktur. Bei wenig Testdaten oder schwacher Regularisierung steigt aber das Risiko von Overfitting.`,
  },
  testData: {
    title: "Testdaten",
    general: "Testdaten werden nicht zum Lernen benutzt. Sie verbessern das Modell nicht direkt, sondern prüfen, wie gut es auf zurückgehaltenen Beispielen funktioniert.",
    specific: () => `In der Demo macht ein größerer Testdatenanteil die Kontrolle aussagekräftiger. Die Generalisierung selbst steigt dadurch nicht automatisch; sie hängt von Training, Modellgröße, Regularisierung und Datenqualität ab.`,
  },
  learningRate: {
    title: "Learning Rate",
    general: "Die Learning Rate bestimmt die Schrittweite bei der Optimierung. Zu kleine Schritte lernen langsam, zu große Schritte können am Minimum vorbeispringen.",
    specific: () => `Hier ist ein mittlerer Wert meist stabil. Eine zu hohe Learning Rate erhöht Fehlalarme und macht die Loss-Kurve unruhiger.`,
  },
  regularization: {
    title: "Regularisierung",
    general: "Regularisierung bestraft zu komplizierte Lösungen. Sie soll verhindern, dass ein Modell Rauschen oder einzelne Trainingsbeispiele auswendig lernt.",
    specific: () => `In dieser KI-Station senkt Regularisierung Overfitting. Zu viel davon kann aber echte Schriftlinien unterdrücken und die Erkennung verschlechtern.`,
  },
  threshold: {
    title: "Schwelle",
    general: "Eine Schwelle entscheidet, ab welcher Wahrscheinlichkeit ein Pixel als Tinte gilt. Sie macht aus einer kontinuierlichen Vorhersage eine Ja-Nein-Entscheidung.",
    specific: () => `Eine niedrige Schwelle findet mehr mögliche Tinte, erzeugt aber mehr Fehlalarme. Eine hohe Schwelle ist vorsichtiger, übersieht aber schwache Linien.`,
  },
  detection: {
    title: "Erkennung",
    general: "Erkennung beschreibt, wie viel des gesuchten Signals vom Modell gefunden wird. Hohe Erkennung heißt nicht automatisch, dass keine Fehlalarme entstehen.",
    specific: () => `Hier steigt Erkennung, wenn Training, Datenmenge und Modellkapazität gut zusammenspielen. Die Schwelle kann Erkennung bewusst erhöhen oder verringern.`,
  },
  falseAlarms: {
    title: "Fehlalarme",
    general: "Fehlalarme sind Stellen, die als Signal markiert werden, obwohl dort keines ist. In Segmentierung sind sie falsch positive Vorhersagen.",
    specific: () => `In dieser Demo sehen Fehlalarme wie zusätzliche gelbe Flecken in der Vorhersage aus. Sie entstehen vor allem bei zu wenig Daten, zu niedriger Schwelle oder instabilem Training.`,
  },
  generalization: {
    title: "Generalisierung",
    general: "Generalisierung bedeutet, dass ein Modell nicht nur bekannte Trainingsbeispiele löst, sondern auch neue ähnliche Fälle.",
    specific: () => `Hier verbessern passende Trainingsdaten, Regularisierung und stabile Optimierung die Generalisierung. Testdaten messen sie nur zuverlässiger; sie machen das Modell nicht von selbst besser.`,
  },
  learningBehavior: {
    title: "Lernverhalten",
    general: "Lernverhalten fasst typische Zustände des Trainings zusammen, etwa stabil, instabil, unterfit oder überfit.",
    specific: () => `Die Anzeige bewertet deine Parameterkombination. Sie reagiert zum Beispiel auf zu wenig Daten, zu hohe Learning Rate oder zu starke Regularisierung.`,
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



function clampLabelView() {
  const view = state.labelView;
  view.scale = clamp(view.scale, 1, 4);
  if (view.scale <= 1.001) {
    view.scale = 1;
    view.x = 0;
    view.y = 0;
    return;
  }
  const min = els.labelCanvas.width * (1 - view.scale);
  view.x = clamp(view.x, min, 0);
  view.y = clamp(view.y, min, 0);
}

function zoomLabelAt(point, factor) {
  const view = state.labelView;
  const beforeX = (point.x - view.x) / view.scale;
  const beforeY = (point.y - view.y) / view.scale;
  view.scale = clamp(view.scale * factor, 1, 4);
  view.x = point.x - beforeX * view.scale;
  view.y = point.y - beforeY * view.scale;
  clampLabelView();
}

function labelContentPoint(point) {
  const view = state.labelView;
  return {
    x: (point.x - view.x) / view.scale,
    y: (point.y - view.y) / view.scale,
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
  els.labelStatus.textContent = isUpperMode() ? "Suche die Schrift über mehrere Tiefenschichten und markiere alle sichtbaren Schriftspuren." : "Slice durch die Tiefen und markiere alle Schriftspuren, die du findest.";
  els.scanHintText.textContent = "Finde die Darstellung, in der du die meiste Schrift siehst.";
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
      ? "Differenzbild: angezeigt wird näherungsweise |I(x,y,z+d)-I(x,y,z-d)|. Helle Werte zeigen lokale Änderung entlang der z-Achse, nicht automatisch Tinte."
      : "Schicht: angezeigt wird I(x,y,z). Suche über alle Tiefenschichten nach zusammenhängenden Schriftspuren.";
  }
  return state.labelDiff
    ? "Differenzbild: helle Stellen sind Pixel, die sich zwischen benachbarten Tiefenschichten verändern."
    : "Schicht: du siehst den aktuellen Schnitt. Schiebe die Tiefe langsam und suche alle Schriftspuren.";
}

function renderScan() {
  const maxZ = state.scanExample === realScrollSample.scanExample ? realScrollSample.depth - 1 : 65;
  els.zSlider.max = String(maxZ);
  if (Number(els.zSlider.value) > maxZ) els.zSlider.value = maxZ;
  if (state.scanExample === realScrollSample.scanExample) {
    renderRealScrollScan();
    return;
  }
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
  const noiseBoost = (1 - smooth * 0.18) * noiseAmplitude;
  const depthPreview = Math.exp(-((z - example.targetZ) ** 2) / 18);
  let visibleInk = 0;
  let truthInk = 0;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let v = ctValue(x, y, z, mask, SIZE, noiseBoost, example);
      if (smooth > 1) {
        v = (v + ctValue(x + 1, y, z, mask, SIZE, noiseBoost, example) + ctValue(x, y + 1, z, mask, SIZE, noiseBoost, example)) / 3;
      }
      const normalized = clamp((v - (center - windowWidth / 2)) / windowWidth, 0, 1);
      const contrast = Math.pow(smoothstep(0.03, 0.97, normalized), clamp(1.35 - windowWidth * 0.7, 0.72, 1.32));
      const papyrus = Math.round(18 + contrast * 236);
      const ink = inkSignal(x, y, z, mask, SIZE, example);
      const inkBoost = clamp(ink * 3.4 * depthPreview, 0, 1);
      if (inkAlphaFromMask(mask, SIZE, x, y) > 0.35) truthInk += 1;
      if (ink > 0.17 && contrast > 0.08 && contrast < 0.98) visibleInk += 1;
      const idx = (y * SIZE + x) * 4;
      data[idx] = clamp(papyrus + fiber(x, y, example) * 18 - inkBoost * 98, 0, 255);
      data[idx + 1] = clamp(papyrus * 0.96 + 12 - inkBoost * 84, 0, 255);
      data[idx + 2] = clamp(papyrus * 0.82 + 10 - inkBoost * 60, 0, 255);
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
    els.scanStatus.textContent = isUpperMode() ? "Viele Schriftzüge sichtbar: Tiefe, Dichtefenster und Filter passen für diese Darstellung gut zusammen." : "Gute Einstellung: hier siehst du viele zusammenhängende Schriftspuren.";
  } else if (score > 35) {
    els.scanStatus.textContent = isUpperMode() ? "Ein Teil der Schrift ist sichtbar: verändere jeweils nur einen Regler und beobachte, ob Linien klarer oder blasser werden." : "Teiltreffer: einige Linien sind sichtbar, andere verschwinden noch im Hintergrund.";
  } else {
    els.scanStatus.textContent = isUpperMode() ? "Kaum Schrift erkennbar: suche eine andere Tiefenschicht oder ein kontrastreicheres Dichtefenster, bis mehrere Buchstaben zusammenhängend sichtbar werden." : "Kaum Schrift erkennbar: verschiebe Tiefe oder Dichtefenster, bis mehr Buchstaben sichtbar werden.";
  }
}

function renderRealScrollScan() {
  const z = clamp(Number(els.zSlider.value), 0, realScrollSample.depth - 1);
  const windowWidth = Number(els.windowSlider.value) / 100;
  const center = isUpperMode() ? Number(els.windowCenterSlider.value) / 100 : 0.55;
  const smooth = Number(els.smoothSlider.value);
  els.zValue.textContent = z;
  els.windowValue.textContent = els.windowSlider.value;
  els.windowCenterValue.textContent = center.toFixed(2);
  els.noiseAmpValue.textContent = isUpperMode() ? (Number(els.noiseAmpSlider.value) / 100).toFixed(2) : "1.00";
  els.smoothValue.textContent = smooth;

  const ctx = els.scanCanvas.getContext("2d");
  if (!realScrollImage.complete || !realScrollImage.naturalWidth) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#66645f";
    ctx.font = "700 18px Inter, sans-serif";
    ctx.fillText("Echter Ausschnitt wird geladen...", 32, 60);
    els.scanScore.textContent = "Echter Scan";
    els.scanStatus.textContent = "Der reale Vesuvius-Ausschnitt wird lokal geladen.";
    return;
  }

  const tile = realScrollSample.tileSize;
  const sx = (z % realScrollSample.cols) * tile;
  const sy = Math.floor(z / realScrollSample.cols) * tile;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(realScrollImage, sx, sy, tile, tile, 0, 0, SIZE, SIZE);
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let v = data[i] / 255;
    v = clamp((v - (center - windowWidth / 2)) / windowWidth, 0, 1);
    v = Math.pow(smoothstep(0.04, 0.96, v), clamp(1.35 - windowWidth * 0.7, 0.72, 1.32));
    const g = Math.round(v * 244 + 6);
    data[i] = g;
    data[i + 1] = Math.round(g * 0.96 + 5);
    data[i + 2] = Math.round(g * 0.86 + 8);
  }
  ctx.putImageData(image, 0, 0);

  if (smooth > 0) {
    ctx.save();
    ctx.globalAlpha = smooth * 0.035;
    ctx.filter = `blur(${smooth}px)`;
    ctx.drawImage(els.scanCanvas, 0, 0);
    ctx.restore();
    ctx.filter = "none";
  }

  ctx.save();
  ctx.strokeStyle = "rgba(0, 109, 119, 0.48)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(74, 74, 372, 372);
  ctx.restore();

  els.scanScore.textContent = "Echter Scan";
  els.scanStatus.textContent = isUpperMode()
    ? `${realScrollSample.source}: reale Papyruslagen und Risse, keine hinterlegte Schriftlösung. Vergleiche die Schichtfolge über z.`
    : "Echter Ausschnitt: Suche Papyruslagen, Risse und Strukturen, aber keine versteckte Lösung.";
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
  const source = document.createElement("canvas");
  source.width = els.labelCanvas.width;
  source.height = els.labelCanvas.height;
  renderPatchToCanvas(source, state.activePatch, state.showTruth, state.userMask, z, state.labelDiff);
  const ctx = els.labelCanvas.getContext("2d");
  clampLabelView();
  ctx.clearRect(0, 0, els.labelCanvas.width, els.labelCanvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(state.labelView.scale, 0, 0, state.labelView.scale, state.labelView.x, state.labelView.y);
  ctx.drawImage(source, 0, 0);
  ctx.restore();
  els.activePatchName.textContent = String.fromCharCode(65 + state.activePatch);
}

function paintAt(point) {
  const content = labelContentPoint(point);
  if (content.x < 0 || content.y < 0 || content.x >= els.labelCanvas.width || content.y >= els.labelCanvas.height) return;
  const radius = Number(els.brushSizeSlider.value);
  const x0 = Math.floor((content.x / els.labelCanvas.width) * LABEL_RES);
  const y0 = Math.floor((content.y / els.labelCanvas.height) * LABEL_RES);
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

  drawPrepPatchFocus(ctx);
  drawRedundancyDemo(ctx);
  drawExtractionOverlay(ctx);

  renderPatchPreview();
  updatePatchMetrics();
  renderExtractedPatchGallery();
}


function drawPrepPatchFocus(ctx) {
  const size = state.prep.size;
  const x = (SIZE - size) / 2;
  const y = (SIZE - size) / 2;
  ctx.save();
  ctx.fillStyle = "rgba(255, 216, 102, 0.16)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(215, 138, 0, 0.95)";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.restore();
}

function patchGrid(size = state.prep.size, stride = Number(els.strideSlider.value)) {
  const count = Math.max(1, Math.floor((SIZE - size) / stride) + 1);
  const patches = [];
  for (let y = 0; y < count; y += 1) {
    for (let x = 0; x < count; x += 1) {
      patches.push({ x: x * stride, y: y * stride, size });
    }
  }
  return { count, total: count * count, patches };
}

function drawRedundancyDemo(ctx) {
  const stride = Number(els.strideSlider.value);
  const size = state.prep.size;
  const demoSize = 118;
  const x = 18;
  const y = SIZE - demoSize - 18;
  const scale = demoSize / size;
  const shift = Math.min(stride * scale, demoSize + 18);
  const overlapWidth = clamp(demoSize - shift, 0, demoSize);
  const overlapPct = clamp(Math.round((1 - stride / size) * 100), 0, 95);

  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 248, 0.74)";
  ctx.fillRect(x - 10, y - 18, 270, demoSize + 32);

  ctx.fillStyle = "rgba(56, 90, 159, 0.18)";
  ctx.fillRect(x, y, demoSize, demoSize);
  ctx.strokeStyle = "rgba(56, 90, 159, 0.82)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, demoSize, demoSize);

  ctx.fillStyle = "rgba(255, 216, 102, 0.52)";
  ctx.fillRect(x + shift, y, overlapWidth, demoSize);
  ctx.fillStyle = "rgba(215, 138, 0, 0.18)";
  ctx.fillRect(x + shift, y, demoSize, demoSize);
  ctx.strokeStyle = "rgba(215, 138, 0, 0.9)";
  ctx.strokeRect(x + shift, y, demoSize, demoSize);

  ctx.strokeStyle = "rgba(0, 109, 119, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 12);
  ctx.lineTo(x + shift - 8, y - 12);
  ctx.stroke();
  if (shift > 18) {
    ctx.beginPath();
    ctx.moveTo(x + shift - 10, y - 18);
    ctx.lineTo(x + shift - 2, y - 12);
    ctx.lineTo(x + shift - 10, y - 6);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(215, 138, 0, 0.85)";
  ctx.fillRect(x + 126, y + demoSize + 7, Math.max(20, overlapPct), 8);
  ctx.restore();
}

function drawExtractionOverlay(ctx) {
  const { patches } = patchGrid();
  ctx.save();
  if (state.prep.extracting && state.prep.extractionIndex >= 0) {
    const patch = patches[state.prep.extractionIndex % patches.length];
    ctx.fillStyle = "rgba(255, 216, 102, 0.28)";
    ctx.fillRect(patch.x, patch.y, patch.size, patch.size);
    ctx.strokeStyle = "rgba(215, 138, 0, 0.98)";
    ctx.lineWidth = 4;
    ctx.strokeRect(patch.x, patch.y, patch.size, patch.size);
  } else if (state.prep.checked && state.prep.extractedPatches.length) {
    ctx.strokeStyle = "rgba(0, 109, 119, 0.18)";
    ctx.lineWidth = 1;
    patches.forEach((patch, index) => {
      if (index % Math.max(1, Math.ceil(patches.length / 80)) === 0) ctx.strokeRect(patch.x, patch.y, patch.size, patch.size);
    });
  }
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
  const originX = (SIZE - patchSize) / 2;
  const originY = (SIZE - patchSize) / 2;
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

function patchMetrics(patch) {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  let ink = 0;
  let texture = 0;
  let last = null;
  const samples = 12;
  for (let y = 0; y < samples; y += 1) {
    for (let x = 0; x < samples; x += 1) {
      const sx = patch.x + ((x + 0.5) / samples) * patch.size;
      const sy = patch.y + ((y + 0.5) / samples) * patch.size;
      const a = inkAlphaFromMask(mask, SIZE, sx, sy);
      const v = ctValue(sx, sy, example.targetZ, mask, SIZE, 1, example);
      if (a > 0.28) ink += 1;
      if (last !== null) texture += Math.abs(v - last);
      last = v;
    }
  }
  const inkPct = Math.round((ink / (samples * samples)) * 100);
  const structurePct = clamp(Math.round(texture * 180), 0, 100);
  let quality = "mittel";
  if (inkPct >= 3 && inkPct <= 28 && structurePct > 18) quality = "gut";
  else if (inkPct === 0 || inkPct > 42 || structurePct < 8) quality = "schwach";
  return { inkPct, structurePct, quality };
}

function drawExtractedPatch(canvas, patch) {
  const example = examples[state.prepExample];
  const mask = fullGreekMasks[state.prepExample];
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = patch.x + (x / width) * patch.size;
      const sy = patch.y + (y / height) * patch.size;
      const v = ctValue(sx, sy, example.targetZ, mask, SIZE, 1, example);
      const g = Math.round(clamp((v - 0.22) / 0.62, 0, 1) * 220 + 18);
      const idx = (y * width + x) * 4;
      data[idx] = g;
      data[idx + 1] = Math.round(g * 0.95 + 6);
      data[idx + 2] = Math.round(g * 0.82 + 10);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function renderExtractedPatchGallery() {
  if (!state.prep.checked || !state.prep.extractedPatches.length) {
    els.patchReview.hidden = true;
    els.patchGallery.innerHTML = "";
    return;
  }
  els.patchReview.hidden = false;
  const patches = state.prep.extractedPatches;
  const visible = patches.slice(0, 24);
  els.patchGallery.innerHTML = "";
  visible.forEach((patch, index) => {
    const metrics = patchMetrics(patch);
    const button = document.createElement("button");
    button.className = `patch-card${state.prep.activeExtracted === index ? " active" : ""}`;
    button.type = "button";
    button.dataset.patchIndex = String(index);
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 72;
    const label = document.createElement("span");
    label.textContent = `Patch ${index + 1}`;
    const meta = document.createElement("small");
    meta.textContent = `${metrics.quality} · Tinte ${metrics.inkPct}%`;
    button.append(canvas, label, meta);
    els.patchGallery.append(button);
    drawExtractedPatch(canvas, patch);
  });
  const selected = patches[state.prep.activeExtracted >= 0 ? state.prep.activeExtracted : 0];
  if (selected) {
    const metrics = patchMetrics(selected);
    const active = state.prep.activeExtracted >= 0 ? state.prep.activeExtracted : 0;
    drawExtractedPatch(els.selectedPatchCanvas, selected);
    els.selectedPatchTitle.textContent = `Patch ${active + 1} von ${patches.length}`;
    els.selectedPatchMetrics.textContent = `Bewertung: ${metrics.quality}. Tintenanteil ${metrics.inkPct}%, Struktur ${metrics.structurePct}%.`;
    els.patchReviewNote.textContent = "Mit Zurück/Weiter kann jeder gespeicherte Patch geprüft werden.";
    els.prevPatchBtn.disabled = active <= 0;
    els.nextPatchBtn.disabled = active >= patches.length - 1;
  }
}

function updatePatchMetrics() {
  const example = examples[state.prepExample];
  const size = state.prep.size;
  const stride = Number(els.strideSlider.value);
  const backgroundTarget = Number(els.backgroundSlider.value);
  const { count: gridCount, total: patchCount } = patchGrid(size, stride);
  const overlap = clamp(Math.round((1 - stride / size) * 100), 0, 95);
  els.patchSizeValue.textContent = `${size} Voxel`;
  els.strideValue.textContent = `${stride} Voxel`;
  els.backgroundValue.textContent = `${backgroundTarget}%`;
  els.inkMetric.textContent = example.sizeLabel;
  els.structureMetric.textContent = `${overlap}%`;
  els.noiseMetric.textContent = `${backgroundTarget}%`;
  els.patchCountMetric.textContent = `${patchCount}`;

  if (!state.prep.checked) {
    els.prepScore.textContent = "Noch nicht geprüft";
    els.prepStatus.textContent = isUpperMode()
      ? `Bildgröße: ${SIZE} x ${SIZE} Voxel. Es passen ${gridCount} Patch-Positionen in eine Zeile und ${gridCount} in eine Spalte. Wie viele Patches sind das insgesamt?`
      : "Wähle Patch-Größe, Stride und Hintergrundanteil, dann drücke Fertig.";
    els.patchCountFeedback.textContent = "-";
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
  state.prep.extracting = false;
  const example = examples[state.prepExample];
  const size = state.prep.size;
  const stride = Number(els.strideSlider.value);
  const background = Number(els.backgroundSlider.value);
  const overlap = clamp(Math.round((1 - stride / size) * 100), 0, 95);
  const { count: gridCount, total: patchCount } = patchGrid(size, stride);
  const guessed = Number(els.patchCountGuess.value);
  if (els.patchCountGuess.value.trim() === "") {
    els.patchCountFeedback.textContent = `${gridCount} x ${gridCount} = ${patchCount}`;
  } else if (guessed === patchCount) {
    els.patchCountFeedback.textContent = "richtig";
  } else {
    els.patchCountFeedback.textContent = `${gridCount} x ${gridCount} = ${patchCount}`;
  }
  const target = prepTargets(example);
  const checks = [
    inRange(size, target.size),
    inRange(overlap, target.overlap),
    inRange(background, target.background),
  ];
  const relevantChecks = checks;
  const score = relevantChecks.filter(Boolean).length;
  const hints = [];
  if (!checks[0]) hints.push(size < target.size[0] ? "Patch zu klein" : "Patch zu groß");
  if (!checks[1]) hints.push(overlap < target.overlap[0] ? "zu wenig Überlappung" : "zu viel Überlappung");
  if (!checks[2]) hints.push(background < target.background[0] ? "zu wenige Hintergrund-Patches" : "zu viele Hintergrund-Patches");
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

function startPatchExtraction() {
  if (state.prepTimer) clearInterval(state.prepTimer);
  const { patches } = patchGrid();
  state.prep.extractedPatches = [];
  state.prep.activeExtracted = -1;
  state.prep.extracting = true;
  state.prep.extractionIndex = 0;
  els.evaluatePrepBtn.disabled = true;
  els.prepScore.textContent = "Kernel läuft";
  els.prepStatus.textContent = "Das Patch-Fenster wird mit dem gewählten Stride über das Bild geschoben und speichert Ausschnitte.";
  renderPrep();

  const step = Math.max(1, Math.ceil(patches.length / 80));
  state.prepTimer = setInterval(() => {
    state.prep.extractedPatches.push(...patches.slice(state.prep.extractionIndex, state.prep.extractionIndex + step));
    state.prep.extractionIndex += step;
    if (state.prep.extractionIndex >= patches.length) {
      state.prep.extracting = false;
      state.prep.extractionIndex = patches.length - 1;
      state.prep.extractedPatches = patches;
      state.prep.activeExtracted = 0;
      els.evaluatePrepBtn.disabled = false;
      clearInterval(state.prepTimer);
      state.prepTimer = null;
      els.prepStatus.textContent = `${patches.length} Patches gespeichert. Wähle unten einzelne Patches und bewerte Tintenanteil und Struktur.`;
      els.prepScore.textContent = "Patches bereit";
    }
    renderPrep();
  }, 55);
}

function modelStats(epoch = Number(els.epochSlider.value)) {
  const trainAmount = Number(els.trainDataSlider.value) / 100;
  const testAmount = Number(els.testDataSlider.value) / 100;
  const modelSize = Number(els.modelSizeSlider.value);
  const regularization = isUpperMode() ? Number(els.regularizationSlider.value) / 100 : 0.35;
  const threshold = isUpperMode() ? Number(els.thresholdSlider.value) / 100 : 0.5;
  const augmentation = isUpperMode() ? Number(els.augmentationSlider.value) / 100 : 0.35;
  const classWeight = isUpperMode() ? Number(els.classWeightSlider.value) : 2;
  const lr = Number(els.lrSlider.value) / 10000;
  const progress = smoothstep(0, 30, epoch);
  const lrQuality = Math.exp(-Math.abs(lr - 0.0035) * 260);
  const lrTooHigh = Math.max(0, lr - 0.006);
  const lrTooLow = Math.max(0, 0.002 - lr);
  const augmentationQuality = Math.exp(-((augmentation - 0.45) ** 2) / 0.035);
  const classWeightQuality = Math.exp(-((classWeight - 3) ** 2) / 1.7);
  const thresholdQuality = Math.exp(-((threshold - 0.5) ** 2) / 0.035);
  const regularizationQuality = Math.exp(-((regularization - 0.38) ** 2) / 0.06);
  const dataQuality = Math.sqrt(trainAmount);
  const capacity = [0, 0.58, 0.92, 1.18][modelSize];
  const overfit = Math.max(0, (modelSize - 1) * 0.13 + trainAmount * 0.24 - regularization * 0.42 - augmentation * 0.16);
  const underfit = Math.max(0, regularization - 0.74) * 0.48 + Math.max(0, 1.7 - modelSize) * 0.08;
  const parameterQuality = lrQuality * 0.32 + augmentationQuality * 0.18 + classWeightQuality * 0.16 + thresholdQuality * 0.12 + regularizationQuality * 0.14 + capacity * 0.08;
  const skill = clamp(progress * (dataQuality * 0.58 + parameterQuality * 0.68 + capacity * 0.18 - overfit * 0.28 - underfit - lrTooHigh * 35 - lrTooLow * 42), 0, 1);
  const recallBias = clamp((classWeight - 1) / 4, 0, 1);
  const detection = clamp(Math.round(100 * (skill * (0.74 + capacity * 0.16 + recallBias * 0.12) - Math.max(0, threshold - 0.5) * 0.35 + 0.01)), 0, 100);
  const falseAlarms = clamp(Math.round(82 * (1 - skill) + overfit * 78 + lrTooHigh * 11000 + Math.max(0, 0.5 - threshold) * 54 + Math.max(0, classWeight - 3) * 8 - regularization * 18), 0, 99);
  const generalization = clamp(Math.round(100 * (skill * 0.82 + regularizationQuality * 0.07 + augmentationQuality * 0.08 - overfit * 0.66 - underfit * 0.46 - lrTooHigh * 40 - lrTooLow * 28)), 0, 100);
  let behavior = "stabil";
  if (epoch === 0) behavior = "neu starten";
  else if (trainAmount < 0.25) behavior = "zu wenig Daten";
  else if (overfit > 0.24) behavior = "überfit";
  else if (testAmount < 0.12) behavior = "Testset klein";
  else if (underfit > 0.08) behavior = "unterfit";
  else if (lrTooLow > 0) behavior = "lernt langsam";
  else if (lrTooHigh > 0) behavior = "instabil";
  else if (epoch < 8) behavior = "lernt noch";
  return { trainAmount, testAmount, modelSize, capacity, regularization, threshold, augmentation, classWeight, overfit, underfit, lr, lrQuality, lrTooHigh, lrTooLow, augmentationQuality, classWeightQuality, thresholdQuality, skill, detection, falseAlarms, generalization, behavior };
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
  els.augmentationValue.textContent = `${els.augmentationSlider.value}%`;
  els.classWeightValue.textContent = `${els.classWeightSlider.value}x`;
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
      const parameterNoise = (1 - stats.lrQuality * stats.augmentationQuality * 0.85) * 0.38;
      const falseAlarm = valueNoise(sx, sy, epoch + example.seed, 12) * (1 - stats.skill) * 0.72 + stats.overfit * valueNoise(sx + 31, sy - 19, epoch, 7) * 0.7 + stats.lrTooHigh * hashNoise(sx, sy, epoch) * 48 + parameterNoise * valueNoise(sx - 17, sy + 23, epoch, 9);
      const textGain = stats.skill * (2.15 + stats.capacity * 0.42 + stats.classWeightQuality * 0.38);
      const thresholdPenalty = Math.max(0, stats.threshold - 0.48) * 0.42;
      const pred = clamp(truth * textGain + falseAlarm - (1 - stats.trainAmount) * 0.14 - thresholdPenalty, 0, 1);
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
    const overfitGap = stats.overfit * progress * 0.42;
    const smallTestNoise = stats.testAmount < 0.12 ? 0.04 : 0;
    return 0.9 * Math.exp(-progress * rate) + 0.16 + stats.lrTooHigh * 12 + overfitGap + stats.underfit * 0.18 + smallTestNoise;
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

function openInfo(termId) {
  const info = infoTerms[termId];
  if (!info) return;
  els.infoTitle.textContent = info.title;
  els.infoGeneral.textContent = info.general;
  els.infoSpecific.textContent = typeof info.specific === "function" ? info.specific() : info.specific;
  els.infoDialog.hidden = false;
  els.infoClose.focus();
}

function closeInfo() {
  els.infoDialog.hidden = true;
}

function resetPrepExtraction() {
  if (state.prepTimer) {
    clearInterval(state.prepTimer);
    state.prepTimer = null;
  }
  state.prep.checked = false;
  state.prep.extracting = false;
  state.prep.extractionIndex = -1;
  state.prep.extractedPatches = [];
  state.prep.activeExtracted = -1;
  els.evaluatePrepBtn.disabled = false;
}

function resetModelTraining() {
  if (state.trainTimer) {
    clearInterval(state.trainTimer);
    state.trainTimer = null;
  }
  els.epochSlider.value = 0;
  renderModel();
  els.learnMetric.textContent = "neu starten";
  els.trainBtn.textContent = "Training starten";
}

function wireEvents() {
  document.addEventListener("click", (event) => {
    const term = event.target instanceof Element ? event.target.closest(".info-term") : null;
    if (!term) return;
    event.preventDefault();
    event.stopPropagation();
    openInfo(term.dataset.info);
  });

  document.addEventListener("keydown", (event) => {
    const term = event.target instanceof Element ? event.target.closest(".info-term") : null;
    if (term && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openInfo(term.dataset.info);
    }
    if (event.key === "Escape" && !els.infoDialog.hidden) closeInfo();
  });

  els.infoClose.addEventListener("click", closeInfo);
  els.infoDialog.addEventListener("click", (event) => {
    if (event.target === els.infoDialog) closeInfo();
  });

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
          "Ziel: Finde die Darstellung, in der du die meiste zusammenhängende Schrift siehst.",
          "Ändere nur einen Parameter auf einmal: Wird mehr Schrift sichtbar oder nur mehr Rauschen?",
          "Ein gutes Dichtefenster macht Buchstaben kontrastreich, ohne große Bildbereiche komplett hell oder dunkel abzuschneiden.",
        ]
      : [
          "Ziel: Finde die Darstellung, in der du die meiste Schrift siehst.",
          "Schiebe die Tiefe langsam und beobachte, ob mehr Buchstaben auftauchen.",
          "Wenn zu viel Rauschen sichtbar ist, probiere ein anderes Dichtefenster oder etwas Filter.",
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
    if (state.scanExample === realScrollSample.scanExample) {
      els.zSlider.value = 18;
      els.scanHintText.textContent = "Echter Scan: Finde eine Darstellung, in der Schichtstrukturen und mögliche Spuren am klarsten zu sehen sind.";
    } else {
      els.zSlider.value = clamp(example.targetZ - 8, 0, 65);
      els.scanHintText.textContent = isUpperMode() ? "Finde die Darstellung, in der du die meiste zusammenhängende Schrift siehst." : "Finde die Darstellung, in der du die meiste Schrift siehst.";
    }
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
        : "Differenzbild: markiere auffällige, lokal begrenzte Veränderungen."
      : isUpperMode()
        ? "Schichtbild: suche alle Schriftspuren über alle Tiefenschichten."
        : "Schichtansicht: suche alle Schriftspuren über alle Tiefenschichten.";
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
    els.labelStatus.textContent = isUpperMode() ? "Suche die Schrift über mehrere Tiefenschichten und markiere alle sichtbaren Schriftspuren." : "Slice durch die Tiefen und markiere alle Schriftspuren, die du findest.";
    state.labelView = { scale: 1, x: 0, y: 0, pinch: null };
    renderLabel();
  });

  let painting = false;
  let paintPointerId = null;
  const activePointers = new Map();
  const pointerCanvasPoint = (event) => canvasPoint(event, els.labelCanvas);
  const pinchFromPointers = () => {
    const points = [...activePointers.values()];
    if (points.length < 2) return null;
    return {
      distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
      center: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
    };
  };
  const stopPaint = (event = null) => {
    if (!event || event.pointerId === paintPointerId) {
      painting = false;
      paintPointerId = null;
    }
    if (event) activePointers.delete(event.pointerId);
    if (activePointers.size < 2) state.labelView.pinch = null;
  };
  els.labelCanvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomLabelAt(canvasPoint(event, els.labelCanvas), event.deltaY < 0 ? 1.15 : 0.87);
    renderLabel();
  }, { passive: false });
  els.labelCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    els.labelCanvas.setPointerCapture?.(event.pointerId);
    activePointers.set(event.pointerId, pointerCanvasPoint(event));
    if (activePointers.size >= 2) {
      painting = false;
      paintPointerId = null;
      state.labelView.pinch = pinchFromPointers();
      return;
    }
    painting = true;
    paintPointerId = event.pointerId;
    paintAt(pointerCanvasPoint(event));
  }, { passive: false });
  els.labelCanvas.addEventListener("pointermove", (event) => {
    event.preventDefault();
    if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, pointerCanvasPoint(event));
    if (activePointers.size >= 2) {
      const nextPinch = pinchFromPointers();
      const pinch = state.labelView.pinch ?? nextPinch;
      zoomLabelAt(nextPinch.center, nextPinch.distance / Math.max(1, pinch.distance));
      state.labelView.x += nextPinch.center.x - pinch.center.x;
      state.labelView.y += nextPinch.center.y - pinch.center.y;
      clampLabelView();
      state.labelView.pinch = nextPinch;
      renderLabel();
      return;
    }
    if (painting && event.pointerId === paintPointerId) paintAt(pointerCanvasPoint(event));
  }, { passive: false });
  els.labelCanvas.addEventListener("pointerup", stopPaint);
  els.labelCanvas.addEventListener("pointercancel", stopPaint);
  els.labelCanvas.addEventListener("lostpointercapture", stopPaint);
  window.addEventListener("pointerup", stopPaint);
  window.addEventListener("pointercancel", stopPaint);

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
    resetPrepExtraction();
    state.prep.size = Number(els.patchSizeSlider.value);
    renderPrep();
  });
  [els.strideSlider, els.backgroundSlider].forEach((input) =>
    input.addEventListener("input", () => {
      resetPrepExtraction();
      renderPrep();
    }),
  );
  els.patchCountGuess.addEventListener("input", () => {
    resetPrepExtraction();
    renderPrep();
  });
  els.prepExamples.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-example]");
    if (!button) return;
    state.prepExample = Number(button.dataset.example);
    resetPrepExtraction();
    [...els.prepExamples.children].forEach((child) => child.classList.toggle("active", child === button));
    renderPrep();
  });
  els.evaluatePrepBtn.addEventListener("click", () => {
    evaluatePrepDecision();
    startPatchExtraction();
  });
  els.patchGallery.addEventListener("click", (event) => {
    const button = event.target.closest(".patch-card");
    if (!button) return;
    state.prep.activeExtracted = Number(button.dataset.patchIndex);
    renderExtractedPatchGallery();
  });
  els.prevPatchBtn.addEventListener("click", () => {
    state.prep.activeExtracted = Math.max(0, state.prep.activeExtracted - 1);
    renderExtractedPatchGallery();
  });
  els.nextPatchBtn.addEventListener("click", () => {
    state.prep.activeExtracted = Math.min(state.prep.extractedPatches.length - 1, state.prep.activeExtracted + 1);
    renderExtractedPatchGallery();
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
  els.epochSlider.addEventListener("input", renderModel);
  [els.trainDataSlider, els.modelSizeSlider, els.testDataSlider, els.lrSlider, els.regularizationSlider, els.augmentationSlider, els.classWeightSlider, els.thresholdSlider].forEach((input) => input.addEventListener("input", resetModelTraining));
  els.trainBtn.addEventListener("click", () => {
    if (state.trainTimer) clearInterval(state.trainTimer);
    els.epochSlider.value = 0;
    renderModel();
    els.trainBtn.textContent = "Training läuft";
    state.trainTimer = setInterval(() => {
      const next = Number(els.epochSlider.value) + 1;
      els.epochSlider.value = next;
      renderModel();
      if (next >= 30) {
        clearInterval(state.trainTimer);
        state.trainTimer = null;
        els.trainBtn.textContent = "Training starten";
      }
    }, 160);
  });
}

function init() {
  wireEvents();
  setupPatchChoices();
  applyMode("upper");
}

init();
