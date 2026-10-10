const assert = require('node:assert/strict');
const Data = require('../data.js');
const Core = require('../core.js');

const state = Data.createInitialState();
const p1 = Data.PAPER1_UNITS;
const p2 = Data.PSY_UNITS;

// 1–3: official navigator coverage, priority order, and both plan sizes.
assert.equal(p1.length, 10);
assert.equal(p2.length, 10);
assert.deepEqual(p1.map(u => u.title), [
  'Teaching Aptitude','Research Aptitude','Comprehension','Communication',
  'Mathematical Reasoning and Aptitude','Logical Reasoning','Data Interpretation',
  'Information and Communication Technology (ICT)','People, Development and Environment','Higher Education System'
]);
assert.deepEqual(p2.map(u => u.title), [
  'Emergence of Psychology','Research Methodology and Statistics','Psychological Testing',
  'Biological Basis of Behavior','Attention, Perception, Learning, Memory and Forgetting',
  'Thinking, Intelligence and Creativity','Personality, Motivation, Emotion, Stress and Coping',
  'Social Psychology','Human Development and Interventions','Emerging Areas'
]);
assert.equal(state.plans['60'].length, 60);
assert.equal(state.plans['15'].length, 15);
assert.match(state.plans['60'][0].title, /Research foundations/);
assert.match(state.plans['60'][48].title, /Western foundations/);
assert.match(state.plans['60'][49].title, /Indian traditions/);
assert.equal(new Set(state.concepts.map(c => c.id)).size, state.concepts.length, 'all concept IDs are unique');
assert.ok(state.plans['60'].every(d => Array.isArray(d.conceptIds) && Array.isArray(d.tasks)));
assert.ok(state.plans['15'].every(d => Array.isArray(d.conceptIds) && Array.isArray(d.tasks)));
for (const unit of p1) assert.ok(state.concepts.some(c => c.unitId === unit.id), `Paper 1 unit ${unit.title} has concepts`);
for (const unit of p2) assert.ok(state.concepts.some(c => c.unitId === unit.id), `Psychology unit ${unit.title} has concepts`);
for (let n=1; n<=50; n++) assert.ok(state.plans['60'][n-1].conceptIds.some(id => Core.getConcept(state,id)?.paper === 'Paper 2'), `Paper 2 learning day ${n} is populated`);
for (let n=1; n<=38; n++) assert.ok(state.plans['60'][n-1].conceptIds.some(id => Core.getConcept(state,id)?.paper === 'Paper 1'), `Paper 1 coverage day ${n} is populated`);
assert.ok(state.concepts.filter(c=>c.paper==='Paper 2').every(c=>c.plannedDay>=1&&c.plannedDay<=50));
assert.ok(state.concepts.filter(c=>c.paper==='Paper 1').every(c=>c.plannedDay>=1&&c.plannedDay<=38));
for (const unit of p1) assert.ok(state.plans['15'].some(d=>d.conceptIds.some(id=>Core.getConcept(state,id)?.unitId===unit.id)), `Emergency plan includes Paper 1 unit ${unit.title}`);
for (let n=1; n<=60; n++) assert.ok(state.plans['60'][n-1].tasks.some(t=>t.paper==='Paper 1'), `Paper 1 cumulative practice occurs on day ${n}`);
assert.ok(state.plans['60'].slice(50,58).every(d=>d.tasks.some(t=>['pyq','revision'].includes(t.taskType))));
assert.ok(state.plans['60'][58].tasks.some(t=>t.taskType==='mock'));
assert.ok(state.plans['60'][59].tasks.some(t=>t.taskType==='consolidation'));

// 4–7: child-level progress and weighted completion.
const first = state.concepts.find(c => c.paper === 'Paper 2' && c.unitId === 'p2-u02');
const before = Core.completion(state, 'Paper 2');
Core.setConceptStatus(state, first.id, 'completed', new Date('2026-01-01T12:00:00Z'));
const after = Core.completion(state, 'Paper 2');
assert.equal(after.completed, before.completed + 1);
assert.equal(Core.completionByUnit(state)['p2-u02'].completed, 1);
assert.ok(Core.completionByUnit(state)['p2-u02'].completed < Core.completionByUnit(state)['p2-u02'].total, 'one child cannot complete its parent unit');
assert.equal(Core.overallCompletion(state).completed, 1);
assert.equal(state.revisions.filter(r => r.conceptId === first.id).length, 4, 'completion creates four spaced revisions when exam date permits');
const revisionCount = state.revisions.length;
Core.setConceptStatus(state, first.id, 'in_progress', new Date('2026-01-02T12:00:00Z'));
Core.setConceptStatus(state, first.id, 'completed', new Date('2026-01-02T12:00:00Z'));
assert.equal(state.revisions.length, revisionCount, 're-completion does not duplicate the revision set');

// 8–10: plan switching keeps each plan and calendar dates recalculate; overrides win.
const plan60Count = state.plans['60'].length;
const plan15Count = state.plans['15'].length;
state.settings.activePlan = '15';
assert.equal(state.plans['60'].length, plan60Count);
assert.equal(state.plans['15'].length, plan15Count);
state.settings.startDate = '2026-10-10';
assert.equal(Core.planDate(state,'60',1), '2026-10-10');
assert.equal(Core.planDate(state,'60',60), '2026-12-08');
state.plans['60'][0].dateOverride='2026-10-12';
assert.equal(Core.planDate(state,'60',1), '2026-10-12');
state.plans['60'][0].dateOverride='';
assert.equal(Core.planDate(state,'60',1), '2026-10-10');

// 11–13: due/overdue revisions, sufficient-data accuracy, and backup validation.
state.settings.examDate='2026-01-12';
const revisionConcept=state.concepts.find(c=>c.id!==first.id&&c.mandatory!==false);
revisionConcept.status='not_started';
Core.setConceptStatus(state,revisionConcept.id,'completed',new Date('2026-01-01T12:00:00Z'));
assert.ok(state.revisions.filter(r=>r.conceptId===revisionConcept.id).every(r=>r.dueDate<'2026-01-12'), 'no revision scheduled on/after exam date');
const rev=state.revisions.find(r=>r.conceptId===first.id&&r.status==='scheduled');
assert.ok(rev);
Core.completeRevision(state,rev.id,{confidenceAfter:3,notes:'Test note',stillUnclear:true,now:new Date('2026-01-02T12:00:00Z')});
assert.ok(state.revisions.some(r=>r.conceptId===first.id&&r.kind==='retry'&&r.status==='scheduled'));
for(let i=0;i<5;i++)state.pyqs.push({id:`q${i}`,paper:'Paper 2',unitId:'p2-u02',topic:'Methods',result:i<3?'correct':'incorrect'});
assert.equal(Core.pyqStats(state).find(x=>x.topic==='Methods').meaningful,true);
const backup=JSON.parse(JSON.stringify(state));
assert.equal(Core.validateBackup(backup).ok,true);
assert.equal(Core.validateBackup({schemaVersion:1}).ok,false);
assert.equal(Core.hydrateImported(backup).plans['60'].length,60);
const legacy = JSON.parse(JSON.stringify(backup)); legacy.schemaVersion=1; delete legacy.plans['60'][0].targetCustomized;
assert.equal(Core.hydrateImported(legacy).schemaVersion,2, 'schema v1 imports migrate to v2');
assert.equal(Core.hydrateImported(legacy).plans['60'][0].targetCustomized,false);

// 14–16: plan task persistence model, mock calculations, study-minute rollups.
const moved=state.plans['60'][50].tasks[0];
assert.ok(moved && ['pyq','revision'].includes(moved.taskType));
assert.equal(Core.markMockScore({paper1Score:'',paper2Score:'',correct:40,incorrect:10},{marksPerCorrect:2,negativeMarks:0}),80);
assert.equal(Core.mockAccuracy({correct:40,incorrect:10}),80);
state.sessions.push({id:'s1',date:'2026-10-10',planId:'60',day:1,durationMinutes:35});
assert.equal(Core.minutesForDay(state,'60',1),35);
assert.equal(Core.dailyMinutes(state,'2026-10-10'),35);

console.log(`PASS: ${state.concepts.length} unique concept records; 10+10 units; 60/15-day plans; progress, revisions, date overrides, PYQ accuracy, backup validation and timer rollups.`);
