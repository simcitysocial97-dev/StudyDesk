/* Pure study-tracker logic shared by the browser app and Node tests. */
(function(root){
  'use strict';
  const STATUS = ['not_started','in_progress','completed','needs_revision'];
  const REVISION_STATUS = ['scheduled','completed','skipped'];
  const CURRENT_SCHEMA_VERSION = 2;
  const TODAY = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function parseDate(iso){
    if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return null;
    const [y,m,d]=iso.split('-').map(Number); const date=new Date(y,m-1,d,12,0,0,0);
    if(date.getFullYear()!==y || date.getMonth()!==m-1 || date.getDate()!==d) return null;
    return date;
  }
  function addDays(iso,n){const d=parseDate(iso); if(!d)return ''; d.setDate(d.getDate()+Number(n||0)); return TODAY(d);}
  function daysBetween(start,end){const a=parseDate(start),b=parseDate(end); if(!a||!b)return null; return Math.round((b-a)/86400000);}
  function formatDate(iso,opts={weekday:'short',month:'short',day:'numeric'}){const d=parseDate(iso); return d?new Intl.DateTimeFormat(undefined,opts).format(d):'Date not set';}
  function planDay(state,planId,dayNum){return (state.plans?.[String(planId)]||[]).find(d=>Number(d.day)===Number(dayNum))||null;}
  function planDate(state,planId,dayNum){
    const d=planDay(state,planId,dayNum); const override=d?.dateOverride||state.dayDateOverrides?.[`${planId}-${dayNum}`];
    return parseDate(override)?override:(state.settings?.startDate?addDays(state.settings.startDate,Number(dayNum)-1):'');
  }
  function currentDayNumber(state,planId,now=new Date()){
    const list=state.plans?.[String(planId)]||[]; if(!list.length)return 1;
    const today=TODAY(now); const start=state.settings?.startDate;
    if(!parseDate(start)) return 1;
    const diff=daysBetween(start,today); return Math.max(1,Math.min(list.length,(diff??0)+1));
  }
  function dayForDate(state,planId,date){
    const days=state.plans?.[String(planId)]||[];
    return days.find(d=>planDate(state,planId,d.day)===date)||null;
  }
  function getConcept(state,id){return (state.concepts||[]).find(c=>c.id===id)||null;}
  function getAllUnitDefs(data){return [...(data?.PAPER1_UNITS||[]),...(data?.PSY_UNITS||[])];}
  function mandatoryConcepts(state,paper){return (state.concepts||[]).filter(c=>c.mandatory!==false&&(!paper||c.paper===paper));}
  function completion(state,paper){
    const items=mandatoryConcepts(state,paper); const total=items.length;
    const completed=items.filter(c=>c.status==='completed').length;
    const inProgress=items.filter(c=>c.status==='in_progress').length;
    const needsRevision=items.filter(c=>c.status==='needs_revision').length;
    return {completed,total,inProgress,needsRevision,remaining:Math.max(0,total-completed),percent:total?Math.round(completed*100/total):0};
  }
  function completionByUnit(state){
    const result={};
    mandatoryConcepts(state).forEach(c=>{
      if(!result[c.unitId]) result[c.unitId]={unitId:c.unitId,unitTitle:c.unitTitle,paper:c.paper,total:0,completed:0,inProgress:0,needsRevision:0};
      const u=result[c.unitId]; u.total++; if(c.status==='completed')u.completed++; if(c.status==='in_progress')u.inProgress++; if(c.status==='needs_revision')u.needsRevision++;
    });
    Object.values(result).forEach(u=>u.percent=u.total?Math.round(u.completed*100/u.total):0);
    return result;
  }
  function overallCompletion(state){
    const p1=completion(state,'Paper 1'),p2=completion(state,'Paper 2');
    const total=p1.total+p2.total,completed=p1.completed+p2.completed;
    return {p1,p2,total,completed,remaining:Math.max(0,total-completed),percent:total?Math.round(completed*100/total):0};
  }
  function dayProgress(state,planId,dayNum){
    const d=planDay(state,planId,dayNum); if(!d)return {conceptTotal:0,conceptCompleted:0,conceptRemaining:0,taskTotal:0,taskCompleted:0};
    const links=d.conceptIds||[]; const concepts=links.map(id=>getConcept(state,id)).filter(Boolean);
    const done=concepts.filter(c=>c.status==='completed').length;
    const tasks=d.tasks||[];
    return {conceptTotal:concepts.length,conceptCompleted:done,conceptRemaining:Math.max(0,concepts.length-done),taskTotal:tasks.length,taskCompleted:tasks.filter(t=>t.done).length};
  }
  function planSummary(state,planId){
    const days=state.plans?.[String(planId)]||[];
    const explicitlyCompleted=days.filter(d=>d.status==='completed').length;
    const planned=days.length;
    return {completed:explicitlyCompleted,planned,percent:planned?Math.round(explicitlyCompleted*100/planned):0};
  }
  function scheduledConceptsForDay(state,planId,dayNum){
    const d=planDay(state,planId,dayNum); return (d?.conceptIds||[]).map(id=>getConcept(state,id)).filter(Boolean);
  }
  function taskIsOverdue(state,planId,day){
    const date=planDate(state,planId,day.day); if(!date||date>=TODAY()||day.isRest||day.status==='completed')return false;
    const pendingConcept=(day.conceptIds||[]).some(id=>getConcept(state,id)?.status!=='completed');
    const pendingTask=(day.tasks||[]).some(t=>!t.done);
    return pendingConcept||pendingTask;
  }
  function getOverduePlanItems(state,planId,today=TODAY()){
    const out=[]; (state.plans?.[String(planId)]||[]).forEach(day=>{
      const date=planDate(state,planId,day.day); if(!date||date>=today||day.isRest||day.status==='completed')return;
      (day.conceptIds||[]).forEach(id=>{const c=getConcept(state,id); if(c&&c.status!=='completed')out.push({kind:'concept',concept:c,day:day.day,date,planId});});
      (day.tasks||[]).forEach(t=>{if(!t.done)out.push({kind:'task',task:t,day:day.day,date,planId});});
    }); return out;
  }
  function minutesForDay(state,planId,dayNum){
    const date=planDate(state,planId,dayNum); if(!date)return 0;
    return (state.sessions||[]).filter(s=>s.planId===String(planId)&&Number(s.day)===Number(dayNum)).reduce((sum,s)=>sum+Number(s.durationMinutes||0),0);
  }
  function totalStudyMinutes(state){return (state.sessions||[]).reduce((sum,s)=>sum+Number(s.durationMinutes||0),0);}
  function dailyMinutes(state,date){return (state.sessions||[]).filter(s=>s.date===date).reduce((sum,s)=>sum+Number(s.durationMinutes||0),0);}
  function streakDays(state,now=new Date()){
    const set=new Set((state.sessions||[]).filter(s=>Number(s.durationMinutes||0)>0).map(s=>s.date));
    let check=TODAY(now); if(!set.has(check)) check=addDays(check,-1);
    let streak=0; while(check&&set.has(check)){streak++;check=addDays(check,-1);}
    return streak;
  }
  function createRevisionSchedule(state,concept,now=new Date()){
    if(!concept||concept.revisionScheduleCreated||state.revisions.some(r=>r.conceptId===concept.id))return [];
    const base=parseDate(concept.lastStudied)?concept.lastStudied:TODAY(now);
    const exam=state.settings?.examDate; const intervals=(state.settings?.revisionIntervals||[1,3,7,14]).map(Number).filter(x=>Number.isFinite(x)&&x>0);
    const rows=[]; intervals.forEach((interval,index)=>{
      const due=addDays(base,interval); if(!due|| (parseDate(exam)&&due>=exam))return;
      rows.push({id:`rev-${concept.id}-${index+1}`,conceptId:concept.id,step:index+1,intervalDays:interval,dueDate:due,status:'scheduled',createdAt:new Date().toISOString(),completedAt:'',confidenceBefore:concept.confidence||0,confidenceAfter:0,notes:'',kind:'spaced'});
    });
    state.revisions.push(...rows); concept.revisionScheduleCreated=true;
    concept.nextRevisionDate=rows[0]?.dueDate||'';
    return rows;
  }
  function updateNextRevisionDate(state,conceptId){
    const c=getConcept(state,conceptId); if(!c)return;
    const exam=state.settings?.examDate;const next=(state.revisions||[]).filter(r=>r.conceptId===conceptId&&r.status==='scheduled'&&(!parseDate(exam)||r.dueDate<exam)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate))[0];
    c.nextRevisionDate=next?.dueDate||'';
  }
  function setConceptStatus(state,id,status,now=new Date()){
    const c=getConcept(state,id); if(!c||!STATUS.includes(status))return false;
    const was=c.status; c.status=status;
    if(status==='completed'){
      if(was!=='completed') { c.completedAt=now.toISOString(); c.lastStudied=TODAY(now); createRevisionSchedule(state,c,now); }
    } else if(status==='in_progress'||status==='needs_revision'){
      c.lastStudied=TODAY(now);
    }
    updateNextRevisionDate(state,id);
    return true;
  }
  function dueRevisionBuckets(state,today=TODAY()){
    const due=[],overdue=[],upcoming=[];
    (state.revisions||[]).filter(r=>r.status==='scheduled'&&(!parseDate(state.settings?.examDate)||r.dueDate<state.settings.examDate)).forEach(r=>{
      const c=getConcept(state,r.conceptId); const row={...r,concept:c}; if(!c)return;
      if(r.dueDate<today)overdue.push(row); else if(r.dueDate===today)due.push(row); else upcoming.push(row);
    });
    const sort=(a,b)=>a.dueDate.localeCompare(b.dueDate); due.sort(sort);overdue.sort(sort);upcoming.sort(sort);
    return {due,overdue,upcoming,history:(state.revisions||[]).filter(r=>r.status!=='scheduled').sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''))};
  }
  function completeRevision(state,revisionId,{confidenceAfter=0,notes='',stillUnclear=false,now=new Date()}={}){
    const r=(state.revisions||[]).find(x=>x.id===revisionId); if(!r||r.status!=='scheduled')return false;
    const c=getConcept(state,r.conceptId); r.status='completed'; r.completedAt=now.toISOString(); r.confidenceAfter=Number(confidenceAfter)||0; r.notes=notes||'';
    if(c){c.lastStudied=TODAY(now); if(r.confidenceAfter)c.confidence=r.confidenceAfter;}
    if(stillUnclear&&c){
      const hasRetry=state.revisions.some(x=>x.conceptId===c.id&&x.kind==='retry'&&x.status==='scheduled');
      if(!hasRetry){const next=addDays(TODAY(now),1);state.revisions.push({id:`retry-${c.id}-${now.getTime()}`,conceptId:c.id,step:null,intervalDays:1,dueDate:next,status:'scheduled',createdAt:now.toISOString(),completedAt:'',confidenceBefore:r.confidenceAfter||c.confidence||0,confidenceAfter:0,notes:'Still unclear — revisit with a different explanation/example.',kind:'retry'});}
      c.status='needs_revision';
    }
    updateNextRevisionDate(state,r.conceptId);return true;
  }
  function scheduleOneOffRevision(state,conceptId,dueDate,notes=''){
    const c=getConcept(state,conceptId); if(!c||!parseDate(dueDate))return false;
    const existing=state.revisions.find(r=>r.conceptId===conceptId&&r.status==='scheduled');
    if(existing){existing.dueDate=dueDate;existing.notes=notes||existing.notes;existing.kind='retry';updateNextRevisionDate(state,conceptId);return true;}
    state.revisions.push({id:`manual-${conceptId}-${Date.now()}`,conceptId,step:null,intervalDays:null,dueDate,status:'scheduled',createdAt:new Date().toISOString(),completedAt:'',confidenceBefore:c.confidence||0,confidenceAfter:0,notes,kind:'retry'});
    updateNextRevisionDate(state,conceptId);return true;
  }
  function quizWeakTopics(state,minQuestions=5){
    const map=new Map(); (state.concepts||[]).forEach(c=>{
      const total=Number(c.quizTotal),correct=Number(c.quizCorrect); if(!Number.isFinite(total)||!Number.isFinite(correct)||total<=0)return;
      const key=`${c.paper}|${c.unitId}|${c.topic}`; if(!map.has(key))map.set(key,{paper:c.paper,unitId:c.unitId,unitTitle:c.unitTitle,topic:c.topic,correct:0,total:0});
      const x=map.get(key);x.correct+=Math.min(correct,total);x.total+=total;
    });
    return [...map.values()].filter(x=>x.total>=minQuestions).map(x=>({...x,accuracy:x.total?x.correct/x.total:0})).sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total);
  }
  function pyqStats(state,{minAnswered=5}={}){
    const map=new Map(); (state.pyqs||[]).forEach(q=>{
      if(q.result==='unattempted')return;
      const key=`${q.paper}|${q.unitId||''}|${q.topic||''}`;if(!map.has(key))map.set(key,{paper:q.paper,unitId:q.unitId||'',topic:q.topic||'',answered:0,correct:0,incorrect:0});
      const x=map.get(key);x.answered++;if(q.result==='correct')x.correct++;if(q.result==='incorrect')x.incorrect++;
    });
    return [...map.values()].map(x=>({...x,accuracy:x.answered?x.correct/x.answered:null,meaningful:x.answered>=minAnswered})).sort((a,b)=>a.paper.localeCompare(b.paper)||a.unitId.localeCompare(b.unitId)||a.topic.localeCompare(b.topic));
  }
  function markMockScore(test,settings){
    const p1=Number(test.paper1Score),p2=Number(test.paper2Score);
    const hasPaperScores=String(test.paper1Score??'')!==''||String(test.paper2Score??'')!=='';
    if(hasPaperScores)return (Number.isFinite(p1)?p1:0)+(Number.isFinite(p2)?p2:0);
    const correct=Number(test.correct)||0,incorrect=Number(test.incorrect)||0;
    return correct*(Number(settings?.marksPerCorrect)||0)-incorrect*(Number(settings?.negativeMarks)||0);
  }
  function mockAccuracy(test){const a=Number(test.correct)||0,b=Number(test.incorrect)||0;return a+b?(a/(a+b))*100:null;}
  function moveConceptInPlan(state,planId,conceptId,fromDay,toDay){
    const days=state.plans?.[String(planId)]||[]; const from=planDay(state,planId,fromDay),to=planDay(state,planId,toDay); if(!from||!to||Number(fromDay)===Number(toDay)||!from.conceptIds.includes(conceptId))return false;
    from.conceptIds.splice(from.conceptIds.indexOf(conceptId),1);to.conceptIds.push(conceptId);return true;
  }
  function movePlanTask(state,planId,taskId,fromDay,toDay){
    const from=planDay(state,planId,fromDay),to=planDay(state,planId,toDay);if(!from||!to||Number(fromDay)===Number(toDay))return false;
    const i=from.tasks.findIndex(t=>t.id===taskId); if(i<0)return false; const [task]=from.tasks.splice(i,1); to.tasks.push(task);return true;
  }
  function validateBackup(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,error:'Backup must be a JSON object.'};
    const version=Number(value.schemaVersion); if(!Number.isInteger(version)||version<1||version>CURRENT_SCHEMA_VERSION)return {ok:false,error:'Unsupported backup schema version.'};
    if(!value.settings||typeof value.settings!=='object'||!Array.isArray(value.concepts)||!value.plans||typeof value.plans!=='object')return {ok:false,error:'Backup is missing settings, concepts, or plans.'};
    if(value.settings.activePlan!==undefined&&!['60','15'].includes(String(value.settings.activePlan)))return {ok:false,error:'Selected plan must be 60 or 15.'};
    const ids=new Set();
    for(const c of value.concepts){
      if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id))return {ok:false,error:'Concept records need unique non-empty IDs.'};
      ids.add(c.id);if(!STATUS.includes(c.status))return {ok:false,error:`Invalid progress status in concept ${c.id}.`};
      if(!['Paper 1','Paper 2'].includes(c.paper))return {ok:false,error:`Invalid paper in concept ${c.id}.`};
      if(typeof c.title!=='string'||typeof c.unitId!=='string')return {ok:false,error:`Concept ${c.id} is missing its title or unit.`};
    }
    const taskIds=new Set();
    for(const id of ['60','15']){
      if(!Array.isArray(value.plans[id]))return {ok:false,error:`Backup is missing the ${id}-day plan.`};
      const requiredLength=id==='60'?60:15;if(value.plans[id].length!==requiredLength)return {ok:false,error:`The ${id}-day plan must contain ${requiredLength} study days.`};
      for(const d of value.plans[id]){
        if(!Array.isArray(d.conceptIds)||!Array.isArray(d.tasks))return {ok:false,error:`Study day ${d.day} is malformed.`};
        if(d.conceptIds.some(conceptId=>!ids.has(conceptId)))return {ok:false,error:`Study day ${d.day} references a missing concept.`};
        for(const t of d.tasks){if(!t||typeof t.id!=='string'||!t.id||taskIds.has(t.id))return {ok:false,error:'Plan-task records need unique non-empty IDs.'};taskIds.add(t.id);if(typeof t.title!=='string')return {ok:false,error:`A plan task on day ${d.day} has no title.`};}
      }
    }
    for(const key of ['revisions','sessions','pyqs','mockTests','notes'])if(value[key]!==undefined&&!Array.isArray(value[key]))return {ok:false,error:`${key} must be a list.`};
    for(const r of value.revisions||[])if(!r||!ids.has(r.conceptId)||!REVISION_STATUS.includes(r.status))return {ok:false,error:'A revision record has an invalid concept reference or status.'};
    return {ok:true};
  }
  function migrateV1ToV2(s){
    // Schema v2 records explicit default-vs-custom day targets and provenance labels.
    s.settings ||= {};s.settings.revisionIntervals ||= [1,3,7,14];s.settings.theme ||= 'light';s.settings.activePlan ||= s.ui?.activePlan||'60';
    s.concepts ||= [];s.concepts.forEach(c=>{c.sourceType ||= 'official-or-supporting';c.quizCorrect ??= '';c.quizTotal ??= '';c.revisionScheduleCreated ||= false;c.mandatory ??= true;});
    s.plans ||= {};for(const id of ['60','15']){s.plans[id] ||= [];s.plans[id].forEach(d=>{d.targetCustomized ??= false;d.conceptIds ||= [];d.tasks ||= [];d.notes ||= '';d.status ||= 'planned';});}
    s.revisions ||= [];s.sessions ||= [];s.pyqs ||= [];s.mockTests ||= [];s.notes ||= [];s.topicNotes ||= {};s.planNotes ||= {};s.dayDateOverrides ||= {};s.timer ||= {status:'stopped',startedAt:null,elapsedMs:0,paper:'Paper 2',category:'new-learning',unitId:'',planId:'60',day:1};
    s.schemaVersion=2;return s;
  }
  const MIGRATIONS={1:migrateV1ToV2};
  function hydrateImported(value){
    const check=validateBackup(value);if(!check.ok)throw new Error(check.error);
    let cloned=JSON.parse(JSON.stringify(value));let version=Number(cloned.schemaVersion);
    while(version<CURRENT_SCHEMA_VERSION){const migrate=MIGRATIONS[version];if(!migrate)throw new Error(`No migration path from schema ${version}.`);cloned=migrate(cloned);version=Number(cloned.schemaVersion);}
    cloned.schemaVersion=CURRENT_SCHEMA_VERSION;
    cloned.revisions ||= [];cloned.sessions ||= [];cloned.pyqs ||= [];cloned.mockTests ||= [];cloned.notes ||= [];cloned.unitNotes ||= {};cloned.topicNotes ||= {};cloned.planNotes ||= {};cloned.dayDateOverrides ||= {};cloned.ui ||= {activePlan:cloned.settings.activePlan||'60'};
    cloned.settings.revisionIntervals ||= [1,3,7,14];cloned.settings.theme ||= 'light';cloned.settings.activePlan ||= '60';if(!['60','15'].includes(String(cloned.settings.activePlan)))cloned.settings.activePlan='60';
    cloned.timer ||= {status:'stopped',startedAt:null,elapsedMs:0,paper:'Paper 2',category:'new-learning',unitId:'',planId:'60',day:1};
    return cloned;
  }
  const api={STATUS,REVISION_STATUS,CURRENT_SCHEMA_VERSION,TODAY,parseDate,addDays,daysBetween,formatDate,planDay,planDate,currentDayNumber,dayForDate,getConcept,mandatoryConcepts,completion,completionByUnit,overallCompletion,dayProgress,planSummary,scheduledConceptsForDay,taskIsOverdue,getOverduePlanItems,minutesForDay,totalStudyMinutes,dailyMinutes,streakDays,createRevisionSchedule,updateNextRevisionDate,setConceptStatus,dueRevisionBuckets,completeRevision,scheduleOneOffRevision,quizWeakTopics,pyqStats,markMockScore,mockAccuracy,moveConceptInPlan,movePlanTask,validateBackup,hydrateImported};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.StudyCore=api;
})(typeof window!=='undefined'?window:globalThis);
