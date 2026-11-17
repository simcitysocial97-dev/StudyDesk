/* StudyDesk learning engine: content loading, question selection, scoring, flashcard scheduling and
 * 15-day-plan progress. Pure logic (no DOM) so it runs in the browser and in Node tests. */
(function (root) {
  'use strict';
  const TODAY = d => { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d, 12); dt.setDate(dt.getDate() + n); return TODAY(dt); };
  const unitOfQuestionId = id => { const m = /-U(\d+)-/.exec(String(id)); return m ? Number(m[1]) : 0; };
  const TYPE_LABEL = { conceptual: 'Conceptual', application: 'Application', multi_statement: 'Multi-statement', matching: 'Matching', assertion_reason: 'Assertion–Reason', experimental_analysis: 'Experimental analysis', numerical: 'Numerical' };
  const DIFF_ORDER = ['moderate', 'difficult', 'very difficult'];

  // ---------- content loading (static JSON, cached in memory; the service worker caches the files for offline use) ----------
  const cache = { index: null, topics: new Map(), questions: new Map() };
  async function getJson(path) { const r = await fetch(path); if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`); return r.json(); }
  async function loadIndex() { return cache.index || (cache.index = await getJson('./content/index.json')); }
  async function loadTopic(id) { if (!cache.topics.has(id)) cache.topics.set(id, await getJson(`./content/topics/${id}.json`)); return cache.topics.get(id); }
  async function loadUnitQuestions(n) { if (!cache.questions.has(n)) cache.questions.set(n, await getJson(`./content/questions/unit-${String(n).padStart(2, '0')}.json`)); return cache.questions.get(n); }
  async function loadQuestionsForUnits(nums) { return (await Promise.all(nums.map(loadUnitQuestions))).flat(); }
  async function prefetchAll(index, onProgress) {
    const urls = [];
    index.units.forEach(u => { urls.push(`./content/questions/unit-${String(u.number).padStart(2, '0')}.json`); u.topics.forEach(t => urls.push(`./content/topics/${t.id}.json`)); });
    let done = 0;
    for (const url of urls) { try { await (await fetch(url)).arrayBuffer(); } catch (_) { /* offline copy will be retried next time */ } onProgress && onProgress(++done, urls.length); }
    return done;
  }

  // ---------- small helpers ----------
  function shuffle(list, rng) { rng = rng || Math.random; const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const unitIndex = (index, n) => index.units.find(u => u.number === Number(n)) || null;
  const allUnitNumbers = index => index.units.map(u => u.number);

  // ---------- question selection ----------
  // mode: 'new' (unseen first, then least recently seen) | 'wrong' (last attempt incorrect) | 'flagged' | 'any' (weakest first, then unseen)
  function pickQuestions(pool, stats, opts) {
    opts = opts || {}; stats = stats || {};
    const rng = opts.rng || Math.random, count = opts.count || 20;
    let list = pool.filter(q => (!opts.topic || q.topic === opts.topic) && (!opts.diff || q.diff === opts.diff) && (!opts.type || q.type === opts.type));
    const st = q => stats[q.id]; const seen = q => !!(st(q) && st(q).n > 0);
    let ordered;
    if (opts.mode === 'wrong') ordered = shuffle(list.filter(q => st(q) && st(q).ok === false), rng);
    else if (opts.mode === 'flagged') ordered = shuffle(list.filter(q => st(q) && st(q).flag), rng);
    else if (opts.mode === 'any') {
      const wrong = shuffle(list.filter(q => st(q) && st(q).ok === false), rng);
      const fresh = shuffle(list.filter(q => !seen(q)), rng);
      const rest = shuffle(list.filter(q => seen(q) && st(q).ok !== false), rng);
      ordered = [...wrong.slice(0, Math.ceil(count * 0.4)), ...fresh, ...wrong.slice(Math.ceil(count * 0.4)), ...rest];
    } else {
      const fresh = shuffle(list.filter(q => !seen(q)), rng);
      const old = list.filter(q => seen(q)).sort((a, b) => String(st(a).last).localeCompare(String(st(b).last)));
      ordered = [...fresh, ...old];
    }
    const seenIds = new Set(); const out = [];
    for (const q of ordered) { if (!seenIds.has(q.id)) { seenIds.add(q.id); out.push(q); } if (out.length >= count) break; }
    // 'any' deliberately mixes wrong + fresh; shuffle the final set so units/topics interleave.
    return opts.mode === 'any' ? shuffle(out, rng) : out;
  }

  // ---------- scoring and statistics ----------
  const isCorrect = (q, choice) => q.correct.includes(choice);
  function recordAnswer(state, q, choice, date) {
    state.qStats ||= {}; state.dayPractice ||= {};
    const ok = isCorrect(q, choice), prev = state.qStats[q.id] || { n: 0, c: 0 };
    state.qStats[q.id] = { ...prev, n: prev.n + 1, c: prev.c + (ok ? 1 : 0), ok, last: date || TODAY(), u: q.u, tp: q.topic, pick: choice };
    return ok;
  }
  function recordDayPractice(state, day, ok) {
    if (!day) return; state.dayPractice ||= {};
    const d = state.dayPractice[day] || { n: 0, ok: 0 }; d.n++; if (ok) d.ok++; state.dayPractice[day] = d;
  }
  function overallStats(state, index) {
    const entries = Object.values(state.qStats || {}).filter(e => e.n > 0);
    const attempts = entries.reduce((s, e) => s + e.n, 0), correct = entries.reduce((s, e) => s + e.c, 0);
    const total = index ? index.units.reduce((s, u) => s + u.questionCount, 0) : 0;
    return { distinct: entries.length, attempts, correct, accuracy: attempts ? correct / attempts : null, total, stillWrong: entries.filter(e => e.ok === false).length, flagged: entries.filter(e => e.flag).length };
  }
  function unitStats(state, index) {
    const by = {};
    index.units.forEach(u => { by[u.number] = { unit: u, distinct: 0, attempts: 0, correct: 0, stillWrong: 0, accuracy: null, total: u.questionCount }; });
    Object.values(state.qStats || {}).forEach(e => { const r = by[e.u]; if (!r || !(e.n > 0)) return; r.distinct++; r.attempts += e.n; r.correct += e.c; if (e.ok === false) r.stillWrong++; });
    Object.values(by).forEach(r => { r.accuracy = r.attempts ? r.correct / r.attempts : null; });
    return by;
  }
  // Weakest question topics (needs >= minAttempts so one slip does not label a topic weak).
  function weakTopics(state, minAttempts, limit) {
    const by = new Map();
    Object.values(state.qStats || {}).filter(e => e.n > 0).forEach(e => { const k = `${e.u}|${e.tp}`; const r = by.get(k) || { u: e.u, topic: e.tp, n: 0, c: 0 }; r.n += e.n; r.c += e.c; by.set(k, r); });
    return [...by.values()].filter(r => r.n >= (minAttempts || 4)).map(r => ({ ...r, accuracy: r.c / r.n })).sort((a, b) => a.accuracy - b.accuracy || b.n - a.n).slice(0, limit || 5);
  }

  // ---------- flashcards (Leitner boxes sized for a 15-day horizon) ----------
  const BOX_DAYS = [0, 1, 2, 4, 7];
  function reviewCard(state, cardId, rating, date) {
    state.cardReviews ||= {}; const today = date || TODAY();
    const prev = state.cardReviews[cardId] || { box: 0, reps: 0, lapses: 0 };
    let box = rating === 'again' ? 0 : rating === 'easy' ? Math.min(4, prev.box + 2) : Math.min(4, prev.box + 1);
    state.cardReviews[cardId] = { box, reps: prev.reps + 1, lapses: prev.lapses + (rating === 'again' ? 1 : 0), last: today, due: addDays(today, BOX_DAYS[box]) };
    return state.cardReviews[cardId];
  }
  // A card is "due" when never seen, or its due date has arrived. Cards rated "again" today stay due.
  const cardIsDue = (state, id, today) => { const r = (state.cardReviews || {})[id]; return !r || r.due <= (today || TODAY()); };
  const cardsForTopics = (index, topicIds) => { const set = new Set(topicIds); const out = []; index.units.forEach(u => u.topics.forEach(t => { if (set.has(t.id)) t.cardIds.forEach(id => out.push({ id, topicId: t.id })); })); return out; };
  const cardsForUnits = (index, nums) => cardsForTopics(index, index.units.filter(u => nums.includes(u.number)).flatMap(u => u.topics.map(t => t.id)));
  function dueCards(state, index, scopeTopicIds, today) {
    const cards = scopeTopicIds ? cardsForTopics(index, scopeTopicIds) : cardsForTopics(index, index.units.flatMap(u => u.topics.map(t => t.id)));
    return cards.filter(c => cardIsDue(state, c.id, today));
  }

  // ---------- 15-day plan progress (derived from what the learner actually did) ----------
  function dayTopics(index, day) {
    const out = [];
    (day.parts || []).forEach(p => { const u = unitIndex(index, p.unit); if (u) u.topics.slice(Math.max(0, p.from - 1), Math.min(u.topics.length, p.to)).forEach(t => out.push({ ...t, unit: u.number })); });
    return out;
  }
  function dayProgress(state, index, day) {
    const topics = dayTopics(index, day), done = topics.filter(t => (state.topicRevised || {})[t.id]).length;
    const prac = (state.dayPractice || {})[day.day] || { n: 0, ok: 0 };
    const target = Number(day.practiceTarget) || 0;
    const custom = day.tasks || [];
    const topicIds = topics.map(t => t.id);
    return {
      topics, topicsDone: done, topicsTotal: topics.length,
      practiceDone: prac.n, practiceCorrect: prac.ok, practiceTarget: target,
      cardsDue: dueCards(state, index, topicIds.length ? topicIds : null).length,
      customDone: custom.filter(t => t.done).length, customTotal: custom.length,
      complete: (!topics.length || done === topics.length) && prac.n >= target
    };
  }
  // The unit numbers a practice session for this day should draw from.
  const dayPracticeUnits = (index, day) => (day.practiceScope === 'units' && day.focusUnits && day.focusUnits.length) ? day.focusUnits : allUnitNumbers(index);
  const dayPracticeMode = day => day.practiceScope === 'wrong' ? 'wrong' : day.practiceScope === 'mixed' ? 'any' : 'new';

  const api = { TODAY, addDays, unitOfQuestionId, TYPE_LABEL, DIFF_ORDER, BOX_DAYS, loadIndex, loadTopic, loadUnitQuestions, loadQuestionsForUnits, prefetchAll, shuffle, unitIndex, allUnitNumbers, pickQuestions, isCorrect, recordAnswer, recordDayPractice, overallStats, unitStats, weakTopics, reviewCard, cardIsDue, cardsForTopics, cardsForUnits, dueCards, dayTopics, dayProgress, dayPracticeUnits, dayPracticeMode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.StudyLearn = api;
})(typeof window !== 'undefined' ? window : globalThis);
