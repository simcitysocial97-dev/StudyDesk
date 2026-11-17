const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../learn.js');
const Data = require('../data.js');
const content = path.join(__dirname, '..', 'content');
const index = JSON.parse(fs.readFileSync(path.join(content, 'index.json'), 'utf8'));
const qs = index.units.flatMap(u => JSON.parse(fs.readFileSync(path.join(content, 'questions', `unit-${String(u.number).padStart(2, '0')}.json`), 'utf8')));

// ---- content pack integrity ----
assert.equal(index.units.length, 10);
assert.equal(index.units.reduce((s, u) => s + u.topics.length, 0), 111);
assert.equal(qs.length, index.units.reduce((s, u) => s + u.questionCount, 0));
assert.ok(qs.length >= 3300, `question bank is not truncated (${qs.length})`);
assert.equal(new Set(qs.map(q => q.id)).size, qs.length, 'question IDs unique');
for (const q of qs) {
  assert.ok(q.options.length >= 2 && q.correct.length === 1 && q.options.some(o => o.id === q.correct[0]), `${q.id} has a valid key`);
  assert.ok(q.why, `${q.id} has an explanation`);
  assert.equal(L.unitOfQuestionId(q.id), q.u);
  assert.ok(q.stem, `${q.id} has a question line`);
}
// regression: the first importer dropped these
assert.ok(qs.filter(q => q.assertion).length >= 330, 'assertion-reason questions are kept');
assert.ok(qs.filter(q => q.statements.length).length >= 339, 'multi-statement questions keep their statements');
assert.ok(qs.filter(q => q.listI.length && q.listII.length).length >= 330, 'matching questions keep both lists');
assert.ok(qs.filter(q => q.type === 'multi_statement' && /following statements/i.test(q.stem)).every(q => q.statements.length || /\b1[.)]/.test(q.stem)), 'no statement question is shown without its statements');
for (const u of index.units) for (const t of u.topics) {
  const topic = JSON.parse(fs.readFileSync(path.join(content, 'topics', `${t.id}.json`), 'utf8'));
  assert.deepEqual(topic.flashcards.map(c => c.id), t.cardIds);
  for (const d of topic.diagrams) assert.ok(fs.existsSync(path.join(content, 'media', d.file)), `diagram ${d.file} exists`);
}

// ---- plan covers every topic exactly once across the 12 revise days ----
const plan = Data.createInitialState().plans['15'];
const covered = plan.flatMap(d => L.dayTopics(index, d).map(t => t.id));
assert.equal(covered.length, 111); assert.equal(new Set(covered).size, 111, 'each topic is scheduled exactly once');

// ---- question picking ----
const unit5 = qs.filter(q => q.u === 5), rng = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
let stats = {};
const a = L.pickQuestions(unit5, stats, { mode: 'new', count: 15, rng });
assert.equal(a.length, 15); assert.equal(new Set(a.map(q => q.id)).size, 15);
a.slice(0, 6).forEach((q, i) => L.recordAnswer({ qStats: stats, dayPractice: {} }, q, i < 2 ? q.correct[0] : q.options.find(o => !q.correct.includes(o.id)).id, '2026-11-17'));
const s = { qStats: stats, dayPractice: {} };
const wrong = L.pickQuestions(unit5, stats, { mode: 'wrong', count: 50, rng });
assert.equal(wrong.length, 4, 'only questions last answered wrong');
const fresh = L.pickQuestions(unit5, stats, { mode: 'new', count: 20, rng });
assert.ok(fresh.every(q => !stats[q.id]), 'unseen questions come first');
assert.equal(L.pickQuestions(unit5, stats, { mode: 'flagged', count: 5, rng }).length, 0);
stats[a[0].id].flag = true;
assert.equal(L.pickQuestions(unit5, stats, { mode: 'flagged', count: 5, rng })[0].id, a[0].id);
assert.ok(L.pickQuestions(unit5, {}, { mode: 'new', count: 10, diff: 'moderate', rng }).every(q => q.diff === 'moderate'));
assert.equal(L.pickQuestions(unit5, {}, { mode: 'new', count: 5000, rng }).length, unit5.length, 'count is capped by the pool');
// answering a wrong question correctly removes it from the wrong list
const q0 = wrong[0]; L.recordAnswer(s, q0, q0.correct[0], '2026-11-18');
assert.equal(L.pickQuestions(unit5, stats, { mode: 'wrong', count: 50, rng }).length, 3);
assert.equal(stats[q0.id].n, 2); assert.equal(stats[q0.id].c, 1);
// a flag-only entry is not an attempt
const o = L.overallStats({ qStats: { x: { n: 0, c: 0, flag: true, u: 1 } } }, index); assert.equal(o.attempts, 0); assert.equal(o.distinct, 0);

// ---- stats ----
const st = L.overallStats(s, index);
assert.equal(st.distinct, 6); assert.equal(st.attempts, 7); assert.equal(st.stillWrong, 3);
assert.equal(L.unitStats(s, index)[5].distinct, 6);
const weak = L.weakTopics({ qStats: { a: { n: 4, c: 1, u: 2, tp: 'Hard' }, b: { n: 4, c: 4, u: 2, tp: 'Easy' }, c: { n: 1, c: 0, u: 3, tp: 'Tiny' } } }, 4, 5);
assert.deepEqual(weak.map(w => w.topic), ['Hard', 'Easy'], 'topics under the attempt threshold are ignored');

// ---- flashcards ----
const fs0 = { cardReviews: {} };
assert.ok(L.cardIsDue(fs0, 'c1', '2026-11-17'));
L.reviewCard(fs0, 'c1', 'good', '2026-11-17'); assert.equal(fs0.cardReviews.c1.due, '2026-11-18');
L.reviewCard(fs0, 'c1', 'good', '2026-11-18'); assert.equal(fs0.cardReviews.c1.due, '2026-11-20');
L.reviewCard(fs0, 'c1', 'easy', '2026-11-20'); assert.equal(fs0.cardReviews.c1.box, 4); assert.equal(fs0.cardReviews.c1.due, '2026-11-27');
L.reviewCard(fs0, 'c1', 'again', '2026-11-27'); assert.equal(fs0.cardReviews.c1.box, 0); assert.equal(fs0.cardReviews.c1.lapses, 1);
assert.ok(L.cardIsDue(fs0, 'c1', '2026-11-27'), 'a missed card is due again the same day');
assert.ok(!L.cardIsDue({ cardReviews: { c2: { due: '2026-12-01' } } }, 'c2', '2026-11-17'));
const total = L.cardsForUnits(index, index.units.map(u => u.number)).length; assert.equal(total, 279);

// ---- day progress is derived from real activity ----
const ps = { topicRevised: {}, dayPractice: {}, cardReviews: {}, qStats: {} }, d1 = plan[0];
let p = L.dayProgress(ps, index, d1);
assert.equal(p.topicsTotal, 8); assert.equal(p.topicsDone, 0); assert.equal(p.complete, false); assert.equal(p.practiceTarget, 40);
p.topics.forEach(t => { ps.topicRevised[t.id] = '2026-11-17'; });
L.recordDayPractice(ps, 1, true); for (let i = 0; i < 39; i++) L.recordDayPractice(ps, 1, i % 2 === 0);
p = L.dayProgress(ps, index, d1);
assert.equal(p.topicsDone, 8); assert.equal(p.practiceDone, 40); assert.equal(p.complete, true);
assert.equal(L.dayProgress(ps, index, plan[1]).complete, false, 'other days are unaffected');
assert.deepEqual(L.dayPracticeUnits(index, plan[0]), [2]); assert.equal(L.dayPracticeUnits(index, plan[12]).length, 10);
assert.equal(L.dayPracticeMode(plan[12]), 'wrong'); assert.equal(L.dayPracticeMode(plan[13]), 'any'); assert.equal(L.dayPracticeMode(plan[0]), 'new');

console.log(`PASS learn: ${qs.length} questions, 111 topics, 279 cards, plan coverage, picking, scoring, flashcard scheduling, day progress.`);
