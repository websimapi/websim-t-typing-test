// ...existing code...
import { sample, shuffle } from "lodash-es";

const TIME_LIMIT = 60;
const WORD_TARGET = 60;

const UI = {
  prompt: document.getElementById("prompt"),
  input: document.getElementById("hiddenInput"),
  time: document.getElementById("time"),
  wpm: document.getElementById("wpm"),
  accuracy: document.getElementById("accuracy"),
  correct: document.getElementById("correct"),
  total: document.getElementById("total"),
  restart: document.getElementById("restart"),
  focusBtn: document.getElementById("focusBtn"),
  themeToggle: document.getElementById("themeToggle"),
};

let state = {
  words: [],
  flatChars: [],
  index: 0,
  started: false,
  startTime: 0,
  timerId: null,
  remaining: TIME_LIMIT,
  correct: 0,
  total: 0,
};

const corpus = [
  "time test tiny true try trust type",
  "simple clean fast accurate quiet focus",
  "keyboard rhythm flow speed practice habit",
  "design code craft learn build ship iterate",
  "black white minimal sharp crisp precise",
  "logic clarity intent signal noise reduce",
  "measure improve repeat steady calm consistent",
];

function newRun() {
  state = { ...state, index:0, started:false, startTime:0, timerId:null, remaining:TIME_LIMIT, correct:0, total:0 };
  UI.time.textContent = TIME_LIMIT;
  UI.wpm.textContent = 0;
  UI.accuracy.textContent = "100%";
  UI.correct.textContent = 0;
  UI.total.textContent = 0;
  const line = buildPrompt();
  renderPrompt(line);
}

function buildPrompt() {
  const chosen = [];
  while (chosen.length < WORD_TARGET) {
    const block = sample(corpus).split(" ");
    shuffle(block);
    chosen.push(...block);
  }
  return chosen.slice(0, WORD_TARGET).join(" ");
}

function renderPrompt(text) {
  UI.prompt.innerHTML = "";
  const frag = document.createDocumentFragment();
  const chars = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.textContent = ch;
    span.className = "token pending";
    frag.appendChild(span);
    chars.push(span);
  }
  UI.prompt.appendChild(frag);
  state.flatChars = chars;
  placeCaret(0);
}

function placeCaret(i) {
  state.flatChars.forEach(s => { const c = s.querySelector(".caret"); if (c) c.remove(); });
  const target = state.flatChars[i] || state.flatChars[state.flatChars.length-1];
  if (!target) return;
  const caret = document.createElement("i");
  caret.className = "caret";
  target.appendChild(caret);
}

function startTimer() {
  state.started = true;
  state.startTime = performance.now();
  state.timerId = setInterval(() => {
    state.remaining = Math.max(0, TIME_LIMIT - Math.floor((performance.now() - state.startTime)/1000));
    UI.time.textContent = state.remaining;
    updateWPM();
    if (state.remaining <= 0) endRun();
  }, 200);
}

function endRun() {
  clearInterval(state.timerId);
  state.timerId = null;
  UI.input.blur();
}

function updateWPM() {
  const elapsedMin = Math.max(0.01, (TIME_LIMIT - state.remaining) / 60);
  const wpm = Math.round((state.correct / 5) / elapsedMin);
  UI.wpm.textContent = isFinite(wpm) ? wpm : 0;
  const acc = state.total ? Math.round((state.correct / state.total) * 100) : 100;
  UI.accuracy.textContent = `${acc}%`;
}

function handleChar(inputCh) {
  if (!state.started) startTimer();
  const expected = state.flatChars[state.index];
  if (!expected) return endRun();
  state.total++;
  UI.total.textContent = state.total;

  if (inputCh === expected.textContent) {
    expected.className = "token correct";
    state.correct++;
    UI.correct.textContent = state.correct;
    state.index++;
    placeCaret(state.index);
  } else {
    // mark incorrect but advance only if not a space to prevent cascading errors
    if (expected.textContent === " ") {
      expected.className = "token incorrect";
    } else {
      expected.className = "token incorrect";
      state.index++;
      placeCaret(state.index);
    }
  }
  updateWPM();
  if (state.index >= state.flatChars.length) endRun();
}

function handleBackspace() {
  if (state.index <= 0) return;
  const prev = state.flatChars[state.index - 1];
  if (!prev) return;
  prev.className = "token pending";
  state.index--;
  if (state.total > 0) state.total--;
  if (prev.textContent !== " " && state.correct > 0 && prev.className !== "token correct") {
    // no adjustment here; correctness recalculated on retype
  }
  UI.total.textContent = state.total;
  placeCaret(state.index);
  updateWPM();
}

// Events
UI.focusBtn.addEventListener("click", () => UI.input.focus());
UI.prompt.addEventListener("click", () => UI.input.focus());
UI.restart.addEventListener("click", () => { newRun(); UI.input.focus(); });

UI.input.addEventListener("keydown", (e) => {
  if (e.key === "Tab") return;
  if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace();
    return;
  }
  if (e.key.length === 1) {
    e.preventDefault();
    handleChar(e.key);
  } else if (e.key === "Enter") {
    e.preventDefault();
    handleChar("\n"); // rarely present; safe no-op if not expected
  }
});

function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.classList.toggle("dark", saved === "dark");
  UI.themeToggle.textContent = saved === "dark" ? "Light" : "Dark";
  UI.themeToggle.addEventListener("click", () => {
    const nowDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nowDark);
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    UI.themeToggle.textContent = nowDark ? "Light" : "Dark";
  });
}

function boot() {
  initTheme();
  newRun();
  // focus on key press to start quickly
  window.addEventListener("keydown", () => { if (document.activeElement !== UI.input) UI.input.focus(); }, { once:true });
}

boot();
// ...existing code...

