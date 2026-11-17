const assert = require('node:assert/strict');
const Data = require('../data.js');
const Core = require('../core.js');
globalThis.StudyData = Data;

const state = Data.createInitialState();

// 1. Syllabus navigators and the single 15-day plan.
assert.equal(Data.PAPER1_UNITS.length, 10);
assert.equal(Data.PSY_UNITS.length, 10);
assert.deepEqual(Object.keys(state.plans), ['15'], 'the 60-day plan no longer exists');
assert.equal(state.plans['15'].length, 15);
assert.equal(state.schemaVersion, 3);
assert.equal(new Set(state.concepts.map(c => c.id)).size, state.concepts.length, 'concept IDs unique');
assert.ok(state.plans['15'].every(d => Array.isArray(d.conceptIds) && Array.isArray(d.tasks) && Array.isArray(d.parts)));
assert.ok(state.plans['15'].slice(0, 12).every(d => d.kind === 'revise' && d.parts.length && d.practiceScope === 'units'));
assert.ok(state.plans['15'].slice(12).every(d => d.kind === 'practice' && d.parts.length === 0));
assert.equal(state.plans['15'][13].timed, true, 'day 14 is the timed mock-style set');
assert.ok(state.concepts.filter(c => c.paper === 'Paper 2').every(c => c.plannedDay >= 1 && c.plannedDay <= 12), 'Paper 2 checklist concepts map to a revise day');
assert.ok(state.concepts.filter(c => c.paper === 'Paper 1').every(c => c.plannedDay === null), 'Paper 1 is not scheduled in the Paper 2 revision plan');
for (const k of ['cardReviews', 'qStats', 'topicRevised', 'dayPractice']) assert.deepEqual(state[k], {}, k);
assert.deepEqual(state.quizHistory, []); assert.equal(state.activeQuiz, null);
assert.equal(state.timer.planId, '15');

// 2. Child-level progress and weighted completion.
const first = state.concepts.find(c => c.paper === 'Paper 2' && c.unitId === 'p2-u02');
const before = Core.completion(state, 'Paper 2');
Core.setConceptStatus(state, first.id, 'completed', new Date('2026-01-01T12:00:00Z'));
assert.equal(Core.completion(state, 'Paper 2').completed, before.completed + 1);
assert.ok(Core.completionByUnit(state)['p2-u02'].completed < Core.completionByUnit(state)['p2-u02'].total);
assert.equal(state.revisions.filter(r => r.conceptId === first.id).length, 4);
const n = state.revisions.length;
Core.setConceptStatus(state, first.id, 'in_progress', new Date('2026-01-02T12:00:00Z'));
Core.setConceptStatus(state, first.id, 'completed', new Date('2026-01-02T12:00:00Z'));
assert.equal(state.revisions.length, n, 're-completion does not duplicate revisions');

// 3. Dates, overrides, current day.
state.settings.startDate = '2026-10-10';
assert.equal(Core.planDate(state, '15', 1), '2026-10-10');
assert.equal(Core.planDate(state, '15', 15), '2026-10-24');
state.plans['15'][0].dateOverride = '2026-10-12';
assert.equal(Core.planDate(state, '15', 1), '2026-10-12');
state.plans['15'][0].dateOverride = '';
assert.equal(Core.currentDayNumber(state, '15', new Date('2026-10-12T10:00:00')), 3);
assert.equal(Core.currentDayNumber(state, '15', new Date('2027-03-01T10:00:00')), 15, 'clamped to day 15');
assert.equal(Core.currentDayNumber(state, '15', new Date('2026-09-01T10:00:00')), 1, 'clamped to day 1 before the start date');

// 4. Revisions, PYQ accuracy, backups.
state.settings.examDate = '2026-01-12';
const other = state.concepts.find(c => c.id !== first.id && c.mandatory !== false); other.status = 'not_started';
Core.setConceptStatus(state, other.id, 'completed', new Date('2026-01-01T12:00:00Z'));
assert.ok(state.revisions.filter(r => r.conceptId === other.id).every(r => r.dueDate < '2026-01-12'));
for (let i = 0; i < 5; i++) state.pyqs.push({ id: `q${i}`, paper: 'Paper 2', unitId: 'p2-u02', topic: 'Methods', result: i < 3 ? 'correct' : 'incorrect' });
assert.equal(Core.pyqStats(state).find(x => x.topic === 'Methods').meaningful, true);
const backup = JSON.parse(JSON.stringify(state));
assert.equal(Core.validateBackup(backup).ok, true);
assert.equal(Core.validateBackup({ schemaVersion: 1 }).ok, false);
const bad = JSON.parse(JSON.stringify(backup)); bad.plans['15'].pop();
assert.equal(Core.validateBackup(bad).ok, false, 'a 14-day plan is rejected');

// 5. Migration of data saved by the previous (60 + 15 day) version.
const legacy = JSON.parse(JSON.stringify(Data.createInitialState()));
legacy.schemaVersion = 2; legacy.settings.activePlan = '60';
legacy.settings.paper1TargetMinutes = 50; legacy.settings.paper2TargetMinutes = 160;
legacy.plans['60'] = Array.from({ length: 60 }, (_, i) => ({ day: i + 1, title: 'old', conceptIds: [], tasks: [] }));
const old15 = Data.createInitialState().plans['15'];
legacy.plans['15'] = old15.map(d => ({ day: d.day, title: 'Old 15', conceptIds: [], tasks: [{ id: `task-15-${d.day}-paper-2-p2-u02-revise-x`, title: 'Revise old', done: true }, ...(d.day === 2 ? [{ id: 'custom-1', title: 'My own task', done: false }] : [])], status: d.day === 1 ? 'completed' : 'planned', notes: d.day === 1 ? 'kept note' : '', dateOverride: d.day === 3 ? '2026-11-20' : '', targetCustomized: d.day === 4, targetMinutes: d.day === 4 ? 120 : 210 }));
legacy.sessions = [{ id: 's', date: '2026-10-10', planId: '60', day: 20, durationMinutes: 30 }];
legacy.timer.planId = '60'; legacy.timer.day = 33;
assert.equal(Core.validateBackup(legacy).ok, true, 'legacy backups still import');
const mig = Core.hydrateImported(legacy);
assert.equal(mig.schemaVersion, 3);
assert.deepEqual(Object.keys(mig.plans), ['15']);
assert.equal(mig.settings.activePlan, '15');
assert.equal(mig.plans['15'][0].status, 'completed'); assert.equal(mig.plans['15'][0].notes, 'kept note');
assert.equal(mig.plans['15'][2].dateOverride, '2026-11-20');
assert.equal(mig.plans['15'][3].targetMinutes, 120);
assert.ok(mig.plans['15'][1].tasks.some(t => t.id === 'custom-1'), 'custom tasks survive');
assert.ok(!mig.plans['15'][1].tasks.some(t => /^task-15-/.test(t.id)), 'old auto-generated tasks are replaced by derived progress');
assert.ok(mig.plans['15'].every(d => d.parts && d.practiceTarget));
assert.equal(mig.timer.planId, '15'); assert.equal(mig.timer.day, 15);
assert.equal(mig.sessions[0].planId, '15'); assert.equal(mig.sessions[0].day, 15);
assert.equal(mig.settings.paper1TargetMinutes, 0); assert.equal(mig.settings.paper2TargetMinutes, 210);
for (const k of ['cardReviews', 'qStats', 'topicRevised', 'dayPractice']) assert.deepEqual(mig[k], {});
assert.equal(Core.hydrateImported(JSON.parse(JSON.stringify(backup))).schemaVersion, 3, 'a current backup round-trips');
const v1 = JSON.parse(JSON.stringify(legacy)); v1.schemaVersion = 1; delete v1.plans['15'][0].targetCustomized;
assert.equal(Core.hydrateImported(v1).schemaVersion, 3, 'schema v1 migrates through v2 to v3');

// 6. Mock calculations and study-minute rollups.
assert.equal(Core.markMockScore({ paper1Score: '', paper2Score: '', correct: 40, incorrect: 10 }, { marksPerCorrect: 2, negativeMarks: 0 }), 80);
assert.equal(Core.mockAccuracy({ correct: 40, incorrect: 10 }), 80);
state.sessions.push({ id: 's1', date: '2026-10-10', planId: '15', day: 1, durationMinutes: 35 });
assert.equal(Core.minutesForDay(state, '15', 1), 35);
assert.equal(Core.dailyMinutes(state, '2026-10-10'), 35);

console.log('PASS core: single 15-day plan, progress, dates, revisions, backups, v1/v2 -> v3 migration, timers.');
