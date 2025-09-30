---

## 3. `app.js` (Tu lógica actual + mejoras visuales)
```javascript
// app.js – DuoSeguros Mejorado
// Mantiene tu lógica original + integración con nuevo diseño

// === Global State ===
let QUESTIONS_ALL = {};
let QUESTIONS_INDEX = {};
let currentModule = null;
let sessionQuestions = [];
let qIndex = 0;
let selectedIdx = null;
let answered = false;
let score = { correct: 0, incorrect: 0 };
let soundEnabled = true;
let batchSize = 20;
let currentStreak = 0;

// === DOM Elements ===
const loadingScreen = document.getElementById('loadingScreen');
const errorScreen = document.getElementById('errorScreen');
const startScreen = document.getElementById('startScreen');
const questionScreen = document.getElementById('questionScreen');
const endScreen = document.getElementById('endScreen');

const themeToggle = document.getElementById('themeToggle');
const moduleList = document.getElementById('moduleList');
const startBtn = document.getElementById('startBtn');
const exitBtn = document.getElementById('exitBtn');
const numSel = document.getElementById('numQuestions');
const soundChk = document.getElementById('soundEnabled');

const difficultyBadge = document.getElementById('difficultyBadge');
const subtopicText = document.getElementById('subtopicText');
const questionText = document.getElementById('questionText');
const optionsWrap = document.getElementById('optionsContainer');
const feedbackBox = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const counterText = document.getElementById('questionCounter');

const correctCount = document.getElementById('correctCount');
const incorrectCount = document.getElementById('incorrectCount');
const streakCount = document.getElementById('streakCount');
const streakCounter = document.getElementById('streakCounter');

const finalScore = document.getElementById('finalScore');
const performanceMessage = document.getElementById('performanceMessage');
const detailedResults = document.getElementById('detailedResults');
const restartBtn = document.getElementById('restartBtn');

// === Theme Management ===
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// === Utils ===
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleOptions(q) {
  const opts = q.options.map((t, i) => ({ t, i }));
  shuffle(opts);
  const newOptions = opts.map(o => o.t);
  const newCorrect = opts.findIndex(o => o.i === q.correct);
  return { ...q, options: newOptions, correct: newCorrect };
}

// === Data Loading ===
async function loadAll() {
  try {
    loadingScreen.style.display = 'flex';
    
    const [idxRes, allRes] = await Promise.all([
      fetch('questions_index.json'),
      fetch('questions_all.json')
    ]);

    if (!idxRes.ok || !allRes.ok) throw new Error('No se pudieron cargar los archivos JSON');

    QUESTIONS_INDEX = await idxRes.json();
    QUESTIONS_ALL = await allRes.json();

    renderModules(QUESTIONS_INDEX.modules);

    loadingScreen.style.display = 'none';
    startScreen.style.display = 'flex';
  } catch (e) {
    console.error(e);
    loadingScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
  }
}

// === Module Rendering ===
function renderModules(modules) {
  moduleList.innerHTML = '';
  
  modules.forEach(mod => {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.dataset.module = mod.key;

    const icon = getModuleIcon(mod.key);
    const desc = moduleDescription(mod.key);
    
    card.innerHTML = `
      <div class="module-icon">${icon}</div>
      <div class="module-title">${mod.title}</div>
      <div class="module-description">${desc}</div>
      <div class="module-stats">${mod.count} preguntas disponibles</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.module-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentModule = mod.key;
      startBtn.disabled = false;
    });

    moduleList.appendChild(card);
  });
}

function getModuleIcon(name) {
  const icons = {
    'Aspectos Generales': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    'Riesgos Individuales de Seguro de Daños': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    'Riesgos Individuales de Seguro de Personas': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'Sistema y Mercados Financieros': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  };
  
  for (const [key, icon] of Object.entries(icons)) {
    if (name.includes(key)) return icon;
  }
  
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
}

function moduleDescription(name) {
  if (name.includes('Aspectos Generales')) return 'Conceptos base, contrato, autoridades, sanciones, PLD/FT';
  if (name.includes('Daños')) return 'Autos, hogar, RC, exclusiones, siniestros';
  if (name.includes('Personas')) return 'Vida, GM, accidentes, bases técnicas';
  if (name.includes('Financieros')) return 'Sistema financiero, mercado de valores, tasas';
  return 'Preguntas sobre seguros';
}

// === Local Storage ===
function historyKey(module) { return `qp_hist_${module}`; }
function seenKey(module) { return `qp_seen_${module}`; }

function pushHistory(module, entry) {
  const key = historyKey(module);
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.unshift(entry);
  localStorage.setItem(key, JSON.stringify(arr.slice(0, 100)));
}

function subtopicStats(module) {
  const arr = JSON.parse(localStorage.getItem(historyKey(module)) || '[]');
  const by = {};
  
  arr.forEach(e => {
    const k = e.subtopic || 'General';
    if (!by[k]) by[k] = { correct: 0, total: 0 };
    by[k].total += 1;
    by[k].correct += e.correct ? 1 : 0;
  });

  return Object.entries(by).map(([sub, v]) => {
    const acc = v.total ? (v.correct / v.total) : 0.0;
    const w = 0.3 + (1.0 - acc) * 0.7;
    return { subtopic: sub, total: v.total, accuracy: acc, weight: w };
  });
}

// === Question Selection ===
function nextBatchFromModule(module, size) {
  const pool = (QUESTIONS_ALL[module] || []).slice();
  const seen = new Set(JSON.parse(localStorage.getItem(seenKey(module)) || '[]'));
  let candidates = pool.filter(q => !seen.has(q.id));

  if (candidates.length === 0) {
    localStorage.setItem(seenKey(module), JSON.stringify([]));
    candidates = pool.slice();
  }

  const stats = subtopicStats(module);
  const wBySub = Object.fromEntries(stats.map(s => [s.subtopic, s.weight]));

  shuffle(candidates);
  const N = size === 'all' ? candidates.length : Math.min(size, candidates.length);
  const take = [];
  const perSubCount = {};

  while (take.length < N && candidates.length > 0) {
    const pick = weightedPick(candidates, q => (wBySub[q.subtopic] ?? 0.6));
    if (!pick) break;

    const limit = Math.ceil(N / 2);
    if ((perSubCount[pick.subtopic] || 0) >= limit) continue;

    take.push(pick);
    perSubCount[pick.subtopic] = (perSubCount[pick.subtopic] || 0) + 1;
    candidates = candidates.filter(x => x.id !== pick.id);
  }

  const newSeen = new Set(JSON.parse(localStorage.getItem(seenKey(module)) || '[]'));
  take.forEach(q => newSeen.add(q.id));
  localStorage.setItem(seenKey(module), JSON.stringify(Array.from(newSeen)));

  return shuffle(take).map(q => shuffleOptions(q));
}

function weightedPick(arr, weightFn) {
  if (!arr.length) return null;
  const weights = arr.map(weightFn);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return arr[Math.floor(Math.random() * arr.length)];
  
  let r = Math.random() * sum;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

// === Quiz Flow ===
function startQuiz() {
  if (!currentModule) return;
  
  score = { correct: 0, incorrect: 0 };
  qIndex = 0;
  answered = false;
  currentStreak = 0;
  batchSize = numSel.value === 'all' ? 'all' : parseInt(numSel.value, 10);

  sessionQuestions = nextBatchFromModule(currentModule, batchSize);

  startScreen.style.display = 'none';
  questionScreen.style.display = 'flex';
  updateStreakDisplay();
  renderQuestion();
}

function renderQuestion() {
  const q = sessionQuestions[qIndex];
  
  counterText.textContent = `Pregunta ${qIndex + 1} de ${sessionQuestions.length}`;
  questionText.textContent = q.question;
  
  // Subtopic
  if (q.subtopic) {
    subtopicText.textContent = q.subtopic;
    subtopicText.style.display = 'inline-block';
  } else {
    subtopicText.style.display = 'none';
  }

  // Difficulty
  const diffMap = {
    'basic': { label: 'Básica', class: 'badge-difficulty', color: '#10b981' },
    'intermediate': { label: 'Media', class: 'badge-difficulty', color: '#f59e0b' },
    'advanced': { label: 'Difícil', class: 'badge-difficulty', color: '#ef4444' }
  };
  
  const diff = diffMap[q.difficulty] || diffMap['basic'];
  difficultyBadge.textContent = diff.label;
  difficultyBadge.className = 'badge ' + diff.class;
  difficultyBadge.style.background = diff.color;

  // Progress
  const pct = (qIndex / sessionQuestions.length) * 100;
  progressFill.style.width = `${pct}%`;

  // Options
  optionsWrap.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = opt;
    btn.addEventListener('click', () => onSelect(idx));
    optionsWrap.appendChild(btn);
  });

  feedbackBox.textContent = '';
  feedbackBox.className = 'feedback-box';
  nextBtn.disabled = true;
  selectedIdx = null;
  answered = false;

  correctCount.textContent = score.correct;
  incorrectCount.textContent = score.incorrect;
}

function onSelect(idx) {
  if (answered) return;
  selectedIdx = idx;
  
  document.querySelectorAll('.option').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  
  submitAnswer();
}

function submitAnswer() {
  const q = sessionQuestions[qIndex];
  if (selectedIdx == null) return;

  answered = true;
  const isCorrect = selectedIdx === q.correct;
  
  score[isCorrect ? 'correct' : 'incorrect']++;
  
  if (isCorrect) {
    currentStreak++;
  } else {
    currentStreak = 0;
  }
  
  updateStreakDisplay();

  // Visual feedback
  document.querySelectorAll('.option').forEach((el, i) => {
    el.classList.remove('selected');
    if (i === q.correct) el.classList.add('correct');
    if (i === selectedIdx && !isCorrect) el.classList.add('incorrect');
    el.classList.add('disabled');
  });

  // Feedback message
  const prefix = isCorrect ? '¡Correcto! ' : 'Respuesta incorrecta. ';
  feedbackBox.textContent = prefix + (q.explanation || '');
  feedbackBox.className = 'feedback-box ' + (isCorrect ? 'correct' : 'incorrect');

  // Sound
  if (soundEnabled) {
    isCorrect ? playCorrectSound() : playIncorrectSound();
  }

  // Save history
  pushHistory(currentModule, {
    id: q.id,
    subtopic: q.subtopic || 'General',
    difficulty: q.difficulty || 'basic',
    correct: isCorrect,
    ts: Date.now()
  });

  nextBtn.disabled = false;
  correctCount.textContent = score.correct;
  incorrectCount.textContent = score.incorrect;
}

function updateStreakDisplay() {
  streakCount.textContent = currentStreak;
  if (currentStreak > 0) {
    streakCounter.style.display = 'flex';
  } else {
    streakCounter.style.display = 'none';
  }
}

function nextQuestion() {
  if (qIndex < sessionQuestions.length - 1) {
    qIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  questionScreen.style.display = 'none';
  endScreen.style.display = 'flex';
  
  const total = sessionQuestions.length;
  const pct = Math.round((score.correct / total) * 100);
  
  finalScore.textContent = `${pct}%`;
  performanceMessage.textContent = getPerformanceMessage(pct);

  // Detailed results
  const agg = {};
  const lastIds = new Set(sessionQuestions.map(q => q.id));
  const hist = JSON.parse(localStorage.getItem(historyKey(currentModule)) || '[]')
    .filter(h => lastIds.has(h.id));

  hist.forEach(h => {
    const s = h.subtopic || 'General';
    if (!agg[s]) agg[s] = { correct: 0, total: 0 };
    agg[s].total += 1;
    agg[s].correct += h.correct ? 1 : 0;
  });

  detailedResults.innerHTML = '<h3 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">Resultados por subtema</h3>';
  
  Object.entries(agg).forEach(([sub, v]) => {
    const p = v.total ? Math.round((v.correct / v.total) * 100) : 0;
    const row = document.createElement('div');
    row.innerHTML = `<strong>${sub}:</strong> ${v.correct}/${v.total} <span style="color: var(--text-muted);">(${p}%)</span>`;
    detailedResults.appendChild(row);
  });
}

function getPerformanceMessage(pct) {
  if (pct >= 90) return '¡Excelente desempeño! 🎉';
  if (pct >= 75) return '¡Muy bien! Sigue así 👏';
  if (pct >= 60) return 'Buen trabajo, vas por buen camino';
  return 'Sigue practicando los temas más débiles';
}

function restart() {
  endScreen.style.display = 'none';
  startScreen.style.display = 'flex';
  currentModule = null;
  startBtn.disabled = true;
  document.querySelectorAll('.module-card').forEach(c => c.classList.remove('selected'));
}

// === Sound Effects ===
function createBeep(freq, duration, type = 'sine') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { }
}

function playCorrectSound() {
  createBeep(523, 0.15);
  setTimeout(() => createBeep(659, 0.15), 100);
  setTimeout(() => createBeep(784, 0.2), 200);
}

function playIncorrectSound() {
  createBeep(400, 0.15);
  setTimeout(() => createBeep(350, 0.15), 100);
  setTimeout(() => createBeep(300, 0.2), 200);
}

// === Event Listeners ===
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restart);
exitBtn.addEventListener('click', restart);

numSel.addEventListener('change', e => {
  batchSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
});

soundChk.addEventListener('change', e => {
  soundEnabled = e.target.checked;
});

// === Initialize ===
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadAll();
});
