// AI心理面接演習教材サイト — Phase 1 UI
// データ（docs/data/*.json）を読み、二軸ナビ・フィルタ・ステップ別コピーを提供する。
// フレームワーク非依存の素のJS。ブラウザストレージは使わない（状態はメモリ上のみ）。

const ROLE_LABELS = {
  client: "模擬クライエント",
  evaluator: "採点・FB",
  educator: "教育者・SV",
  guide: "ガイド",
  quizmaster: "出題者",
  partner: "壁打ち・添削",
};
const ROLE_DESC = {
  client: "AIがクライエント役を演じ、あなたがセラピスト役で練習します",
  evaluator: "AIがあなたの応答を基準に沿って採点・フィードバックします",
  educator: "AIが教育者・スーパーバイザーとして解説・助言します",
  guide: "AIが概念理解や体験を導きます",
  quizmaster: "AIが出題者として課題を出します",
  partner: "AIが壁打ち相手・添削者になります",
};

const state = {
  books: [],
  aiModes: null,
  exercises: [],
  categories: [],
  axis: "book",            // "book" | "skill"
  selectedBook: null,
  selectedCategory: null,
  roles: new Set(),
  mode: "",               // "" | "normal" | "study"
  query: "",
  selectedExerciseId: null,
  selectedAI: "chatgpt",
};

const $ = (id) => document.getElementById(id);

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} (${res.status})`);
  return res.json();
}

async function init() {
  try {
    const [books, aiModes, exercises] = await Promise.all([
      loadJSON("data/books.json"),
      loadJSON("data/ai-modes.json"),
      loadJSON("data/exercises.json"),
    ]);
    state.books = books.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    state.aiModes = aiModes;
    state.exercises = exercises;
    state.selectedAI = (aiModes.ais && aiModes.ais[0] && aiModes.ais[0].id) || "chatgpt";

    // スキルカテゴリを出現順に収集
    const seen = new Set();
    exercises.forEach((e) => (e.skillCategories || []).forEach((c) => {
      if (!seen.has(c)) { seen.add(c); state.categories.push(c); }
    }));

    bindEvents();
    renderFilters();
    renderNav();
    renderList();
  } catch (err) {
    $("list-summary").textContent = `データの読み込みに失敗しました: ${err.message}（ローカルでは docs/ をサーバー経由で開いてください）`;
  }
}

function bindEvents() {
  $("axis-book").addEventListener("click", () => setAxis("book"));
  $("axis-skill").addEventListener("click", () => setAxis("skill"));
  $("search").addEventListener("input", (e) => { state.query = e.target.value.trim(); renderList(); });
  $("clear-filters").addEventListener("click", clearFilters);
}

function setAxis(axis) {
  state.axis = axis;
  state.selectedBook = null;
  state.selectedCategory = null;
  $("axis-book").classList.toggle("is-active", axis === "book");
  $("axis-skill").classList.toggle("is-active", axis === "skill");
  $("axis-book").setAttribute("aria-selected", axis === "book");
  $("axis-skill").setAttribute("aria-selected", axis === "skill");
  renderNav();
  renderList();
}

function clearFilters() {
  state.roles.clear();
  state.mode = "";
  state.query = "";
  $("search").value = "";
  renderFilters();
  renderList();
}

// ---------- filters ----------
function renderFilters() {
  // roles
  const rolesEl = $("filter-roles");
  rolesEl.innerHTML = "";
  const presentRoles = [...new Set(state.exercises.map((e) => e.promptRole))];
  presentRoles.forEach((r) => {
    const b = document.createElement("button");
    b.className = "chip" + (state.roles.has(r) ? " is-on" : "");
    b.textContent = ROLE_LABELS[r] || r;
    b.addEventListener("click", () => {
      state.roles.has(r) ? state.roles.delete(r) : state.roles.add(r);
      renderFilters(); renderList();
    });
    rolesEl.appendChild(b);
  });
  // modes
  const modesEl = $("filter-modes");
  modesEl.innerHTML = "";
  (state.aiModes.modes || []).forEach((m) => {
    const b = document.createElement("button");
    b.className = "chip" + (state.mode === m.id ? " is-on" : "");
    b.textContent = m.label;
    b.addEventListener("click", () => {
      state.mode = state.mode === m.id ? "" : m.id;
      renderFilters(); renderList();
    });
    modesEl.appendChild(b);
  });
}

// ---------- nav ----------
function renderNav() {
  const nav = $("nav-list");
  nav.innerHTML = "";
  if (state.axis === "book") {
    state.books.forEach((book) => {
      const count = state.exercises.filter((e) => e.bookId === book.id).length;
      nav.appendChild(navItem(book.title, count, state.selectedBook === book.id, () => {
        state.selectedBook = state.selectedBook === book.id ? null : book.id;
        renderNav(); renderList();
      }));
    });
  } else {
    state.categories.forEach((cat) => {
      const count = state.exercises.filter((e) => (e.skillCategories || []).includes(cat)).length;
      nav.appendChild(navItem(cat, count, state.selectedCategory === cat, () => {
        state.selectedCategory = state.selectedCategory === cat ? null : cat;
        renderNav(); renderList();
      }));
    });
  }
}
function navItem(label, count, active, onClick) {
  const b = document.createElement("button");
  b.className = "nav-item" + (active ? " is-active" : "");
  b.innerHTML = `<span>${escapeHTML(label)}</span><span class="nav-item__count">${count}</span>`;
  b.addEventListener("click", onClick);
  return b;
}

// ---------- list ----------
function filteredExercises() {
  const q = state.query.toLowerCase();
  return state.exercises.filter((e) => {
    if (state.axis === "book" && state.selectedBook && e.bookId !== state.selectedBook) return false;
    if (state.axis === "skill" && state.selectedCategory && !(e.skillCategories || []).includes(state.selectedCategory)) return false;
    if (state.roles.size && !state.roles.has(e.promptRole)) return false;
    if (state.mode && e.mode !== state.mode) return false;
    if (q) {
      const hay = `${e.title} ${e.overview} ${e.learningObjective} ${e.chapter}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function bookTitle(id) {
  const b = state.books.find((x) => x.id === id);
  return b ? b.title : id;
}

function renderList() {
  const list = filteredExercises();
  $("list-summary").textContent = `${list.length} 件の演習`;
  const ul = $("exercise-list");
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML = `<li class="list-empty">条件に合う演習がありません。</li>`;
    return;
  }
  // 書籍（order順）→ 章（出現順）でグループ化して見出しを付ける
  state.books.forEach((book) => {
    const items = list.filter((e) => e.bookId === book.id);
    if (!items.length) return;
    const bh = document.createElement("li");
    bh.className = "group-book";
    bh.textContent = book.title;
    ul.appendChild(bh);

    const chapters = [];
    items.forEach((e) => { if (!chapters.includes(e.chapter)) chapters.push(e.chapter); });
    chapters.forEach((ch) => {
      if (ch) {
        const chh = document.createElement("li");
        chh.className = "group-chapter";
        chh.textContent = ch;
        ul.appendChild(chh);
      }
      items.filter((e) => e.chapter === ch).forEach((e) => ul.appendChild(exerciseCard(e)));
    });
  });
}

function exerciseCard(e) {
  const li = document.createElement("li");
  li.className = "ex-card" + (e.id === state.selectedExerciseId ? " is-active" : "");
  li.innerHTML = `
    <div class="ex-card__title">${escapeHTML(e.title)}</div>
    <div class="ex-card__badges">
      <span class="badge">${escapeHTML(ROLE_LABELS[e.promptRole] || e.promptRole)}</span>
      <span class="badge badge--mode">${isMixedMode(e) ? "モード混在" : escapeHTML(modeLabel(e.mode))}</span>
      ${e.steps.length > 1 ? `<span class="badge badge--steps">${e.steps.length}ステップ</span>` : ""}
      ${e.template ? `<span class="badge badge--template">テンプレート</span>` : ""}
    </div>`;
  li.addEventListener("click", () => { state.selectedExerciseId = e.id; renderList(); renderDetail(e); });
  return li;
}

function modeLabel(id) {
  const m = (state.aiModes.modes || []).find((x) => x.id === id);
  return m ? m.label : id;
}

// ステップの実効モード（step.mode があれば優先、なければ演習の mode）
function stepMode(e, step) { return step.mode || e.mode; }
// 演習内でステップごとにモードが異なるか
function isMixedMode(e) {
  return new Set((e.steps || []).map((s) => stepMode(e, s))).size > 1;
}

// ---------- detail ----------
function renderDetail(e) {
  const el = $("detail");
  const ai = (state.aiModes.ais || []).find((a) => a.id === state.selectedAI) || state.aiModes.ais[0];

  el.innerHTML = `
    <div class="detail__source">${escapeHTML(bookTitle(e.bookId))}｜${escapeHTML(e.chapter || "")}</div>
    <h2 class="detail__title">${escapeHTML(e.title)}</h2>
    <div class="detail__badges">
      <span class="badge" title="${escapeHTML(ROLE_DESC[e.promptRole] || "")}">${escapeHTML(ROLE_LABELS[e.promptRole] || e.promptRole)}</span>
      <span class="badge badge--mode">${isMixedMode(e) ? "モード混在" : escapeHTML(modeLabel(e.mode))}</span>
      ${e.template ? `<span class="badge badge--template">テンプレート</span>` : ""}
      ${(e.skillCategories || []).map((c) => `<span class="badge">${escapeHTML(c)}</span>`).join("")}
    </div>

    ${e.learningObjective ? `<h3>ねらい</h3><p class="detail__text">${escapeHTML(e.learningObjective)}</p>` : ""}
    ${e.overview ? `<h3>概要</h3><p class="detail__text">${escapeHTML(e.overview)}</p>` : ""}
    ${e.template ? `<p class="template-note">このプロンプトはテンプレートです。<code>[ ]</code> の部分を自分の内容（理論名・事例・論文箇所など）に置き換えてから貼り付けてください。</p>` : ""}
    ${(e.safetyNotes && e.safetyNotes.length) ? `<div class="safety" style="margin-top:1rem;"><strong>注意</strong><ul>${e.safetyNotes.map((s) => `<li>${escapeHTML(s)}</li>`).join("")}</ul></div>` : ""}

    <h3>使うAIとモード</h3>
    <div id="ai-select" class="ai-select"></div>
    <p id="ai-instruction" class="ai-instruction"></p>

    <h3>プロンプト${e.steps.length > 1 ? `（${e.steps.length}ステップ・上から順に）` : ""}</h3>
    <div id="steps"></div>

    ${(e.reflection && e.reflection.length) ? `<h3>振り返り</h3><ul class="reflection">${e.reflection.map((r) => `<li>${escapeHTML(r)}</li>`).join("")}</ul>` : ""}
  `;

  // AI selector
  const aiSel = $("ai-select");
  (state.aiModes.ais || []).forEach((a) => {
    const b = document.createElement("button");
    b.className = "ai-btn" + (a.id === state.selectedAI ? " is-on" : "");
    b.textContent = a.label;
    b.addEventListener("click", () => { state.selectedAI = a.id; renderDetail(e); });
    aiSel.appendChild(b);
  });
  const mixed = isMixedMode(e);
  $("ai-instruction").innerHTML = mixed
    ? "この演習はステップごとに貼り付け先（通常チャット／学習モード）が異なります。各ステップの案内に従ってください。"
    : aiInstruction(e.mode, ai);

  // steps
  const stepsEl = $("steps");
  e.steps.slice().sort((a, b) => a.order - b.order).forEach((step, i) => {
    const wrap = document.createElement("div");
    wrap.className = "step";
    const label = step.label || (e.steps.length > 1 ? `ステップ${i + 1}` : "プロンプト");
    const sMode = stepMode(e, step);
    // モード混在のときだけ、ステップごとにモードと貼り付け先を明示する
    const perStepMode = mixed
      ? `<div class="step__mode"><span class="badge badge--mode">${escapeHTML(modeLabel(sMode))}</span> ${aiInstruction(sMode, ai)}</div>`
      : "";
    wrap.innerHTML = `
      <div class="step__head">
        <span class="step__label">${escapeHTML(label)}</span>
        <button class="copy-btn" type="button">コピー</button>
      </div>
      ${perStepMode}
      <pre class="step__prompt">${escapeHTML(step.prompt)}</pre>`;
    wrap.querySelector(".copy-btn").addEventListener("click", (ev) => copyText(step.prompt, ev.target));
    stepsEl.appendChild(wrap);
  });
}

function aiInstruction(mode, ai) {
  if (!ai) return "";
  const open = `<a href="${escapeAttr(ai.url)}" target="_blank" rel="noopener">${escapeHTML(ai.label)}を開く ↗</a>`;
  if (mode === "study") {
    return `${escapeHTML(ai.label)} の「${escapeHTML(ai.studyModeName)}」に貼り付けてください。 ${open}`;
  }
  return `${escapeHTML(ai.label)} の通常のチャット（またはカスタム指示欄）に貼り付けてください。 ${open}`;
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }
  const orig = btn.textContent;
  btn.textContent = "コピーしました";
  btn.classList.add("is-copied");
  setTimeout(() => { btn.textContent = orig; btn.classList.remove("is-copied"); }, 1500);
}

// ---------- utils ----------
function escapeHTML(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(s) { return escapeHTML(s); }

init();
