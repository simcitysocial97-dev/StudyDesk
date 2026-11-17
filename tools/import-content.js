/* Build the static content pack (revision notes + practice questions) used by StudyDesk.
 *
 * Usage:  node tools/import-content.js [psychologyDir] [questionBankDir]
 * Defaults to ../psychology and ../question-bank (siblings of the StudyDesk folder),
 * i.e. the two folders inside Desktop.zip extracted next to this project.
 *
 * Differences from the first importer (which silently lost data):
 *  - assertion-reason / matching questions that have no "stem" field are KEPT (273 questions);
 *  - question_data.statements (multi-statement questions) are KEPT; without them 339 questions are unanswerable;
 *  - topic notes keep learning objectives, exam traps, common confusions, revision summary and full sections.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const psychologyRoot = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'psychology'));
const bankRoot = path.resolve(process.argv[3] || path.join(__dirname, '..', '..', 'question-bank'));
const outRoot = path.join(__dirname, '..', 'content');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const str = v => (v == null ? '' : String(v).trim());
const strList = v => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

function findAsset(unitFolder, rel) {
  if (!rel) return '';
  const name = path.basename(rel);
  return [path.join(unitFolder, rel), path.join(unitFolder, 'visuals', name), path.join(unitFolder, 'media', name)].find(f => fs.existsSync(f)) || '';
}

function slimNotes(sections) {
  const out = [], seen = new Set();
  for (const s of sections || []) {
    let item = null;
    switch (s.kind) {
      case 'heading': item = { k: 'h', t: str(s.text), l: Number(s.level) || 2 }; break;
      case 'paragraph': item = { k: 'p', t: str(s.text) }; break;
      case 'bullet_list': item = { k: 'b', i: strList(s.items) }; break;
      case 'definition': item = { k: 'd', term: str(s.term), t: str(s.text) }; break;
      case 'table': item = { k: 't', c: str(s.caption), h: strList(s.headers), r: (s.rows || []).map(strList) }; break;
      case 'examination_connection': item = { k: 'x', t: str(s.text) }; break;
      case 'mnemonic': item = { k: 'x', t: str(s.text || s.title) }; break;
    }
    if (!item) continue;
    if ((item.k === 'p' || item.k === 'x' || item.k === 'd') && !(item.t || item.term)) continue;
    if (item.k === 'b' && !item.i.length) continue;
    if (item.k === 'h' && !item.t) continue;
    // The source notes repeat some paragraphs verbatim; keep the first copy only.
    if (item.k !== 'h') { const key = JSON.stringify(item); if (seen.has(key)) continue; seen.add(key); }
    out.push(item);
  }
  // Drop headings left with no content beneath them.
  return out.filter((n, i) => n.k !== 'h' || (out[i + 1] && out[i + 1].k !== 'h'));
}

function slimTopic(topic, unitFolder, mediaDir) {
  const diagrams = [], used = new Set();
  const candidates = [
    ...(topic.visuals || []).map(v => ({ rel: v.svg || v.file, caption: v.caption || v.title })),
    ...(topic.media || []).map(v => ({ rel: v.asset || v.svg || v.file, caption: v.caption || v.title }))
  ];
  for (const c of candidates) {
    const src = findAsset(unitFolder, c.rel);
    if (!src) continue;
    const base = path.basename(src).replace(/^\d+_/, '');
    if (used.has(base)) continue;
    used.add(base);
    const dest = `${topic.topic_id}__${path.basename(src)}`;
    fs.copyFileSync(src, path.join(mediaDir, dest));
    diagrams.push({ file: dest, caption: str(c.caption) });
  }
  return {
    id: topic.topic_id, unitId: topic.unit_id, title: str(topic.name), summary: str(topic.description),
    minutes: Number(topic.estimated_minutes) || 0,
    objectives: strList(topic.learning_objectives), keyTerms: strList(topic.key_terms),
    revision: str(topic.revision_summary), traps: strList(topic.exam_traps), confusions: strList(topic.common_confusions),
    notes: slimNotes(topic.sections),
    mnemonics: (topic.mnemonics || []).filter(m => m && (m.text || m.title)).map(m => ({ title: str(m.title), text: str(m.text) })),
    flashcards: (topic.flashcards || []).filter(c => c && c.id && c.question && c.answer).map(c => ({ id: str(c.id), q: str(c.question), a: str(c.answer), h: str(c.hint) })),
    diagrams
  };
}

function normalizeQuestion(raw, unitNumber) {
  const q = raw.question || {}, data = raw.question_data || {};
  const options = (raw.options || []).filter(o => o && o.id && str(o.text)).map(o => ({ id: str(o.id), text: str(o.text) }));
  const correct = strList(raw.correct_answer);
  if (!raw.id || options.length < 2 || !correct.length || !correct.every(c => options.some(o => o.id === c))) return null;
  const type = str(raw.question_type) || 'conceptual';
  const assertion = str(q.assertion), reason = str(q.reason);
  let stem = str(q.stem);
  let statements = strList(data.statements);
  const listI = strList(data.list_i), listII = strList(data.list_ii);
  if (!stem) {
    // Some records carry only their payload; give them a neutral instruction line. Records with nothing to answer are dropped.
    if (assertion || reason) stem = 'Read Assertion (A) and Reason (R), then choose the correct option.';
    else if (statements.length) stem = 'Consider the following statements and choose the correct option.';
    else if (listI.length && listII.length) stem = 'Match List I with List II and choose the correct code.';
    else return null;
  }
  // A handful of stems already embed their numbered statements.
  if (statements.length && statements.every(s => stem.includes(s.replace(/^\s*\d+[.)]\s*/, '').slice(0, 24)))) statements = [];
  return {
    id: str(raw.id), u: unitNumber, topic: str(raw.topic), sub: str(raw.subtopic), type, diff: str(raw.difficulty),
    stem, assertion, reason, statements,
    listI, listII,
    options, correct, why: str(raw.explanation), optWhy: raw.option_explanations || {}, key: str(raw.key_concept),
    secs: Number(raw.estimated_time_seconds) || 0
  };
}

function readBank(unitNumber) {
  const file = path.join(bankRoot, `unit-${String(unitNumber).padStart(2, '0')}`, 'MASTER_QUESTION_BANK.jsonl');
  const out = [], seen = new Set();
  let skipped = 0;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = normalizeQuestion(JSON.parse(line), unitNumber);
    if (!item || seen.has(item.id)) { skipped++; continue; }
    seen.add(item.id); out.push(item);
  }
  return { questions: out, skipped };
}

const count = (list, key) => list.reduce((m, x) => (m[x[key]] = (m[x[key]] || 0) + 1, m), {});

fs.rmSync(outRoot, { recursive: true, force: true });
for (const d of ['topics', 'questions', 'media']) fs.mkdirSync(path.join(outRoot, d), { recursive: true });

const course = readJson(path.join(psychologyRoot, 'course.json'));
const units = [];
let totalSkipped = 0;
for (const unit of course.units) {
  const number = Number(String(unit.unit_id).replace(/\D/g, ''));
  const folder = path.join(psychologyRoot, unit.unit_id);
  const topics = unit.topics.map(id => {
    const slim = slimTopic(readJson(path.join(folder, 'topics', `${id}.json`)), folder, path.join(outRoot, 'media'));
    fs.writeFileSync(path.join(outRoot, 'topics', `${slim.id}.json`), JSON.stringify(slim));
    return { id: slim.id, title: slim.title, minutes: slim.minutes, cards: slim.flashcards.length, cardIds: slim.flashcards.map(c => c.id), notes: slim.notes.length };
  });
  const { questions, skipped } = readBank(number);
  totalSkipped += skipped;
  fs.writeFileSync(path.join(outRoot, 'questions', `unit-${String(number).padStart(2, '0')}.json`), JSON.stringify(questions));
  const topicCounts = count(questions, 'topic');
  units.push({
    id: unit.unit_id, number, title: str(unit.name), topics,
    questionCount: questions.length, cardCount: topics.reduce((s, t) => s + t.cards, 0),
    qTopics: Object.entries(topicCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => ({ name, n })),
    qTypes: count(questions, 'type'), qDiff: count(questions, 'diff')
  });
}
fs.writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), units }));
const sum = f => units.reduce((s, u) => s + f(u), 0);
console.log(`Imported ${units.length} units, ${sum(u => u.topics.length)} topics, ${sum(u => u.cardCount)} flashcards, ${sum(u => u.questionCount)} questions (${totalSkipped} skipped as invalid).`);
