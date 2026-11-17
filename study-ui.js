/* StudyDesk · 15-day revision + practice UI. Renders the Today, Plan, Revise and Practice screens.
 * app.js hands this module a small API (state, persistence, helpers) through StudyUI.init(). */
(function (root) {
  'use strict';
  const L = root.StudyLearn;
  let A = null, index = null, indexError = '';
  const ui = {
    rv: { screen: 'units', unit: null, topicId: null, tab: 'quick', query: '', dayCtx: 0, data: null, loading: false, error: '' },
    fc: { active: false, loading: false, queue: [], i: 0, shown: false, label: '', tally: { again: 0, good: 0, easy: 0 }, done: false },
    qz: { screen: 'setup', loading: false, session: null, result: null, cfg: { scope: 'all', topic: '', diff: '', type: '', mode: 'new', count: 20, exam: false } }
  };
  let tick = null;

  // ---------- helpers ----------
  const S = () => A.state;
  const E = s => A.esc(s), T = s => A.attr(s);
  const plan = () => S().plans['15'] || [];
  const dayNo = () => A.C.currentDayNumber(S(), '15');
  const dayObj = n => plan().find(d => d.day === Number(n)) || plan()[0];
  const pct = (a, b) => (b ? Math.round((a * 100) / b) : 0);
  const bar = (a, b, cls = '') => `<div class="progress-line ${cls}"><span style="width:${Math.min(100, pct(a, b))}%"></span></div>`;
  const clock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const unitTitle = n => (index && L.unitIndex(index, n) ? L.unitIndex(index, n).title : `Unit ${n}`);
  const loadingCard = msg => `<div class="card card-pad sd-center"><span class="loader"></span><p>${E(msg || 'Loading…')}</p></div>`;
  const errorCard = msg => `<div class="card card-pad"><div class="notice warn"><span>${A.icon('alert')}</span><span>${E(msg)}</span></div><p class="small-text" style="margin-top:10px">Revision notes and questions are static files in the <code>content/</code> folder. Serve the app from a web server (not <code>file://</code>) and reload.</p></div>`;
  const needIndex = () => (indexError ? errorCard(indexError) : !index ? loadingCard('Loading revision content…') : '');
  const go = (view) => { A.navigate(view); };
  const rerender = () => A.render();
  const save = () => A.persistSoon();

  function init(api) {
    A = api;
    L.loadIndex().then(i => { index = i; rerender(); }).catch(e => { indexError = `Could not load content/index.json — ${e.message}`; rerender(); });
    document.addEventListener('keydown', onKey);
  }

  // ---------- derived plan status ----------
  const progress = d => L.dayProgress(S(), index, d);
  function behindDays() {
    const t = A.today();
    return plan().filter(d => { const date = A.C.planDate(S(), '15', d.day); return date && date < t && !d.isRest && d.status !== 'completed' && !progress(d).complete; });
  }
  const dayChip = (d, p) => d.isRest || d.status === 'rest' ? 'Rest day' : d.status === 'completed' ? 'Completed' : p.complete ? 'Ready to mark complete' : (p.topicsDone || p.practiceDone) ? 'In progress' : 'Planned';

  // ---------- TODAY ----------
  function renderToday() {
    const wait = needIndex(); if (wait) return `${A.pageHeader('Today', '')}${wait}`;
    const n = dayNo(), d = dayObj(n), p = progress(d), date = A.C.planDate(S(), '15', n) || A.today();
    const st = L.overallStats(S(), index), us = L.unitStats(S(), index), weak = L.weakTopics(S(), 4, 4);
    const revisedAll = Object.keys(S().topicRevised || {}).length, topicsAll = index.units.reduce((s, u) => s + u.topics.length, 0);
    const behind = behindDays(), streak = A.C.streakDays(S());
    const exam = A.examCountdownText();
    const savedQuiz = S().activeQuiz;
    const weakUnits = Object.values(us).filter(r => r.attempts >= 8).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
    return `${A.pageHeader('Your 15-day revision plan', 'Read the notes, drill the flashcards, then practise questions. Each day is tracked from what you actually do.')}
    <section class="dashboard-hero">
      <div class="card welcome-card"><div class="eyebrow">Day ${n} of 15</div><h2>${E(d.title)}</h2><p>${E(exam)}</p>
        <div class="welcome-actions"><button class="button" type="button" data-action="rv-open-day" data-day="${n}">${p.topicsTotal ? 'Revise today’s topics' : 'Open revision notes'} ${A.icon('arrow')}</button><button class="button secondary" type="button" data-action="qz-start-day" data-day="${n}">Practise questions</button></div></div>
      <article class="card today-side-card"><div><div class="today-date">${E(A.C.formatDate(date))}${date === A.today() ? ' · Today' : ''}</div><div class="today-number">Day ${n} <span>/ 15</span></div><div class="today-meta"><span class="pill">${E(dayChip(d, p))}</span><span class="pill">${Number(d.targetMinutes ?? 210)} min planned</span></div></div>
        <div style="margin-top:14px"><button class="button secondary small" type="button" data-action="navigate" data-view="plan">Open the 15-day plan</button></div></article>
    </section>
    ${savedQuiz ? `<div class="notice info" style="margin-bottom:14px"><span>${A.icon('clock')}</span><span>You have an unfinished question set (${E(savedQuiz.label)}, ${Object.keys(savedQuiz.answers || {}).length}/${savedQuiz.ids.length} answered). <button class="link-button" type="button" data-action="qz-resume">Resume it</button></span></div>` : ''}
    ${behind.length ? `<div class="notice warn" style="margin-bottom:14px"><span>${A.icon('alert')}</span><span>You are ${behind.length} day${behind.length === 1 ? '' : 's'} behind (${behind.slice(0, 4).map(x => 'Day ' + x.day).join(', ')}${behind.length > 4 ? '…' : ''}). Nothing is auto-completed or skipped. <button class="link-button" type="button" data-action="go-plan-day" data-day="${behind[0].day}" data-plan-id="15">Open Day ${behind[0].day}</button></span></div>` : ''}
    <section class="sd-grid3">
      <article class="card card-pad sd-task"><div class="sd-task-h"><h3>1 · Revise notes</h3><span class="tag">${p.topicsDone}/${p.topicsTotal}</span></div>${bar(p.topicsDone, p.topicsTotal)}<p class="small-text">${p.topicsTotal ? `${p.topicsTotal} topic${p.topicsTotal === 1 ? '' : 's'} today, about ${p.topics.reduce((s, t) => s + Math.round((t.minutes || 25) / 3), 0)} min of quick revision.` : 'Cross-unit practice day: no new notes. Use Revise to re-read weak topics.'}</p><button class="button small" type="button" data-action="rv-open-day" data-day="${n}">${p.topicsTotal ? 'Continue' : 'Browse notes'}</button></article>
      <article class="card card-pad sd-task"><div class="sd-task-h"><h3>2 · Flashcards</h3><span class="tag">${p.cardsDue} due</span></div><p class="small-text">Spaced review: cards you miss come back sooner, cards you know come back later.</p><button class="button small" type="button" data-action="fc-start" data-scope="day" data-day="${n}" ${p.cardsDue ? '' : 'disabled'}>${p.cardsDue ? 'Review cards' : 'Nothing due'}</button></article>
      <article class="card card-pad sd-task"><div class="sd-task-h"><h3>3 · Practice questions</h3><span class="tag">${p.practiceDone}/${p.practiceTarget}</span></div>${bar(p.practiceDone, p.practiceTarget, 'warm')}<p class="small-text">${p.practiceDone ? `${pct(p.practiceCorrect, p.practiceDone)}% correct so far today’s plan day.` : `Target ${p.practiceTarget} questions${d.practiceScope === 'wrong' ? ' from your wrong-answer list' : d.practiceScope === 'mixed' ? ', mixed units, timed' : ' from this unit'}.`}</p><button class="button small" type="button" data-action="qz-start-day" data-day="${n}">Start practice</button></article>
    </section>
    <section class="metric-grid" style="margin-top:14px" aria-label="Progress overview">
      ${A.renderMetric('Topics revised', `${revisedAll}/${topicsAll}`, `${pct(revisedAll, topicsAll)}% of all notes`, 'book')}
      ${A.renderMetric('Questions tried', `${st.distinct}/${st.total}`, `${st.attempts} attempts in total`, 'target')}
      ${A.renderMetric('Accuracy', st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)}%`, st.attempts ? `${st.correct}/${st.attempts} correct` : 'Answer a few questions first', 'chart')}
      ${A.renderMetric('Streak', `${streak}d`, 'Days with a stopped study timer', 'clock')}
    </section>
    <section class="dashboard-grid" style="margin-top:14px">
      <article class="card card-pad"><div class="card-title-row"><div><h2>Accuracy by unit</h2><p>Your own attempts; a unit shows a % after 8+ answers.</p></div><button class="link-button" type="button" data-action="navigate" data-view="quiz">Practice ↗</button></div>
        <div class="unit-bars">${index.units.map(u => { const r = us[u.number]; return `<div class="unit-bar-row"><span title="${T(u.title)}">U${u.number} · ${E(u.title)}</span><div class="progress-line thin"><span style="width:${r.attempts >= 8 ? Math.round(r.accuracy * 100) : pct(r.distinct, r.total)}%"></span></div><b>${r.attempts >= 8 ? Math.round(r.accuracy * 100) + '%' : r.distinct + '/' + r.total}</b></div>`; }).join('')}</div></article>
      <article class="card card-pad"><div class="card-title-row"><div><h2>Needs another look</h2><p>Weakest topics from your answers.</p></div></div>
        ${weak.length ? `<div class="list-rows">${weak.map(w => `<div class="list-row"><span class="tag high">${Math.round(w.accuracy * 100)}%</span><span class="list-row-main"><strong>${E(w.topic)}</strong><small>Unit ${w.u} · ${w.c}/${w.n} correct</small></span></div>`).join('')}</div>` : `<div class="empty-inline">Topics appear here after you have answered at least 4 questions in them.</div>`}
        ${st.stillWrong ? `<div style="margin-top:12px"><button class="button secondary small" type="button" data-action="qz-start-wrong">Retry ${Math.min(st.stillWrong, 20)} of ${st.stillWrong} questions you got wrong</button></div>` : ''}
        ${weakUnits.length ? `<p class="small-text" style="margin-top:10px">Lowest-accuracy units: ${weakUnits.map(r => `Unit ${r.unit.number} (${Math.round(r.accuracy * 100)}%)`).join(', ')}.</p>` : ''}</article>
    </section>
    <section><div class="section-title"><div><h2>Jump back in</h2></div></div><div class="quick-links">
      <button class="quick-link" data-action="navigate" data-view="revise">${A.icon('book')}<span>All revision notes</span></button>
      <button class="quick-link" data-action="fc-start" data-scope="all">${A.icon('note')}<span>All due flashcards</span></button>
      <button class="quick-link" data-action="navigate" data-view="practice" data-tab="mocks">${A.icon('chart')}<span>Mock tests</span></button>
      <button class="quick-link" data-action="navigate" data-view="practice" data-tab="timer">${A.icon('clock')}<span>Study timer</span></button></div></section>`;
  }

  // ---------- 15-DAY PLAN ----------
  function planListItem(d) {
    const p = progress(d), date = A.C.planDate(S(), '15', d.day), selected = Number(A.app.selectedDay) === d.day;
    return `<button type="button" class="day-list-item ${selected ? 'active' : ''}" data-action="select-day" data-day="${d.day}"><span class="day-bubble">${d.day}</span><span class="day-list-copy"><strong>${E(d.title)}</strong><small>${date ? E(A.C.formatDate(date, { month: 'short', day: 'numeric' })) : 'Set start date'} · ${E(dayChip(d, p))}</small></span><span class="day-list-right"><b>${p.practiceDone}/${p.practiceTarget}</b><small>questions</small></span></button>`;
  }
  function renderPlan() {
    const wait = needIndex(); if (wait) return `${A.pageHeader('15-day plan', '')}${wait}`;
    const days = plan(); if (!A.app.selectedDay) A.app.selectedDay = dayNo();
    const day = dayObj(A.app.selectedDay), n = day.day, p = progress(day), date = A.C.planDate(S(), '15', n);
    const rest = day.isRest || day.status === 'rest', sum = A.C.planSummary(S(), '15');
    const concepts = (day.conceptIds || []).map(id => A.C.getConcept(S(), id)).filter(Boolean);
    const statusOptions = [['planned', 'Planned'], ['partial', 'Partially completed'], ['completed', 'Completed'], ['missed', 'Missed'], ['rest', 'Rest day']];
    const unitsToday = L.dayPracticeUnits(index, day);
    return `${A.pageHeader('15-day plan', 'Revise a unit’s notes, review its flashcards, then answer questions. The last three days are cross-unit repair and mock practice.', `<button type="button" class="button secondary small" data-action="navigate" data-view="settings">Edit start date &amp; targets</button>`)}
    <div class="plan-controls"><div class="today-meta"><span class="pill">${sum.completed}/15 days marked complete</span><span class="pill">Start: ${S().settings.startDate ? E(A.C.formatDate(S().settings.startDate, { month: 'short', day: 'numeric', year: 'numeric' })) : 'not set'}</span></div></div>
    <div class="plan-layout"><section class="card day-list-card"><div class="day-list-header"><h2>15 study days</h2><p>Open any day; nothing is locked.</p></div><div class="day-list">${days.map(planListItem).join('')}</div></section>
    <section class="card day-detail"><div class="day-detail-top"><div><div class="eyebrow">Study day ${n} of 15</div><h2>${E(day.title)}</h2><p>${date ? E(A.C.formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })) : 'Set a start date in Settings'}${date === A.today() ? ' · Today' : ''}</p>
      <div class="day-detail-stats"><span class="pill">${p.topicsDone}/${p.topicsTotal} topics revised</span><span class="pill">${p.practiceDone}/${p.practiceTarget} questions</span><span class="pill">${A.C.minutesForDay(S(), '15', n)} focused min</span><span class="pill">${Number(day.targetMinutes ?? 210)} min target</span></div></div>
      <button class="button secondary small" type="button" data-action="navigate" data-view="practice" data-tab="timer">Start a study session ${A.icon('clock')}</button></div>
    ${p.complete && day.status !== 'completed' ? `<div class="notice info" style="margin-bottom:12px"><span>${A.icon('target')}</span><span>You have finished this day’s revision and question target. <button class="link-button" type="button" data-action="st-complete-day" data-day="${n}">Mark day complete</button></span></div>` : ''}
    <div class="day-edit-grid"><div class="field"><label for="day-date-15-${n}">Planned date (override)</label><input id="day-date-15-${n}" type="date" data-action="day-date" data-plan-id="15" data-day="${n}" value="${T(day.dateOverride || '')}"><span class="hint">Blank follows the start date.</span></div>
      <div class="field"><label for="day-target-15-${n}">Daily target (minutes)</label><input id="day-target-15-${n}" type="number" min="0" max="1440" step="5" data-action="day-target" data-plan-id="15" data-day="${n}" value="${Number(day.targetMinutes ?? 210)}"></div>
      <div class="field"><label for="day-status-15-${n}">Day status</label><select id="day-status-15-${n}" data-action="day-status" data-plan-id="15" data-day="${n}">${statusOptions.map(([v, l]) => `<option value="${v}" ${(day.status === v || v === 'rest' && rest) ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="field"><label for="day-notes-15-${n}">Day note / what to move if interrupted</label><textarea id="day-notes-15-${n}" data-action="day-note" data-plan-id="15" data-day="${n}" placeholder="e.g. Finish Unit 2 ANOVA tomorrow morning">${E(day.notes || '')}</textarea></div>
    ${rest ? `<div class="notice info" style="margin-top:14px">Rest day: nothing is due. Unfinished work stays unfinished until you do it.</div>` : `
    ${p.topics.length ? `<section class="day-task-section"><h3><span>1 · Revise notes</span><span class="summary-count">${p.topicsDone}/${p.topicsTotal}</span></h3><div class="sd-rows">${p.topics.map(t => `<div class="sd-row ${(S().topicRevised || {})[t.id] ? 'is-done' : ''}"><span class="sd-check" aria-hidden="true">${(S().topicRevised || {})[t.id] ? '✓' : ''}</span><span class="sd-row-main"><strong>${E(t.title)}</strong><small>Unit ${t.unit} · ~${Math.max(5, Math.round((t.minutes || 25) / 3))} min quick revision · ${t.cards} flashcards</small></span><button class="button secondary small" type="button" data-action="rv-open-topic" data-topic="${T(t.id)}" data-day="${n}">${(S().topicRevised || {})[t.id] ? 'Re-read' : 'Open'}</button></div>`).join('')}</div></section>` : `<div class="notice info" style="margin:14px 0">No new notes on this day. It is built from your own answers: repair what you got wrong, then re-read any weak topic from <button class="link-button" type="button" data-action="navigate" data-view="revise">Revise</button>.</div>`}
    <section class="day-task-section"><h3><span>${p.topics.length ? '2' : '1'} · Flashcards</span><span class="summary-count">${p.cardsDue} due</span></h3><div class="sd-row"><span class="sd-row-main"><strong>${p.cardsDue ? `${p.cardsDue} card${p.cardsDue === 1 ? '' : 's'} ready` : 'All caught up'}</strong><small>${p.topics.length ? 'Cards from today’s topics' : 'Cards from every unit that are due today'}</small></span><button class="button secondary small" type="button" data-action="fc-start" data-scope="day" data-day="${n}" ${p.cardsDue ? '' : 'disabled'}>Review</button></div></section>
    <section class="day-task-section"><h3><span>${p.topics.length ? '3' : '2'} · Practice questions</span><span class="summary-count">${p.practiceDone}/${p.practiceTarget}</span></h3>${bar(p.practiceDone, p.practiceTarget, 'warm')}
      <p class="small-text" style="margin:8px 0">${day.practiceScope === 'units' ? `Questions from ${unitsToday.map(u => 'Unit ' + u).join(' + ')}, unseen first.` : day.practiceScope === 'wrong' ? 'Questions you last answered wrong, across all units.' : 'Mixed units, weakest and unseen first, with answers hidden until the end.'}${p.practiceDone ? ` ${pct(p.practiceCorrect, p.practiceDone)}% correct.` : ''}</p>
      <div class="sd-actions"><button class="button small" type="button" data-action="qz-start-day" data-day="${n}">${p.practiceDone ? 'Continue practice' : 'Start practice'}</button>${day.practiceScope === 'units' ? `<button class="button secondary small" type="button" data-action="qz-start-day" data-day="${n}" data-mode="wrong">Wrong answers only</button>` : ''}</div></section>
    ${concepts.length ? `<details class="day-task-section" data-open-key="plan-syllabus-${n}"><summary class="link-button">Optional: official syllabus checklist for this day (${concepts.filter(c => c.status === 'completed').length}/${concepts.length})</summary><p class="small-text" style="margin:8px 0">Ticking a concept updates syllabus coverage and schedules its spaced revisions. It is separate from the daily progress above.</p>${A.dayTopicGroup(concepts, '15', n)}</details>` : ''}
    ${(day.tasks || []).length ? `<section class="day-task-section"><h3><span>Your own tasks</span><span class="summary-count">${day.tasks.filter(t => t.done).length}/${day.tasks.length}</span></h3><div class="concept-list">${day.tasks.map(t => A.dayPlanTask(t, day, '15')).join('')}</div></section>` : ''}
    <details class="day-task-section" data-open-key="add-task-15-${n}"><summary class="link-button">${A.icon('plus')} Add your own task to this day</summary><form data-form="add-plan-task" data-day="${n}" data-plan-id="15" class="form-grid" style="padding:10px 0"><div class="field span-2"><label>Task</label><input name="title" required maxlength="160" placeholder="e.g., Redo the ANOVA worked examples"></div><input type="hidden" name="paper" value="Paper 2"><div class="field"><label>Task type</label><select name="taskType"><option value="revision">Revision</option><option value="practice">Practice</option><option value="pyq">PYQ practice</option><option value="mock">Mock test</option></select></div><div class="field"><label>Minutes</label><input type="number" name="minutes" min="0" max="600" value="20"></div><div class="form-actions span-2"><button class="button small" type="submit">Add task</button></div></form></details>`}
    </section></div>`;
  }

  // ---------- REVISE ----------
  function topicRow(t, unitNo, dayCtx) {
    const done = (S().topicRevised || {})[t.id];
    return `<button type="button" class="sd-row sd-row-btn ${done ? 'is-done' : ''}" data-action="rv-open-topic" data-topic="${T(t.id)}" data-day="${dayCtx || 0}"><span class="sd-check" aria-hidden="true">${done ? '✓' : ''}</span><span class="sd-row-main"><strong>${E(t.title)}</strong><small>~${Math.max(5, Math.round((t.minutes || 25) / 3))} min quick revision · ${t.cards} flashcards${done ? ' · revised ' + E(done) : ''}</small></span><span aria-hidden="true">›</span></button>`;
  }
  function renderRevise() {
    const wait = needIndex(); if (wait) return `${A.pageHeader('Revise', '')}${wait}`;
    if (ui.fc.active) return renderFlashcards();
    const rv = ui.rv;
    if (rv.screen === 'topic') return renderTopic();
    if (rv.screen === 'unit' && rv.unit) {
      const u = L.unitIndex(index, rv.unit), us = L.unitStats(S(), index)[u.number];
      return `${A.pageHeader(`Unit ${u.number} · ${u.title}`, `${u.topics.length} topics · ${u.cardCount} flashcards · ${u.questionCount} practice questions`, `<button class="button secondary small" type="button" data-action="rv-units">← All units</button>`)}
      <div class="sd-actions" style="margin-bottom:14px"><button class="button small" type="button" data-action="qz-start-unit" data-unit="${u.number}">Practise this unit${us.attempts ? ` (${us.distinct}/${us.total} tried)` : ''}</button><button class="button secondary small" type="button" data-action="fc-start" data-scope="unit" data-unit="${u.number}">Flashcards for this unit</button></div>
      <div class="sd-rows">${u.topics.map(t => topicRow(t, u.number, 0)).join('')}</div>`;
    }
    const q = rv.query.trim().toLowerCase();
    const hits = q ? index.units.flatMap(u => u.topics.filter(t => (t.title + ' ' + (u.title)).toLowerCase().includes(q)).map(t => ({ t, u }))) : [];
    const us = L.unitStats(S(), index);
    const revisedBy = u => u.topics.filter(t => (S().topicRevised || {})[t.id]).length;
    return `${A.pageHeader('Revise', 'Quick-revision notes, definitions, tables, diagrams, mnemonics and flashcards for all ten Paper 2 units.')}
    <div class="field" style="margin-bottom:14px"><label for="rv-search">Search topics</label><input id="rv-search" type="search" data-action="rv-search" value="${T(rv.query)}" placeholder="e.g. reliability, Piaget, ANOVA, attribution"></div>
    ${q ? (hits.length ? `<div class="sd-rows">${hits.slice(0, 30).map(({ t, u }) => `<button type="button" class="sd-row sd-row-btn" data-action="rv-open-topic" data-topic="${T(t.id)}" data-day="0"><span class="sd-check" aria-hidden="true">${(S().topicRevised || {})[t.id] ? '✓' : ''}</span><span class="sd-row-main"><strong>${E(t.title)}</strong><small>Unit ${u.number} · ${E(u.title)}</small></span><span aria-hidden="true">›</span></button>`).join('')}</div>` : `<div class="empty-inline">No topic title matches “${E(rv.query)}”.</div>`) : `
    <div class="sd-unit-grid">${index.units.map(u => `<article class="card card-pad sd-unit"><div class="sd-unit-h"><span class="unit-number">${u.number}</span><h3>${E(u.title)}</h3></div>${bar(revisedBy(u), u.topics.length)}<p class="small-text">${revisedBy(u)}/${u.topics.length} topics revised · ${u.cardCount} cards · ${us[u.number].distinct}/${u.questionCount} questions tried${us[u.number].attempts >= 8 ? ' · ' + Math.round(us[u.number].accuracy * 100) + '% correct' : ''}</p><button class="button secondary small" type="button" data-action="rv-open-unit" data-unit="${u.number}">Open unit</button></article>`).join('')}</div>
    <div class="card card-pad" style="margin-top:14px"><div class="card-title-row"><div><h2>Use offline</h2><p>Save every note and question file on this device so revision works without internet (about 5 MB).</p></div><button class="button secondary small" type="button" data-action="dl-offline" id="dl-offline-btn">Save for offline</button></div></div>`}`;
  }

  function neighbours(topicId) {
    const day = ui.rv.dayCtx ? dayObj(ui.rv.dayCtx) : null;
    const list = day && L.dayTopics(index, day).length ? L.dayTopics(index, day).map(t => t.id) : (index.units.find(u => u.topics.some(t => t.id === topicId)) || { topics: [] }).topics.map(t => t.id);
    const i = list.indexOf(topicId);
    return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
  }
  const notesHtml = notes => notes.map(n => {
    if (n.k === 'h') return `<h${Math.min(5, (n.l || 2) + 1)} class="sd-h">${E(n.t)}</h${Math.min(5, (n.l || 2) + 1)}>`;
    if (n.k === 'p') return `<p>${E(n.t)}</p>`;
    if (n.k === 'b') return `<ul class="sd-list">${n.i.map(i => `<li>${E(i)}</li>`).join('')}</ul>`;
    if (n.k === 'd') return `<div class="sd-def"><b>${E(n.term)}</b><span>${E(n.t)}</span></div>`;
    if (n.k === 't') return tableHtml(n);
    if (n.k === 'x') return `<div class="sd-callout exam"><b>Exam link</b> ${E(n.t)}</div>`;
    return '';
  }).join('');
  const tableHtml = n => `<div class="sd-table-wrap">${n.c ? `<div class="sd-caption">${E(n.c)}</div>` : ''}<table class="data-table sd-table"><thead><tr>${n.h.map(h => `<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${n.r.map(r => `<tr>${r.map(c => `<td>${E(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  function renderTopic() {
    const rv = ui.rv, meta = index.units.flatMap(u => u.topics.map(t => ({ ...t, unit: u.number }))).find(t => t.id === rv.topicId);
    const back = `<button class="button secondary small" type="button" data-action="${rv.dayCtx ? 'go-plan-day' : 'rv-open-unit'}" data-day="${rv.dayCtx}" data-plan-id="15" data-unit="${meta ? meta.unit : ''}">← ${rv.dayCtx ? 'Day ' + rv.dayCtx : 'Unit ' + (meta ? meta.unit : '')}</button>`;
    if (rv.loading || !rv.data) return `${A.pageHeader(meta ? meta.title : 'Topic', '', back)}${rv.error ? errorCard(rv.error) : loadingCard('Opening notes…')}`;
    const t = rv.data, nb = neighbours(t.id), done = (S().topicRevised || {})[t.id];
    const defs = t.notes.filter(n => n.k === 'd'), tables = t.notes.filter(n => n.k === 't'), exams = t.notes.filter(n => n.k === 'x');
    const tabs = [['quick', 'Quick revision'], ['full', 'Full notes'], ['cards', `Flashcards (${t.flashcards.length})`]];
    const body = rv.tab === 'full' ? `<div class="card card-pad sd-prose">${t.notes.length ? notesHtml(t.notes) : '<p>No detailed notes for this topic.</p>'}</div>`
      : rv.tab === 'cards' ? `<div class="card card-pad">${t.flashcards.length ? `<p class="small-text" style="margin-bottom:10px">Tap a question to reveal its answer. Use the spaced review for scheduling.</p>${t.flashcards.map(c => `<details class="sd-fc-item"><summary>${E(c.q)}</summary><div class="sd-fc-a">${E(c.a)}${c.h ? `<small>Hint: ${E(c.h)}</small>` : ''}</div></details>`).join('')}<div style="margin-top:12px"><button class="button small" type="button" data-action="fc-start" data-scope="topic" data-topic="${T(t.id)}">Start spaced review</button></div>` : '<div class="empty-inline">This topic has no flashcards.</div>'}</div>`
      : `<div class="sd-stack">
        ${t.revision ? `<div class="sd-callout remember"><b>In one line</b> ${E(t.revision)}</div>` : ''}
        ${t.summary ? `<div class="card card-pad"><p style="margin:0">${E(t.summary)}</p></div>` : ''}
        ${t.objectives.length ? `<div class="card card-pad"><h3 class="sd-h3">You should be able to</h3><ul class="sd-list">${t.objectives.map(o => `<li>${E(o)}</li>`).join('')}</ul></div>` : ''}
        ${t.keyTerms.length ? `<div class="card card-pad"><h3 class="sd-h3">Key terms</h3><div class="sd-chips">${t.keyTerms.map(k => `<span class="pill">${E(k)}</span>`).join('')}</div></div>` : ''}
        ${t.traps.length ? `<div class="sd-callout trap"><b>Exam traps</b><ul class="sd-list">${t.traps.map(x => `<li>${E(x)}</li>`).join('')}</ul></div>` : ''}
        ${t.confusions.length ? `<div class="sd-callout confuse"><b>Commonly confused</b><ul class="sd-list">${t.confusions.map(x => `<li>${E(x)}</li>`).join('')}</ul></div>` : ''}
        ${defs.length ? `<div class="card card-pad"><h3 class="sd-h3">Definitions</h3>${defs.map(d => `<div class="sd-def"><b>${E(d.term)}</b><span>${E(d.t)}</span></div>`).join('')}</div>` : ''}
        ${t.mnemonics.length ? `<div class="card card-pad"><h3 class="sd-h3">Memory aids</h3>${t.mnemonics.map(m => `<div class="sd-def"><b>${E(m.title)}</b><span>${E(m.text)}</span></div>`).join('')}</div>` : ''}
        ${tables.length ? `<div class="card card-pad"><h3 class="sd-h3">Comparison tables</h3>${tables.map(tableHtml).join('')}</div>` : ''}
        ${t.diagrams.length ? `<div class="card card-pad"><h3 class="sd-h3">Diagrams</h3>${t.diagrams.map(d => `<figure class="sd-fig"><img src="./content/media/${T(d.file)}" alt="${T(d.caption || 'Diagram')}" loading="lazy"><figcaption>${E(d.caption)}</figcaption></figure>`).join('')}</div>` : ''}
        ${exams.length ? `<div class="sd-callout exam"><b>Where this shows up in exams</b><ul class="sd-list">${exams.map(x => `<li>${E(x.t)}</li>`).join('')}</ul></div>` : ''}
        ${!t.revision && !t.summary && !t.notes.length ? '<div class="empty-inline">No notes were provided for this topic.</div>' : ''}</div>`;
    return `${A.pageHeader(t.title, `Unit ${meta ? meta.unit : ''} · ${meta ? unitTitle(meta.unit) : ''}`, back)}
    <div class="practice-tabs" role="tablist">${tabs.map(([id, name]) => `<button type="button" role="tab" aria-selected="${rv.tab === id}" class="${rv.tab === id ? 'active' : ''}" data-action="rv-tab" data-tab="${id}">${E(name)}</button>`).join('')}</div>
    ${body}
    <div class="sd-actions" style="margin-top:14px">${nb.prev ? `<button class="button secondary small" type="button" data-action="rv-open-topic" data-topic="${T(nb.prev)}" data-day="${rv.dayCtx}">← Previous topic</button>` : ''}<button class="button secondary small" type="button" data-action="qz-start-unit" data-unit="${meta ? meta.unit : ''}">Practise this unit</button></div>
    <div class="sd-sticky-actions card"><div class="sd-actions"><button class="button ${done ? 'secondary' : ''}" type="button" data-action="rv-mark" data-topic="${T(t.id)}">${done ? '✓ Revised · undo' : 'Mark as revised'}</button>${nb.next ? `<button class="button secondary" type="button" data-action="rv-mark-next" data-topic="${T(t.id)}" data-next="${T(nb.next)}">${done ? 'Next topic' : 'Revised & next'} ${A.icon('arrow')}</button>` : ''}</div></div>`;
  }

  async function openTopic(id, dayCtx) {
    const rv = ui.rv; rv.screen = 'topic'; rv.topicId = id; rv.dayCtx = Number(dayCtx) || 0; rv.tab = 'quick'; rv.data = null; rv.error = ''; rv.loading = true; ui.fc.active = false;
    const u = index.units.find(x => x.topics.some(t => t.id === id)); if (u) rv.unit = u.number;
    go('revise');
    try { rv.data = await L.loadTopic(id); } catch (e) { rv.error = `Could not open this topic (${e.message}). If you are offline, open it once while online or use “Save for offline”.`; }
    rv.loading = false; rerender(); window.scrollTo({ top: 0 });
  }

  // ---------- FLASHCARDS ----------
  async function startCards(scope, o) {
    const fc = ui.fc; fc.active = true; fc.loading = true; fc.done = false; fc.i = 0; fc.shown = false; fc.tally = { again: 0, good: 0, easy: 0 }; fc.queue = []; ui.rv.screen = 'units'; go('revise');
    let ids = null, label = 'All units';
    if (scope === 'day') { const d = dayObj(o.day); const t = L.dayTopics(index, d).map(x => x.id); ids = t.length ? t : null; label = `Day ${d.day}`; }
    else if (scope === 'unit') { ids = L.unitIndex(index, o.unit).topics.map(t => t.id); label = `Unit ${o.unit}`; }
    else if (scope === 'topic') { ids = [o.topic]; label = 'This topic'; }
    const due = L.dueCards(S(), index, ids).slice(0, 40);
    fc.label = label;
    if (!due.length) { fc.loading = false; fc.done = true; rerender(); return; }
    try {
      const topics = await Promise.all([...new Set(due.map(c => c.topicId))].map(L.loadTopic));
      const text = new Map(); topics.forEach(t => t.flashcards.forEach(c => text.set(c.id, { ...c, topicId: t.id, topic: t.title })));
      fc.queue = L.shuffle(due.map(c => text.get(c.id)).filter(Boolean));
    } catch (e) { fc.queue = []; A.toast(`Could not load flashcards (${e.message}).`, 'error'); }
    fc.loading = false; if (!fc.queue.length) fc.done = true; rerender();
  }
  function renderFlashcards() {
    const fc = ui.fc, back = `<button class="button secondary small" type="button" data-action="fc-end">Done</button>`;
    if (fc.loading) return `${A.pageHeader('Flashcards', '', back)}${loadingCard('Preparing your cards…')}`;
    if (fc.done || fc.i >= fc.queue.length) {
      const t = fc.tally, total = t.again + t.good + t.easy;
      return `${A.pageHeader('Flashcards', fc.label, back)}<div class="card card-pad sd-center"><h2>${total ? 'Session complete' : 'Nothing due'}</h2><p>${total ? `${total} cards reviewed: ${t.easy} easy, ${t.good} good, ${t.again} to see again soon.` : 'Every card in this set is scheduled for a later day. Come back tomorrow, or practise questions now.'}</p><div class="sd-actions" style="justify-content:center"><button class="button" type="button" data-action="qz-start-day" data-day="${dayNo()}">Practise questions</button><button class="button secondary" type="button" data-action="fc-end">Back to revision</button></div></div>`;
    }
    const c = fc.queue[fc.i], r = (S().cardReviews || {})[c.id];
    const preview = rating => { const box = rating === 'again' ? 0 : Math.min(4, (r ? r.box : 0) + (rating === 'easy' ? 2 : 1)); const d = L.BOX_DAYS[box]; return d === 0 ? 'again today' : d === 1 ? 'tomorrow' : `in ${d} days`; };
    return `${A.pageHeader('Flashcards', `${fc.label} · ${fc.i + 1} of ${fc.queue.length}`, back)}${bar(fc.i, fc.queue.length)}
    <div class="card card-pad sd-flash"><div class="small-text">${E(c.topic)}</div><div class="sd-flash-q">${E(c.q)}</div>
    ${fc.shown ? `<div class="sd-flash-a">${E(c.a)}</div>${c.h ? `<div class="small-text">Hint was: ${E(c.h)}</div>` : ''}<div class="sd-rate"><button class="button danger" type="button" data-action="fc-rate" data-rating="again">Again<small>${preview('again')}</small></button><button class="button secondary" type="button" data-action="fc-rate" data-rating="good">Good<small>${preview('good')}</small></button><button class="button" type="button" data-action="fc-rate" data-rating="easy">Easy<small>${preview('easy')}</small></button></div>`
      : `${c.h ? `<div class="small-text">Hint: ${E(c.h)}</div>` : ''}<button class="button" type="button" data-action="fc-flip">Show answer</button>`}</div>`;
  }
  function rateCard(rating) {
    const fc = ui.fc, c = fc.queue[fc.i]; if (!c) return;
    L.reviewCard(S(), c.id, rating, A.today()); fc.tally[rating]++;
    if (rating === 'again') fc.queue.push(c);          // missed cards return once more at the end of this session
    fc.i++; fc.shown = false; if (fc.i >= fc.queue.length) fc.done = true;
    A.persist().then(rerender);
  }

  // ---------- PRACTICE (question bank) ----------
  const elapsedMs = s => s.acc + (s.resumedAt ? Date.now() - s.resumedAt : 0);
  function saveSession() {
    const s = ui.qz.session; if (!s) return;
    S().activeQuiz = { ids: s.qs.map(q => q.id), answers: s.answers, checked: s.checked, idx: s.idx, mode: s.mode, day: s.day, label: s.label, elapsed: elapsedMs(s), cfg: s.cfg };
    save();
  }
  function beginSession(qs, o) {
    if (!qs.length) return false;
    ui.qz.session = { qs, answers: {}, checked: {}, idx: 0, mode: o.exam ? 'exam' : 'practice', day: o.day || 0, label: o.label, acc: o.acc || 0, resumedAt: Date.now(), cfg: o.cfg || {} };
    ui.qz.screen = 'session'; ui.qz.result = null; saveSession(); startClock(); go('quiz'); window.scrollTo({ top: 0 });
    return true;
  }
  async function startQuiz(o) {
    ui.qz.loading = true; go('quiz');
    try {
      const pool = await L.loadQuestionsForUnits(o.units);
      const qs = L.pickQuestions(pool, S().qStats, { mode: o.mode, count: o.count, topic: o.topic, diff: o.diff, type: o.type });
      ui.qz.loading = false;
      if (!beginSession(qs, o)) { ui.qz.screen = 'setup'; A.toast(o.mode === 'wrong' ? 'No wrong answers in these units yet. Answer some questions first.' : o.mode === 'flagged' ? 'No flagged questions in these units.' : 'No questions match those filters.', 'error'); rerender(); }
    } catch (e) { ui.qz.loading = false; ui.qz.screen = 'setup'; A.toast(`Could not load questions (${e.message}). If offline, use “Save for offline” once while online.`, 'error'); rerender(); }
  }
  async function resumeQuiz() {
    const a = S().activeQuiz; if (!a) return;
    ui.qz.loading = true; go('quiz');
    try {
      const units = [...new Set(a.ids.map(L.unitOfQuestionId))];
      const byId = new Map((await L.loadQuestionsForUnits(units)).map(q => [q.id, q]));
      const qs = a.ids.map(id => byId.get(id)).filter(Boolean);
      ui.qz.loading = false;
      if (!qs.length) { S().activeQuiz = null; save(); ui.qz.screen = 'setup'; return rerender(); }
      ui.qz.session = { qs, answers: a.answers || {}, checked: a.checked || {}, idx: Math.min(a.idx || 0, qs.length - 1), mode: a.mode, day: a.day, label: a.label, acc: a.elapsed || 0, resumedAt: Date.now(), cfg: a.cfg || {} };
      ui.qz.screen = 'session'; startClock(); rerender();
    } catch (e) { ui.qz.loading = false; ui.qz.screen = 'setup'; A.toast(`Could not resume (${e.message}).`, 'error'); rerender(); }
  }
  function startClock() { clearInterval(tick); tick = setInterval(() => { const el = document.getElementById('qz-clock'), s = ui.qz.session; if (el && s && ui.qz.screen === 'session') el.textContent = clock(elapsedMs(s)); }, 1000); }

  function commitAnswer(s, q) {
    if (s.checked[q.id] || !s.answers[q.id]) return;
    const ok = L.recordAnswer(S(), q, s.answers[q.id], A.today()); s.checked[q.id] = true; L.recordDayPractice(S(), s.day, ok);
  }
  function finishQuiz() {
    const s = ui.qz.session; if (!s) return;
    s.qs.forEach(q => commitAnswer(s, q));
    const rows = s.qs.map(q => ({ q, pick: s.answers[q.id] || '', ok: s.answers[q.id] ? L.isCorrect(q, s.answers[q.id]) : null }));
    const answered = rows.filter(r => r.pick).length, correct = rows.filter(r => r.ok).length, seconds = Math.round(elapsedMs(s) / 1000);
    ui.qz.result = { rows, answered, correct, total: s.qs.length, seconds, label: s.label, mode: s.mode, day: s.day };
    S().quizHistory ||= []; S().quizHistory.unshift({ id: A.uid('quiz'), date: A.today(), label: s.label, day: s.day, mode: s.mode, total: s.qs.length, answered, correct, seconds });
    S().quizHistory = S().quizHistory.slice(0, 200);
    S().activeQuiz = null; ui.qz.session = null; ui.qz.screen = 'results'; clearInterval(tick);
    A.persist().then(rerender); window.scrollTo({ top: 0 });
  }

  function questionHtml(s, q, i) {
    const picked = s.answers[q.id], checked = !!s.checked[q.id], exam = s.mode === 'exam', st = (S().qStats || {})[q.id];
    const ok = checked ? L.isCorrect(q, picked) : null;
    return `<article class="card card-pad sd-q"><div class="sd-chips"><span class="pill">Unit ${q.u}</span><span class="pill">${E(L.TYPE_LABEL[q.type] || q.type)}</span><span class="pill">${E(q.diff || '')}</span>${st && st.n && !checked ? `<span class="pill ${st.ok ? '' : 'sd-bad'}">${st.ok ? 'Got it right before' : 'Got it wrong before'}</span>` : ''}</div>
      <div class="small-text" style="margin-top:6px">${E(q.topic)}${q.sub ? ' › ' + E(q.sub) : ''}</div>
      <p class="sd-stem">${E(q.stem)}</p>
      ${q.assertion ? `<div class="sd-ar"><b>Assertion (A)</b> ${E(q.assertion)}</div>` : ''}${q.reason ? `<div class="sd-ar"><b>Reason (R)</b> ${E(q.reason)}</div>` : ''}
      ${q.statements.length ? `<div class="sd-stmts">${q.statements.map(x => `<div>${E(x)}</div>`).join('')}</div>` : ''}
      ${q.listI.length || q.listII.length ? `<div class="sd-table-wrap"><table class="data-table sd-table"><thead><tr><th>List I</th><th>List II</th></tr></thead><tbody>${Array.from({ length: Math.max(q.listI.length, q.listII.length) }, (_, k) => `<tr><td>${E(q.listI[k] || '')}</td><td>${E(q.listII[k] || '')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="sd-opts" role="group" aria-label="Answer options">${q.options.map(o => {
        const cls = ['sd-opt', picked === o.id ? 'is-picked' : '', checked && q.correct.includes(o.id) ? 'is-correct' : '', checked && picked === o.id && !q.correct.includes(o.id) ? 'is-wrong' : ''].join(' ');
        return `<button type="button" class="${cls}" data-action="qz-pick" data-opt="${T(o.id)}" aria-pressed="${picked === o.id}" ${checked ? 'disabled' : ''}><span class="sd-opt-id">${E(o.id)}</span><span>${E(o.text)}${checked && s.mode === 'practice' && q.optWhy[o.id] ? `<small>${E(q.optWhy[o.id])}</small>` : ''}</span></button>`;
      }).join('')}</div>
      ${checked && !exam ? `<div class="sd-callout ${ok ? 'remember' : 'trap'}"><b>${ok ? 'Correct' : 'Not quite. Correct answer: ' + E(q.correct.join(', '))}</b><p style="margin:6px 0 0">${E(q.why)}</p>${q.key ? `<p class="small-text" style="margin:6px 0 0">Key concept: ${E(q.key)}</p>` : ''}</div>` : ''}
      <div class="sd-actions" style="margin-top:12px"><button class="button secondary small" type="button" data-action="qz-flag" data-qid="${T(q.id)}">${st && st.flag ? '★ Flagged' : '☆ Flag for later'}</button></div></article>`;
  }

  function renderQuiz() {
    const wait = needIndex(); if (wait) return `${A.pageHeader('Practice', '')}${wait}`;
    const z = ui.qz;
    if (z.loading) return `${A.pageHeader('Practice', '')}${loadingCard('Loading questions…')}`;
    if (z.screen === 'session' && z.session) {
      const s = z.session, q = s.qs[s.idx], checked = !!s.checked[q.id], exam = s.mode === 'exam', last = s.idx === s.qs.length - 1;
      const answeredN = Object.keys(s.answers).length;
      return `${A.pageHeader(s.label, `Question ${s.idx + 1} of ${s.qs.length} · ${answeredN} answered${exam ? ' · answers shown at the end' : ''}`, `<span class="pill" aria-label="Elapsed time">${A.icon('clock')} <span id="qz-clock">${clock(elapsedMs(s))}</span></span>`)}
      ${bar(answeredN, s.qs.length)}
      <details class="sd-nav-details" data-open-key="qz-palette"><summary>Jump to a question</summary><div class="sd-palette" role="group" aria-label="Question navigator">${s.qs.map((x, k) => `<button type="button" class="sd-dot ${k === s.idx ? 'is-current' : ''} ${s.checked[x.id] && !exam ? (L.isCorrect(x, s.answers[x.id]) ? 'is-correct' : 'is-wrong') : s.answers[x.id] ? 'is-picked' : ''}" data-action="qz-jump" data-i="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</div></details>
      ${questionHtml(s, q, s.idx)}
      <div class="sd-sticky-actions card"><div class="sd-actions">
        ${s.idx > 0 ? `<button class="button secondary" type="button" data-action="qz-prev">← Back</button>` : ''}
        ${!exam && !checked ? `<button class="button" type="button" data-action="qz-check" ${s.answers[q.id] ? '' : 'disabled'}>Check answer</button>` : ''}
        ${!last ? `<button class="button ${(!exam && !checked) ? 'secondary' : ''}" type="button" data-action="qz-next">${exam || checked ? 'Next' : 'Skip'} ${A.icon('arrow')}</button>` : ''}
        <button class="button ${last && (exam || checked) ? '' : 'secondary'}" type="button" data-action="qz-finish">Finish &amp; see score</button></div></div>`;
    }
    if (z.screen === 'results' && z.result) {
      const r = z.result, wrong = r.rows.filter(x => x.ok === false), skipped = r.total - r.answered;
      const byTopic = new Map(); r.rows.forEach(x => { if (!x.pick) return; const t = byTopic.get(x.q.topic) || { n: 0, c: 0 }; t.n++; if (x.ok) t.c++; byTopic.set(x.q.topic, t); });
      return `${A.pageHeader('Results', r.label)}
      <section class="metric-grid">${A.renderMetric('Score', `${r.correct}/${r.total}`, skipped ? `${skipped} skipped` : 'All answered', 'target')}${A.renderMetric('Accuracy', r.answered ? `${pct(r.correct, r.answered)}%` : '—', `of ${r.answered} answered`, 'chart')}${A.renderMetric('Time', clock(r.seconds * 1000), r.answered ? `${Math.round(r.seconds / r.answered)} s per question` : '', 'clock')}${A.renderMetric('To repair', String(wrong.length), 'wrong answers saved for repair days', 'alert')}</section>
      <div class="sd-actions" style="margin:14px 0">${wrong.length ? `<button class="button" type="button" data-action="qz-retry-wrong">Retry the ${wrong.length} wrong</button>` : ''}<button class="button secondary" type="button" data-action="qz-new">New question set</button><button class="button secondary" type="button" data-action="navigate" data-view="plan">Back to plan</button></div>
      ${byTopic.size ? `<div class="card card-pad"><h3 class="sd-h3">By topic</h3><div class="list-rows">${[...byTopic.entries()].sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).map(([t, v]) => `<div class="report-stat-row"><span>${E(t)}</span><b class="${v.c / v.n < .6 ? 'accuracy-low' : 'accuracy-good'}">${v.c}/${v.n}</b></div>`).join('')}</div></div>` : ''}
      <div class="section-title"><div><h2>Review every question</h2><p>Wrong answers first.</p></div></div>
      <div class="sd-rows">${[...wrong, ...r.rows.filter(x => x.ok !== false)].map(x => `<details class="sd-review ${x.ok === false ? 'is-wrong' : x.ok ? 'is-correct' : ''}"><summary><span class="sd-mark">${x.ok === null ? '–' : x.ok ? '✓' : '✗'}</span>${E(x.q.stem.length > 140 ? x.q.stem.slice(0, 140) + '…' : x.q.stem)}</summary><div class="sd-review-body">${questionHtml({ answers: { [x.q.id]: x.pick }, checked: { [x.q.id]: true }, mode: 'practice', qs: [x.q] }, x.q, 0).replace(/<div class="sd-actions"[\s\S]*?<\/div><\/article>/, '</article>')}</div></details>`).join('')}</div>`;
    }
    // setup
    const cfg = z.cfg, st = L.overallStats(S(), index), a = S().activeQuiz;
    const d = dayObj(dayNo()), sc = cfg.scope;
    const unitNo = /^unit:(\d+)$/.test(sc) ? Number(sc.split(':')[1]) : 0, u = unitNo ? L.unitIndex(index, unitNo) : null;
    const sel = (field, opts, val) => `<select data-action="qz-cfg" data-field="${field}">${opts.map(([v, l]) => `<option value="${T(v)}" ${String(val) === String(v) ? 'selected' : ''}>${E(l)}</option>`).join('')}</select>`;
    const types = [...new Set(index.units.flatMap(x => Object.keys(x.qTypes)))];
    return `${A.pageHeader('Practice questions', `${st.total.toLocaleString()} exam-style questions across all ten units, each with an explanation for every option.`)}
    ${a ? `<div class="notice info" style="margin-bottom:14px"><span>${A.icon('clock')}</span><span>Unfinished set: ${E(a.label)} (${Object.keys(a.answers || {}).length}/${a.ids.length} answered). <button class="link-button" type="button" data-action="qz-resume">Resume</button> · <button class="link-button" type="button" data-action="qz-discard">Discard</button></span></div>` : ''}
    <section class="metric-grid">${A.renderMetric('Tried', `${st.distinct}/${st.total}`, `${pct(st.distinct, st.total)}% of the bank`, 'target')}${A.renderMetric('Accuracy', st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)}%`, `${st.correct}/${st.attempts} correct`, 'chart')}${A.renderMetric('Wrong list', String(st.stillWrong), 'last answer incorrect', 'alert')}${A.renderMetric('Flagged', String(st.flagged), 'saved for later', 'note')}</section>
    <section class="card form-card" style="margin-top:14px"><h2>Build a question set</h2><div class="form-grid">
      <div class="field"><label>What to practise</label>${sel('scope', [['all', 'All units (mixed)'], ['day', `Today’s plan · Day ${d.day}`], ...index.units.map(x => [`unit:${x.number}`, `Unit ${x.number} · ${x.title}`])], sc)}</div>
      <div class="field"><label>Which questions</label>${sel('mode', [['new', 'New first, then oldest'], ['any', 'Weakest + new, mixed'], ['wrong', `Only ones I got wrong${st.stillWrong ? ` (${st.stillWrong})` : ''}`], ['flagged', `Only flagged${st.flagged ? ` (${st.flagged})` : ''}`]], cfg.mode)}</div>
      ${u ? `<div class="field"><label>Topic</label>${sel('topic', [['', 'All topics in this unit'], ...u.qTopics.map(t => [t.name, `${t.name} (${t.n})`])], cfg.topic)}</div>` : ''}
      <div class="field"><label>Difficulty</label>${sel('diff', [['', 'Any'], ...L.DIFF_ORDER.map(x => [x, x[0].toUpperCase() + x.slice(1)])], cfg.diff)}</div>
      <div class="field"><label>Question type</label>${sel('type', [['', 'Any'], ...types.map(x => [x, L.TYPE_LABEL[x] || x])], cfg.type)}</div>
      <div class="field"><label>How many</label>${sel('count', [[10, '10'], [20, '20'], [30, '30'], [50, '50'], [100, '100 (full mock length)']], cfg.count)}</div>
      <label class="sd-check-field span-2"><input type="checkbox" data-action="qz-cfg" data-field="exam" ${cfg.exam ? 'checked' : ''}> <span><b>Exam mode</b> · timed, answers and explanations are hidden until you finish</span></label>
      <div class="form-actions span-2"><button class="button" type="button" data-action="qz-start">Start practice ${A.icon('arrow')}</button></div></div>
      <p class="disclaimer">These are practice questions generated from the study material, not official past papers. Check an answer against your textbook if an explanation looks doubtful. Use the PYQ log in Mocks &amp; logs for real exam questions.</p></section>`;
  }

  // ---------- reports panel (appended to Reports) ----------
  function reportPanel() {
    if (!index) return '';
    const us = L.unitStats(S(), index), hist = (S().quizHistory || []).slice(0, 8), st = L.overallStats(S(), index);
    return `<section class="section-title"><div><h2>Question-bank practice</h2><p>From the in-app Practice screen.</p></div></section><div class="analytics-grid"><article class="card analytics-card"><div class="card-title-row"><div><h2>Accuracy by unit</h2><p>${st.attempts} attempts · ${st.distinct} distinct questions</p></div></div><div class="unit-bars">${index.units.map(u => { const r = us[u.number]; return `<div class="unit-bar-row"><span>U${u.number} · ${E(u.title)}</span><div class="progress-line thin"><span style="width:${r.attempts ? Math.round(r.accuracy * 100) : 0}%"></span></div><b>${r.attempts ? Math.round(r.accuracy * 100) + '%' : '—'}</b></div>`; }).join('')}</div></article>
    <article class="card analytics-card"><div class="card-title-row"><div><h2>Recent question sets</h2></div></div>${hist.length ? `<div class="list-rows">${hist.map(h => `<div class="report-stat-row"><span>${E(h.date)} · ${E(h.label)}</span><b>${h.correct}/${h.total}</b></div>`).join('')}</div>` : `<div class="empty-inline">No finished sets yet.</div>`}</article></div>`;
  }

  // ---------- events ----------
  function handleClick(btn) {
    const a = btn.dataset.action, d = btn.dataset, rv = ui.rv, z = ui.qz;
    if (!a || !/^(rv|fc|qz|st|dl)-/.test(a)) return false;
    if (!index && a !== 'dl-offline') return true;
    switch (a) {
      case 'rv-units': rv.screen = 'units'; rv.query = ''; ui.fc.active = false; rerender(); break;
      case 'rv-open-unit': rv.screen = 'unit'; rv.unit = Number(d.unit); ui.fc.active = false; go('revise'); break;
      case 'rv-open-topic': openTopic(d.topic, d.day); break;
      case 'rv-open-day': { const day = dayObj(d.day), p = progress(day), next = p.topics.find(t => !(S().topicRevised || {})[t.id]) || p.topics[0]; if (next) openTopic(next.id, day.day); else { rv.screen = 'units'; ui.fc.active = false; go('revise'); } break; }
      case 'rv-tab': rv.tab = d.tab; rerender(); break;
      case 'rv-mark': { const m = S().topicRevised ||= {}; if (m[d.topic]) delete m[d.topic]; else m[d.topic] = A.today(); A.persist().then(rerender); break; }
      case 'rv-mark-next': { (S().topicRevised ||= {})[d.topic] ||= A.today(); A.persist(); openTopic(d.next, rv.dayCtx); break; }
      case 'fc-start': startCards(d.scope, d); break;
      case 'fc-flip': ui.fc.shown = true; rerender(); break;
      case 'fc-rate': rateCard(d.rating); break;
      case 'fc-end': ui.fc.active = false; rerender(); break;
      case 'dl-offline': { btn.disabled = true; L.prefetchAll(index, (n, t) => { btn.textContent = `Saving ${n}/${t}…`; }).then(() => { btn.textContent = 'Saved for offline ✓'; A.toast('Notes and questions are saved for offline use.'); }); break; }
      case 'st-complete-day': { const day = dayObj(d.day); day.status = 'completed'; A.persist('Day marked complete.').then(rerender); break; }
      case 'qz-start': {
        const c = z.cfg, sc = c.scope, day = dayObj(dayNo());
        const units = sc === 'all' ? L.allUnitNumbers(index) : sc === 'day' ? L.dayPracticeUnits(index, day) : [Number(sc.split(':')[1])];
        startQuiz({ units, topic: /^unit:/.test(sc) ? c.topic : '', diff: c.diff, type: c.type, mode: c.mode, count: Number(c.count), exam: c.exam, day: sc === 'day' ? day.day : 0, label: sc === 'all' ? 'Mixed practice' : sc === 'day' ? `Day ${day.day} practice` : `Unit ${units[0]} practice`, cfg: { ...c } }); break;
      }
      case 'qz-start-day': {
        const day = dayObj(d.day), p = progress(day), left = p.practiceTarget - p.practiceDone;
        const count = left <= 0 ? 20 : Math.max(10, Math.min(50, left));
        z.cfg = { ...z.cfg, scope: 'day', mode: d.mode || L.dayPracticeMode(day), exam: !!day.timed, count };
        startQuiz({ units: L.dayPracticeUnits(index, day), mode: z.cfg.mode, count, exam: !!day.timed, day: day.day, label: `Day ${day.day} · ${d.mode === 'wrong' ? 'wrong answers' : day.practiceScope === 'mixed' ? 'mock-style set' : day.practiceScope === 'wrong' ? 'repair set' : 'practice'}`, cfg: { ...z.cfg } }); break;
      }
      case 'qz-start-unit': z.cfg = { ...z.cfg, scope: `unit:${d.unit}`, topic: '', mode: 'new' }; startQuiz({ units: [Number(d.unit)], mode: 'new', count: 20, day: 0, label: `Unit ${d.unit} practice`, cfg: { ...z.cfg } }); break;
      case 'qz-start-wrong': startQuiz({ units: L.allUnitNumbers(index), mode: 'wrong', count: 20, day: 0, label: 'Wrong-answer repair', cfg: {} }); break;
      case 'qz-resume': resumeQuiz(); break;
      case 'qz-discard': if (confirm('Discard this unfinished question set? Answers already checked stay in your statistics.')) { S().activeQuiz = null; A.persist().then(rerender); } break;
      case 'qz-pick': { const s = z.session, q = s.qs[s.idx]; if (s.checked[q.id]) break; s.answers[q.id] = d.opt; saveSession(); rerender(); break; }
      case 'qz-check': { const s = z.session, q = s.qs[s.idx]; commitAnswer(s, q); saveSession(); A.persist().then(rerender); break; }
      case 'qz-next': { const s = z.session; s.idx = Math.min(s.qs.length - 1, s.idx + 1); saveSession(); rerender(); window.scrollTo({ top: 0 }); break; }
      case 'qz-prev': { const s = z.session; s.idx = Math.max(0, s.idx - 1); saveSession(); rerender(); window.scrollTo({ top: 0 }); break; }
      case 'qz-jump': { const s = z.session; s.idx = Number(d.i); saveSession(); rerender(); window.scrollTo({ top: 0 }); break; }
      case 'qz-flag': { const s = z.session, q = (s ? s.qs.find(x => x.id === d.qid) : null) || { id: d.qid, u: L.unitOfQuestionId(d.qid), topic: '' }; const m = S().qStats ||= {}; const e = m[q.id] || { n: 0, c: 0, u: q.u, tp: q.topic }; e.flag = !e.flag; m[q.id] = e; A.persist().then(rerender); break; }
      case 'qz-finish': { const s = z.session, un = s.qs.filter(q => !s.answers[q.id]).length; if (un && s.mode === 'exam' && !confirm(`${un} question${un === 1 ? ' is' : 's are'} unanswered. Finish anyway?`)) break; finishQuiz(); break; }
      case 'qz-retry-wrong': { const r = z.result; const qs = r.rows.filter(x => x.ok === false).map(x => x.q); beginSession(qs, { label: `${r.label} · retry wrong`, day: 0, exam: false }); break; }
      case 'qz-new': z.screen = 'setup'; z.result = null; rerender(); break;
      default: return false;
    }
    return true;
  }
  function handleChange(el) {
    if (el.dataset.action !== 'qz-cfg') return false;
    const c = ui.qz.cfg, f = el.dataset.field;
    c[f] = f === 'exam' ? el.checked : el.value;
    if (f === 'scope') c.topic = '';
    rerender(); return true;
  }
  function handleInput(el) { if (el.dataset.action === 'rv-search') { ui.rv.query = el.value; rerender(); return true; } return false; }
  function onKey(e) {
    const s = ui.qz.session; if (!s || A.app.view !== 'quiz' || ui.qz.screen !== 'session') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const q = s.qs[s.idx], k = e.key.toUpperCase(), n = '1234'.indexOf(e.key);
    const opt = n >= 0 ? q.options[n] : q.options.find(o => o.id === k);
    if (opt && !s.checked[q.id]) { s.answers[q.id] = opt.id; saveSession(); rerender(); }
    else if (e.key === 'Enter') { const b = document.querySelector('[data-action="qz-check"]:not([disabled])') || document.querySelector('[data-action="qz-next"]'); if (b) b.click(); }
  }

  // Tapping Practice again after finishing a set starts a fresh builder instead of re-showing the old score.
  function enterQuiz() { if (ui.qz.screen === 'results' && !ui.qz.loading) { ui.qz.screen = 'setup'; ui.qz.result = null; } }

  root.StudyUI = { init, enterQuiz, renderToday, renderPlan, renderRevise, renderQuiz, reportPanel, handleClick, handleChange, handleInput };
})(window);
