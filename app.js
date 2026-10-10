/* StudyDesk — local-first UGC NET JRF preparation tracker. No runtime CDN or account required. */
(function(){
  'use strict';
  const D=window.StudyData, C=window.StudyCore;
  const main=document.getElementById('main-content');
  const toastEl=document.getElementById('toast');
  const navViews=[
    {id:'dashboard',label:'Today',icon:'home'},
    {id:'plan',label:'Study calendar',icon:'calendar'},
    {id:'syllabus',label:'Syllabus',icon:'book'},
    {id:'practice',label:'Practice',icon:'target'},
    {id:'notes',label:'Notebook',icon:'note'},
    {id:'reports',label:'Reports',icon:'chart'},
    {id:'settings',label:'Settings',icon:'settings'}
  ];
  let state=null, dbBackend='IndexedDB', saveTimer=null, toastTimer=null, swRegistration=null, reloadAfterUpdate=false;
  const app={view:'dashboard',practiceTab:'pyqs',syllabusPaper:'Paper 2',syllabusFilter:'all',syllabusUnit:'all',syllabusDay:'all',syllabusQuery:'',selectedDay:null,selectedNoteId:null,noteQuery:'',editingPyqId:null,editingMockId:null};
  const $=(selector,scope=document)=>scope.querySelector(selector);
  const $$=(selector,scope=document)=>Array.from(scope.querySelectorAll(selector));
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const attr=(s)=>esc(s).replace(/`/g,'&#96;');
  const unitDefs=[...D.PAPER1_UNITS,...D.PSY_UNITS];
  const unitById=new Map(unitDefs.map(u=>[u.id,u]));
  function uid(prefix='id'){return `${prefix}-${(window.crypto&&crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`)}`;}
  function today(){return C.TODAY();}
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function icon(name){
    const paths={
      home:'<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
      book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5v16.5M8 7h8M8 11h8"/>',
      target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      note:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      chart:'<path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 2 5-7"/><path d="M19 5v4h-4"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.08-.02a1.7 1.7 0 0 0-1.72.57l-.05.07h-3.4l-.03-.08a1.7 1.7 0 0 0-1.44-1.17 1.7 1.7 0 0 0-.78.08l-.08.03-2.94-1.7.02-.08a1.7 1.7 0 0 0-.57-1.72l-.07-.05v-3.4l.08-.03a1.7 1.7 0 0 0 1.17-1.44 1.7 1.7 0 0 0-.08-.78l-.03-.08 1.7-2.94.08.02a1.7 1.7 0 0 0 1.72-.57l.05-.07h3.4l.03.08a1.7 1.7 0 0 0 1.44 1.17 1.7 1.7 0 0 0 .78-.08l.08-.03 2.94 1.7-.02.08a1.7 1.7 0 0 0 .57 1.72l.07.05v3.4l-.08.03a1.7 1.7 0 0 0-1.17 1.44"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      moon:'<path d="M20.7 14.2A8.6 8.6 0 0 1 9.8 3.3 8.7 8.7 0 1 0 20.7 14.2z"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      alert:'<path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v4m0 4h.01"/>',
      pencil:'<path d="m15 5 4 4M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20z"/>',
      download:'<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 18v3h14v-3"/>',
      plus:'<path d="M12 5v14M5 12h14"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.note}</svg>`;
  }
  function unitTitle(id){return unitById.get(id)?.title||state?.concepts.find(c=>c.unitId===id)?.unitTitle||'Mixed / not assigned';}
  function paperColor(paper){return paper==='Paper 1'?'tag easy':'tag';}
  function statusName(status){return ({not_started:'Not started',in_progress:'In progress',completed:'Completed',needs_revision:'Needs revision'})[status]||'Not started';}
  function typeName(type){return ({'new-learning':'New learning',pyq:'PYQ practice',revision:'Revision',mock:'Mock test',practice:'Practice',consolidation:'Consolidation'})[type]||'Study task';}
  function showToast(message,kind=''){
    if(!toastEl)return; toastEl.textContent=message;toastEl.className=`toast show${kind==='error'?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2700);
  }
  async function persist(message=''){
    try{dbBackend=await window.TrackDB.save(state);if(message)showToast(message);}
    catch(error){showToast(error.message||'Could not save on this device.', 'error');}
    updateHeader();
  }
  function persistSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>persist(),260);}
  function pageHeader(title,sub,actions=''){
    return `<div class="page-header"><div><div class="eyebrow">UGC NET · December 2026 · JRF preparation</div><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
  }
  function modeSwitch(){const mode=state.settings.activePlan||'60';return `<div class="mode-switch" role="group" aria-label="Preparation plan"><button type="button" class="${mode==='60'?'active':''}" data-action="select-plan" data-mode="60">60-day<span>Full first pass</span></button><button type="button" class="${mode==='15'?'active':''}" data-action="select-plan" data-mode="15">15-day<span>Emergency selective</span></button></div>`;}
  function navMarkup(items,activeView){
    return items.map(item=>`<button type="button" class="nav-item ${activeView===item.id?'active':''}" data-action="navigate" data-view="${item.id}" aria-current="${activeView===item.id?'page':'false'}">${icon(item.icon)}<span class="nav-label">${item.label}</span>${item.id==='practice'&&dueRevisionCount()?`<span class="nav-badge" aria-label="${dueRevisionCount()} revisions due">${dueRevisionCount()>9?'9+':dueRevisionCount()}</span>`:''}</button>`).join('');
  }
  function dueRevisionCount(){return state?C.dueRevisionBuckets(state).due.length+C.dueRevisionBuckets(state).overdue.length:0;}
  function updateHeader(){
    if(!state)return;
    const chip=$('#header-countdown'); if(chip){
      if(C.parseDate(state.settings.examDate)){
        const diff=C.daysBetween(today(),state.settings.examDate);let text;
        if(diff===0)text='Exam date';else if(diff<0)text='Date passed';else text=`<b>${diff}</b> days to exam`;
        chip.innerHTML=`${icon('calendar')}<span>${text}</span>`;
      }else chip.innerHTML=`${icon('calendar')}<span>Set exam date</span>`;
      chip.setAttribute('role','button');chip.tabIndex=0;chip.title='Set or edit exam date';chip.onclick=()=>navigate('settings');
    }
    const btn=$('#theme-toggle');if(btn){btn.innerHTML=icon(state.settings.theme==='dark'?'sun':'moon');btn.setAttribute('aria-label',state.settings.theme==='dark'?'Switch to light theme':'Switch to dark theme');}
    const dt=document.querySelector('meta[name="theme-color"]');if(dt)dt.content=state.settings.theme==='dark'?'#151e1c':'#f3f5ef';
  }
  function renderNav(){
    const desktop=$('#desktop-nav'),mobile=$('#mobile-nav');
    const active=app.view==='more'?'more':app.view;
    if(desktop)desktop.innerHTML=navMarkup(navViews,active);
    if(mobile){const mobileViews=[navViews[0],navViews[1],navViews[2],navViews[3],{id:'more',label:'More',icon:'settings'}];mobile.innerHTML=navMarkup(mobileViews,active);}
  }
  function render(){
    if(!state)return;
    const opened=new Set($$('details[data-open-key][open]',main).map(d=>d.dataset.openKey));
    const active=document.activeElement;const activeId=active&&active!==document.body?active.id:'';const selectionStart=active&&typeof active.selectionStart==='number'?active.selectionStart:null;const selectionEnd=active&&typeof active.selectionEnd==='number'?active.selectionEnd:null;
    document.body.dataset.theme=state.settings.theme||'light';renderNav();updateHeader();
    const views={dashboard:renderDashboard,plan:renderPlan,syllabus:renderSyllabus,practice:renderPractice,notes:renderNotes,reports:renderReports,settings:renderSettings,install:renderInstall,more:renderMore};
    main.innerHTML=(views[app.view]||renderDashboard)();
    opened.forEach(key=>{const node=$$('[data-open-key]',main).find(el=>el.dataset.openKey===key);if(node)node.open=true;});
    if(activeId){const target=document.getElementById(activeId);if(target&&main.contains(target)){target.focus({preventScroll:true});if(selectionStart!==null&&typeof target.setSelectionRange==='function'){try{target.setSelectionRange(selectionStart,selectionEnd);}catch(_){}}}}
    updateTimerDisplay();
  }
  function navigate(view){
    app.view=view;
    if(view==='plan'&&!app.selectedDay)app.selectedDay=C.currentDayNumber(state,state.settings.activePlan||'60');
    if(view==='more'){}
    render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function selectPlan(mode){
    if(!['60','15'].includes(String(mode)))return;
    state.settings.activePlan=String(mode);state.ui.activePlan=String(mode);app.selectedDay=C.currentDayNumber(state,mode);persist(`Switched to the ${mode}-day plan. Existing progress is kept.`).then(render);
  }
  function examCountdownText(){
    if(!C.parseDate(state.settings.examDate))return 'Add your confirmed exam date in Settings to start the countdown.';
    const n=C.daysBetween(today(),state.settings.examDate);return n<0?'The saved exam date has passed. Update it when the official schedule is confirmed.':n===0?'Exam date is today.':`${n} days remaining until the date you entered.`;
  }
  function renderMetric(label,value,foot,iconName){return `<article class="card metric-card"><div class="metric-label"><span>${esc(label)}</span><span class="metric-icon">${icon(iconName||'chart')}</span></div><strong class="metric-number">${esc(value)}</strong><div class="metric-foot">${esc(foot)}</div></article>`;}
  function renderQuickConcept(c){
    const complete=c.status==='completed';return `<label class="quick-task"><input type="checkbox" data-action="concept-toggle" data-id="${attr(c.id)}" ${complete?'checked':''} aria-label="Mark ${attr(c.title)} ${complete?'not completed':'completed'}"><span class="quick-text"><strong>${esc(c.title)}</strong><small>${esc(c.paper)} · ${esc(c.unitTitle)} · ${esc(c.estimatedMinutes)} min</small></span></label>`;
  }
  function renderDashboard(){
    const planId=String(state.settings.activePlan||'60');const dayNo=C.currentDayNumber(state,planId);const day=C.planDay(state,planId,dayNo);const date=C.planDate(state,planId,dayNo)||today();
    const prog=C.overallCompletion(state);const dayProg=C.dayProgress(state,planId,dayNo);const dayTasks=(day?.conceptIds||[]).map(id=>C.getConcept(state,id)).filter(Boolean);
    const dayOpen=dayTasks.filter(c=>c.status!=='completed');const visibleTasks=(dayOpen.length?dayOpen:dayTasks).slice(0,6);
    const extras=(day?.tasks||[]).filter(t=>!t.done).slice(0,2);
    const overdue=C.getOverduePlanItems(state,planId).slice(0,4);const overdueTotal=C.getOverduePlanItems(state,planId).length;
    const revisions=C.dueRevisionBuckets(state);const dueRevs=[...revisions.overdue,...revisions.due].slice(0,4);const upcomingRevs=revisions.upcoming.filter(r=>r.dueDate<=C.addDays(today(),7)).slice(0,3);
    const weak=C.quizWeakTopics(state,5).slice(0,3);const streak=C.streakDays(state);const minutes=C.totalStudyMinutes(state);
    const planDays=C.planSummary(state,planId);
    const statusChip=day?.isRest||day?.status==='rest'?'Rest day':day?.status==='completed'?'Marked complete':day?.status==='missed'?'Missed':dayProg.conceptCompleted||dayProg.taskCompleted?'In progress':'Planned';
    return `${pageHeader('Your study space',`A steady 3–4 hour daily rhythm: roughly ${Number(state.settings.paper2TargetMinutes??160)} minutes for Psychology and ${Number(state.settings.paper1TargetMinutes??50)} minutes for Paper 1. Update either target any time.`)}
      <section class="dashboard-hero">
        <div class="card welcome-card"><div class="eyebrow">${planId==='15'?'Emergency selective coverage':'60-study-day framework'}</div><h2>Make today count, one clear concept at a time.</h2><p>${esc(examCountdownText())} Checked concepts measure coverage, not mastery; confidence, quiz accuracy and revision are tracked separately.</p><div class="welcome-actions"><button type="button" class="button" data-action="continue-today">Continue today’s study ${icon('arrow')}</button><button type="button" class="button secondary" data-action="navigate" data-view="plan">Open calendar</button></div></div>
        <article class="card today-side-card"><div><div class="today-date">${esc(C.formatDate(date))} ${date===today()?'· Today':''}</div><div class="today-number">Day ${dayNo} <span>/ ${planId}</span></div><div class="today-topic">${esc(day?.title||'Study day')}</div><div class="today-meta"><span class="pill">${esc(statusChip)}</span><span class="pill">${Number(day?.targetMinutes??210)} min planned</span><span class="pill">${C.minutesForDay(state,planId,dayNo)} min focused</span></div></div><div style="margin-top:14px">${modeSwitch()}</div></article>
      </section>
      <section class="metric-grid" aria-label="Preparation overview">
        ${renderMetric('Psychology coverage',`${prog.p2.percent}%`,`${prog.p2.completed} of ${prog.p2.total} mandatory concepts completed`,'book')}
        ${renderMetric('Paper 1 coverage',`${prog.p1.percent}%`,`${prog.p1.completed} of ${prog.p1.total} mandatory concepts completed`,'target')}
        ${renderMetric('Combined syllabus',`${prog.percent}%`,`${prog.completed} of ${prog.total} mandatory concepts completed`,'chart')}
        ${renderMetric('Focused time',`${(minutes/60).toFixed(minutes%60?1:0)}h`,`${streak} day${streak===1?'':'s'} current streak · local timer log`,'clock')}
      </section>
      <section class="progress-papers">
        <article class="card paper-progress"><div class="paper-progress-head"><div><h3>Paper 2 · Psychology</h3><p>Coverage only; revisions and PYQs are separate.</p></div><strong>${prog.p2.percent}%</strong></div><div class="progress-line"><span style="width:${prog.p2.percent}%"></span></div></article>
        <article class="card paper-progress"><div class="paper-progress-head"><div><h3>Paper 1 · General</h3><p>All 10 units are tracked alongside Paper 2.</p></div><strong>${prog.p1.percent}%</strong></div><div class="progress-line warm"><span style="width:${prog.p1.percent}%"></span></div></article>
      </section>
      <section class="dashboard-grid">
        <article class="card card-pad"><div class="card-title-row"><div><h2>Today’s scheduled work</h2><p>${dayProg.conceptCompleted}/${dayProg.conceptTotal} concepts · ${dayProg.taskCompleted}/${dayProg.taskTotal} practice and review tasks complete</p></div><button class="link-button" type="button" data-action="continue-today">Open day ↗</button></div>
          ${(visibleTasks.length||extras.length)?`<div class="quick-task-list">${visibleTasks.map(renderQuickConcept).join('')}${extras.map(t=>`<label class="quick-task"><input type="checkbox" data-action="task-toggle" data-task-id="${attr(t.id)}" data-day="${dayNo}" ${t.done?'checked':''}><span class="quick-text"><strong>${esc(t.title)}</strong><small>${esc(t.paper)} · ${esc(typeName(t.taskType))} · ${t.estimatedMinutes} min</small></span></label>`).join('')}</div>${dayOpen.length>6?`<p class="small-text">${dayOpen.length-6} more concepts on this study day.</p>`:''}`:`<div class="empty-inline">No tasks are linked to this day yet. Open the calendar to add or reschedule a task.</div>`}
        </article>
        <article class="card card-pad ${overdueTotal?'overdue-callout':''}"><div class="card-title-row"><div><h2>${overdueTotal?'Overdue / unfinished':'Revision queue'}</h2><p>${overdueTotal?`${overdueTotal} unfinished plan items are dated before today. Nothing is auto-completed.`:`${dueRevs.length} revisions are due or overdue today.`}</p></div><button class="link-button" type="button" data-action="navigate" data-view="practice" data-tab="revisions">View all</button></div>
          ${overdueTotal?`<div class="list-rows">${overdue.map(item=>`<button class="list-row" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer" data-action="go-plan-day" data-day="${item.day}" data-plan-id="${item.planId}"><span class="tag high">D${item.day}</span><span class="list-row-main"><strong>${esc(item.kind==='concept'?item.concept.title:item.task.title)}</strong><small>Due ${esc(C.formatDate(item.date))} · reschedule or continue</small></span></button>`).join('')}${overdueTotal>4?`<div class="small-text">+ ${overdueTotal-4} more unfinished items</div>`:''}</div>`:
          dueRevs.length?`<div class="list-rows">${dueRevs.map(r=>`<div class="list-row"><span class="tag ${r.dueDate<today()?'high':'tough'}">${r.dueDate<today()?'Late':'Today'}</span><span class="list-row-main"><strong>${esc(r.concept?.title||'Concept')}</strong><small>${esc(r.concept?.unitTitle||'')} · ${esc(r.dueDate)}</small></span></div>`).join('')}</div>`:`<div class="empty-inline">No revision is due today. New revisions are scheduled when you complete a concept.</div>`}
          ${upcomingRevs.length?`<div class="section-title" style="margin:14px 0 4px"><div><h2 style="font-size:15px">Upcoming revisions</h2><p>Next 7 days</p></div></div><div class="list-rows">${upcomingRevs.map(r=>`<div class="list-row"><span class="tag">${esc(r.dueDate)}</span><span class="list-row-main"><strong>${esc(r.concept?.title||'Concept')}</strong><small>${esc(r.concept?.unitTitle||'')} · revision ${r.step||'extra'}</small></span></div>`).join('')}</div>`:`<p class="small-text" style="margin-top:10px">No upcoming revision in the next 7 days.</p>`}
        </article>
      </section>
      <section class="dashboard-grid" style="margin-top:14px">
        <article class="card card-pad"><div class="card-title-row"><div><h2>Weak topics from quiz entries</h2><p>Only topics with at least 5 recorded quiz questions are ranked.</p></div><button class="link-button" data-action="navigate" data-view="syllabus">Open syllabus ↗</button></div>
          ${weak.length?`<div class="list-rows">${weak.map(w=>`<div class="list-row"><span class="tag high">${Math.round(w.accuracy*100)}%</span><span class="list-row-main"><strong>${esc(w.topic)}</strong><small>${esc(w.paper)} · ${esc(w.unitTitle)} · ${w.correct}/${w.total} correct</small></span></div>`).join('')}</div>`:`<div class="empty-inline">Add quiz correct/total scores to individual concepts. A topic appears here after at least 5 questions are recorded.</div>`}
        </article>
        <article class="card card-pad"><div class="card-title-row"><div><h2>Study-day progress</h2><p>Day status is an explicit check-in, separate from concept completion.</p></div><span class="tag">${planDays.completed}/${planDays.planned} days</span></div><div class="progress-line"><span style="width:${planDays.percent}%"></span></div><div class="report-stat-row"><span>Selected plan</span><b>${planId==='15'?'15-day emergency':'60-day framework'}</b></div><div class="report-stat-row"><span>Current date in plan</span><b>Day ${dayNo} · ${esc(C.formatDate(date))}</b></div><div class="report-stat-row"><span>Database</span><b>${esc(dbBackend)} · local device</b></div></article>
      </section>
      <section><div class="section-title"><div><h2>Jump back in</h2><p>Common actions, one tap away.</p></div></div><div class="quick-links">
        <button class="quick-link" data-action="open-syllabus-paper" data-paper="Paper 1">${icon('target')}<span>Paper 1 tracker</span></button>
        <button class="quick-link" data-action="open-syllabus-paper" data-paper="Paper 2">${icon('book')}<span>Psychology units</span></button>
        <button class="quick-link" data-action="navigate" data-view="practice" data-tab="revisions">${icon('clock')}<span>Revision queue</span></button>
        <button class="quick-link" data-action="navigate" data-view="practice" data-tab="pyqs">${icon('pencil')}<span>PYQs &amp; errors</span></button>
        <button class="quick-link" data-action="navigate" data-view="practice" data-tab="mocks">${icon('chart')}<span>Mock tests</span></button>
        <button class="quick-link" data-action="navigate" data-view="practice" data-tab="timer">${icon('clock')}<span>Study timer</span></button>
        <button class="quick-link" data-action="navigate" data-view="notes">${icon('note')}<span>Revision notebook</span></button>
        <button class="quick-link" data-action="navigate" data-view="reports">${icon('chart')}<span>Reports</span></button>
      </div></section>`;
  }
  function planDayItem(day,planId){
    const date=C.planDate(state,planId,day.day);const p=C.dayProgress(state,planId,day.day);const selected=Number(app.selectedDay)===Number(day.day);
    const dayState=day.isRest||day.status==='rest'?'Rest':day.status==='completed'?'Done':day.status==='missed'?'Missed':p.conceptCompleted||p.taskCompleted?'In progress':'Planned';
    return `<button type="button" class="day-list-item ${selected?'active':''}" data-action="select-day" data-day="${day.day}"><span class="day-bubble">${day.day}</span><span class="day-list-copy"><strong>${esc(day.title)}</strong><small>${date?esc(C.formatDate(date,{month:'short',day:'numeric',year:'numeric'})):'Set start date'} · ${esc(dayState)}</small></span><span class="day-list-right"><b>${p.conceptCompleted}/${p.conceptTotal}</b><small>concepts</small></span></button>`;
  }
  function dayTopicGroup(concepts,planId,dayNum){
    const grouped=new Map();concepts.forEach(c=>{if(!grouped.has(c.unitId))grouped.set(c.unitId,[]);grouped.get(c.unitId).push(c);});
    return [...grouped.entries()].map(([unitId,cs],ui)=>{
      const complete=cs.filter(c=>c.status==='completed').length;const u=unitById.get(unitId)||{title:cs[0]?.unitTitle||'Unit',number:0};const topics=new Map();cs.forEach(c=>{if(!topics.has(c.topic))topics.set(c.topic,new Map());const subs=topics.get(c.topic);if(!subs.has(c.subtopic))subs.set(c.subtopic,[]);subs.get(c.subtopic).push(c);});
      return `<details class="hierarchy" data-open-key="day-unit-${planId}-${dayNum}-${unitId}" ${ui===0?'open':''}><summary><span class="unit-number" style="width:27px;height:27px;flex-basis:27px;border-radius:8px;font-size:11px">${u.number||'•'}</span><span>${esc(u.title)}</span><span class="summary-count">${complete}/${cs.length} concepts</span></summary><div class="details-body"><div class="unit-topics">${[...topics.entries()].map(([topic,subMap,ti])=>`<details class="unit-topic" data-open-key="day-topic-${planId}-${dayNum}-${unitId}-${D.slug(topic)}"><summary>${esc(topic)}<span class="summary-count">${[...subMap.values()].flat().filter(c=>c.status==='completed').length}/${[...subMap.values()].flat().length}</span></summary><div class="topic-body">${[...subMap.entries()].map(([sub,items])=>`<details class="subtopic-wrap" data-open-key="day-sub-${planId}-${dayNum}-${unitId}-${D.slug(topic)}-${D.slug(sub)}"><summary>${esc(sub)} <span class="summary-count">${items.filter(c=>c.status==='completed').length}/${items.length}</span></summary><div class="concept-list">${items.map(c=>renderConceptRow(c,{planId,dayNum})).join('')}</div></details>`).join('')}</div></details>`).join('')}</div></div></details>`;
    }).join('');
  }
  function dayPlanTask(t,day,planId){
    return `<article class="task-check ${t.done?'is-done':''}"><input type="checkbox" data-action="task-toggle" data-task-id="${attr(t.id)}" data-day="${day.day}" aria-label="Mark ${attr(t.title)} complete" ${t.done?'checked':''}><div class="task-check-main"><strong>${esc(t.title)}</strong><small><span class="tag type-${attr(t.taskType)}">${esc(typeName(t.taskType))}</span> ${esc(t.paper)}${t.unitId?` · ${esc(unitTitle(t.unitId))}`:''} · ${t.estimatedMinutes||0} min</small></div><div class="task-check-actions"><button class="concept-edit-toggle" type="button" data-action="toggle-details" data-target="task-edit-${attr(t.id)}" aria-label="Edit task">${icon('pencil')}</button></div><details class="concept-edit" id="task-edit-${attr(t.id)}" data-open-key="task-edit-${attr(t.id)}"><summary>Edit task</summary><div class="concept-edit-grid">
      <div class="field span-all"><label for="task-title-${attr(t.id)}">Task title</label><input id="task-title-${attr(t.id)}" data-action="task-field" data-task-id="${attr(t.id)}" data-day="${day.day}" data-field="title" value="${attr(t.title)}"></div>
      <div class="field"><label>Type</label><select data-action="task-field" data-task-id="${attr(t.id)}" data-day="${day.day}" data-field="taskType">${['practice','pyq','revision','mock','consolidation','new-learning'].map(x=>`<option value="${x}" ${t.taskType===x?'selected':''}>${esc(typeName(x))}</option>`).join('')}</select></div>
      <div class="field"><label>Estimated minutes</label><input type="number" min="0" step="5" data-action="task-field" data-task-id="${attr(t.id)}" data-day="${day.day}" data-field="estimatedMinutes" value="${Number(t.estimatedMinutes)||0}"></div>
      <div class="field"><label>Move to day</label><select data-action="move-task" data-task-id="${attr(t.id)}" data-from-day="${day.day}" data-plan-id="${planId}">${(state.plans[planId]||[]).map(d=>`<option value="${d.day}" ${d.day===day.day?'selected':''}>Day ${d.day}</option>`).join('')}</select></div>
      <div class="field"><label>Topic / unit ID</label><input data-action="task-field" data-task-id="${attr(t.id)}" data-day="${day.day}" data-field="topic" value="${attr(t.topic||unitTitle(t.unitId))}"></div>
      <div class="field span-all"><label>Notes</label><textarea data-action="task-field" data-task-id="${attr(t.id)}" data-day="${day.day}" data-field="notes">${esc(t.notes||'')}</textarea></div>
      <div class="field span-all"><button class="quiet-button" type="button" data-action="delete-plan-task" data-task-id="${attr(t.id)}" data-day="${day.day}">Remove this optional plan task</button></div>
    </div></details></article>`;
  }
  function renderPlan(){
    const planId=String(state.settings.activePlan||'60');const days=state.plans[planId]||[];if(!app.selectedDay)app.selectedDay=C.currentDayNumber(state,planId);let day=C.planDay(state,planId,app.selectedDay)||days[0];if(!day)return `${pageHeader('Study calendar','No study days were found.')}`;
    const date=C.planDate(state,planId,day.day);const p=C.dayProgress(state,planId,day.day);const concepts=(day.conceptIds||[]).map(id=>C.getConcept(state,id)).filter(Boolean);const p2=concepts.filter(c=>c.paper==='Paper 2'),p1=concepts.filter(c=>c.paper==='Paper 1');const actual=C.minutesForDay(state,planId,day.day);const rest=day.isRest||day.status==='rest';const daysSummary=C.planSummary(state,planId);
    const statusOptions=[['planned','Planned'],['partial','Partially completed'],['completed','Completed'],['missed','Missed'],['rest','Rest day']];
    return `${pageHeader('Study calendar',planId==='15'?'Emergency selective coverage only · this does not replace the full-depth 60-day checklist.':'60 study sessions in the original priority-based order. You can open any day, adjust dates and move unfinished work without losing it.',modeSwitch())}
      <div class="plan-controls"><div class="today-meta"><span class="pill">${days.length} planned days</span><span class="pill">${daysSummary.completed} explicitly completed</span><span class="pill">Start date: ${state.settings.startDate?esc(C.formatDate(state.settings.startDate,{month:'short',day:'numeric',year:'numeric'})):'not set'}</span></div><button type="button" class="button secondary small" data-action="navigate" data-view="settings">Edit dates &amp; daily targets</button></div>
      ${planId==='15'?`<div class="notice warn" style="margin-bottom:12px"><span>${icon('alert')}</span><span><strong>Selective emergency pass:</strong> concepts not present in this 15-day plan remain available in the full syllabus and 60-day plan. Plan switching never deletes progress.</span></div>`:''}
      <div class="plan-layout"><section class="card day-list-card"><div class="day-list-header"><h2>${planId==='15'?'15-day emergency plan':'60-day priority plan'}</h2><p>Select any day; tasks do not lock later days.</p></div><div class="day-list">${days.map(d=>planDayItem(d,planId)).join('')}</div></section>
      <section class="card day-detail"><div class="day-detail-top"><div><div class="eyebrow">Study day ${day.day} · ${planId==='15'?'Emergency plan':'Full plan'}</div><h2>${esc(day.title)}</h2><p>${date?esc(C.formatDate(date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})):'Set a start date in Settings'}${date===today()?' · Today':''}</p><div class="day-detail-stats"><span class="pill">${p.conceptCompleted}/${p.conceptTotal} concepts complete</span><span class="pill">${p.taskCompleted}/${p.taskTotal} plan tasks complete</span><span class="pill">${actual} focused min</span><span class="pill">${Number(day.targetMinutes??210)} min target</span></div></div><button class="button secondary small" type="button" data-action="navigate" data-view="practice" data-tab="timer">Start a study session ${icon('clock')}</button></div>
      <div class="day-edit-grid"><div class="field"><label for="day-date-${planId}-${day.day}">Planned date (override)</label><input id="day-date-${planId}-${day.day}" type="date" data-action="day-date" data-plan-id="${planId}" data-day="${day.day}" value="${attr(day.dateOverride||'')}"><span class="hint">Blank follows the plan start date.</span></div><div class="field"><label for="day-target-${planId}-${day.day}">Daily target (minutes)</label><input id="day-target-${planId}-${day.day}" type="number" min="0" max="1440" step="5" data-action="day-target" data-plan-id="${planId}" data-day="${day.day}" value="${Number(day.targetMinutes??210)}"></div><div class="field"><label for="day-status-${planId}-${day.day}">Day status</label><select id="day-status-${planId}-${day.day}" data-action="day-status" data-plan-id="${planId}" data-day="${day.day}">${statusOptions.map(([v,l])=>`<option value="${v}" ${(day.status===v||v==='rest'&&rest)?'selected':''}>${l}</option>`).join('')}</select></div></div>
      <div class="field"><label for="day-notes-${planId}-${day.day}">Day note / reschedule plan</label><textarea id="day-notes-${planId}-${day.day}" data-action="day-note" data-plan-id="${planId}" data-day="${day.day}" placeholder="What will you move if this day is interrupted?">${esc(day.notes||'')}</textarea></div>
      ${!rest?`${p2.length?`<section class="day-task-section"><h3><span class="tag">Paper 2 · Psychology</span><span class="summary-count">${p2.filter(c=>c.status==='completed').length}/${p2.length}</span></h3>${dayTopicGroup(p2,planId,day.day)}</section>`:''}${p1.length?`<section class="day-task-section"><h3><span class="tag easy">Paper 1 · General</span><span class="summary-count">${p1.filter(c=>c.status==='completed').length}/${p1.length}</span></h3>${dayTopicGroup(p1,planId,day.day)}</section>`:''}
      ${(day.tasks||[]).length?`<section class="day-task-section"><h3><span>Revision, PYQ, mock &amp; practice tasks</span><span class="summary-count">${day.tasks.filter(t=>t.done).length}/${day.tasks.length}</span></h3><div class="concept-list">${day.tasks.map(t=>dayPlanTask(t,day,planId)).join('')}</div></section>`:''}
      <details class="day-task-section" data-open-key="add-task-${planId}-${day.day}"><summary class="link-button">${icon('plus')} Add a custom task to this day</summary><form data-form="add-plan-task" data-day="${day.day}" data-plan-id="${planId}" class="form-grid" style="padding:10px 0"><div class="field span-2"><label>Task</label><input name="title" required maxlength="160" placeholder="e.g., Review a difficult comparison"></div><div class="field"><label>Paper</label><select name="paper"><option>Paper 2</option><option>Paper 1</option></select></div><div class="field"><label>Task type</label><select name="taskType"><option value="practice">Practice</option><option value="pyq">PYQ practice</option><option value="revision">Revision</option><option value="mock">Mock test</option></select></div><div class="field"><label>Minutes</label><input type="number" name="minutes" min="0" max="600" value="20"></div><div class="form-actions span-2"><button class="button small" type="submit">Add task</button></div></form></details>`:`<div class="notice info" style="margin-top:14px">Rest day is intentionally excluded from overdue calculations. Clear “Rest day” to show the study checklist again.</div>`}
      </section></div>`;
  }
  function conceptMatches(c,filters){
    if(filters.paper!=='all'&&c.paper!==filters.paper)return false;
    if(filters.unit!=='all'&&c.unitId!==filters.unit)return false;
    if(filters.day!=='all'){
      const day=C.planDay(state,state.settings.activePlan||'60',Number(filters.day));if(!day||!(day.conceptIds||[]).includes(c.id))return false;
    }
    if(filters.query){const hay=`${c.title} ${c.topic} ${c.subtopic} ${c.unitTitle} ${c.learningTarget}`.toLowerCase();if(!hay.includes(filters.query.toLowerCase()))return false;}
    if(filters.filter==='incomplete'&&c.status==='completed')return false;
    if(filters.filter==='high'&&c.priority!=='High')return false;
    if(filters.filter==='tough'&&c.difficulty!=='Tough')return false;
    if(filters.filter==='revision'){
      const has=(state.revisions||[]).some(r=>r.conceptId===c.id&&r.status==='scheduled'&&r.dueDate<=today());if(!has)return false;
    }
    return true;
  }
  function topicKey(unitId,topic){return `${unitId}::${topic}`;}
  function renderSyllabus(){
    const paper=app.syllabusPaper;const filter=app.syllabusFilter;const query=app.syllabusQuery;const unitSel=app.syllabusUnit;const daySel=app.syllabusDay;const planId=String(state.settings.activePlan||'60');
    const paperUnits=paper==='Paper 1'?D.PAPER1_UNITS:paper==='Paper 2'?D.PSY_UNITS:unitDefs;
    if(filter==='pyqs'){
      const pending=[];(state.plans[planId]||[]).forEach(d=>(d.tasks||[]).forEach(t=>{if(t.taskType==='pyq'&&!t.done)pending.push({d,t});}));
      return `${pageHeader('Syllabus tracker','Mandatory concept coverage is calculated from individual syllabus concepts only. Revision, PYQ and mock tasks never inflate syllabus completion.',`<button class="button secondary small" data-action="open-syllabus-paper" data-paper="Paper 1">Paper 1</button><button class="button secondary small" data-action="open-syllabus-paper" data-paper="Paper 2">Paper 2</button>`)}${renderSyllabusFilters()}<div class="card card-pad"><div class="card-title-row"><div><h2>PYQ tasks remaining · ${planId}-day plan</h2><p>Only scheduled practice tasks appear here; actual questions must be entered by you.</p></div><button class="button small" data-action="navigate" data-view="practice" data-tab="pyqs">Open PYQ log</button></div>${pending.length?`<div class="list-rows">${pending.map(({d,t})=>`<div class="list-row"><span class="tag type-pyq">Day ${d.day}</span><span class="list-row-main"><strong>${esc(t.title)}</strong><small>${esc(t.paper)} · ${esc(C.planDate(state,planId,d.day)||'Date not set')}</small></span><button class="button secondary small" data-action="go-plan-day" data-plan-id="${planId}" data-day="${d.day}">Open</button></div>`).join('')}</div>`:`<div class="empty-inline">No scheduled PYQ task remains unchecked in this plan. Add real questions in Practice → PYQs; none are fabricated in the app.</div>`}</div>`;
    }
    const filters={paper:paper==='all'?'all':paper,unit:unitSel,day:daySel,query,filter};
    const unitsToRender=paperUnits.filter(u=>unitSel==='all'||u.id===unitSel);
    let visibleTotal=0;
    const unitMarkup=unitsToRender.map(unit=>{
      const all=state.concepts.filter(c=>c.unitId===unit.id);const visible=all.filter(c=>conceptMatches(c,filters));if(!visible.length)return '';
      visibleTotal+=visible.length;const done=all.filter(c=>c.mandatory!==false&&c.status==='completed').length;const mandatory=all.filter(c=>c.mandatory!==false).length;
      const topicsMarkup=unit.topics.map(topic=>{
        const topicConcepts=visible.filter(c=>c.topic===topic.title);if(!topicConcepts.length)return '';
        const allTopic=all.filter(c=>c.topic===topic.title&&c.mandatory!==false);const doneTopic=allTopic.filter(c=>c.status==='completed').length;const subMarkup=topic.subtopics.map(sub=>{
          const subConcepts=topicConcepts.filter(c=>c.subtopic===sub.name);if(!subConcepts.length)return '';
          const allSub=all.filter(c=>c.topic===topic.title&&c.subtopic===sub.name&&c.mandatory!==false);const doneSub=allSub.filter(c=>c.status==='completed').length;
          return `<details class="subtopic-wrap" data-open-key="syllabus-sub-${unit.id}-${D.slug(topic.title)}-${D.slug(sub.name)}"><summary>${esc(sub.name)} <span class="summary-count">${doneSub}/${allSub.length}${query||filter!=='all'?' · '+subConcepts.length+' visible':''}</span></summary><div class="concept-list">${subConcepts.map(c=>renderConceptRow(c,{planId,syllabus:true})).join('')}</div></details>`;
        }).join('');
        const key=topicKey(unit.id,topic.title);const note=state.topicNotes[key]||'';
        return `<details class="unit-topic" data-open-key="syllabus-topic-${unit.id}-${D.slug(topic.title)}"><summary>${esc(topic.title)}<span class="summary-count">${doneTopic}/${allTopic.length}${query||filter!=='all'?' · '+topicConcepts.length+' visible':''}</span></summary><div class="topic-body"><details class="subtopic-wrap topic-notes" data-open-key="topic-note-${unit.id}-${D.slug(topic.title)}"><summary>My topic note</summary><div class="field"><label class="hide" for="topic-note-${unit.id}-${D.slug(topic.title)}-input">Topic note</label><textarea id="topic-note-${unit.id}-${D.slug(topic.title)}-input" data-action="topic-note" data-topickey="${attr(key)}" placeholder="Short note or confusion to revisit">${esc(note)}</textarea></div></details>${subMarkup}</div></details>`;
      }).join('');
      const globalPct=mandatory?Math.round(done*100/mandatory):0;
      return `<details class="card unit-card" data-open-key="unit-${unit.id}"><summary><span class="unit-heading"><span class="unit-number">${unit.number}</span><span class="unit-title"><strong>${esc(unit.title)}</strong><small>${unit.id.startsWith('p1')?'Paper 1 · General':'Paper 2 · Psychology'} · ${mandatory} mandatory concepts${all.some(c=>c.mandatory===false)?` · ${all.filter(c=>c.mandatory===false).length} optional`:''}</small></span></span><span class="unit-progress"><strong>${done}/${mandatory}</strong><span class="progress-line"><span style="width:${globalPct}%"></span></span></span></summary><div class="unit-body"><div class="unit-topics">${topicsMarkup}</div></div></details>`;
    }).join('');
    return `${pageHeader('Syllabus tracker','The official unit navigator follows syllabus order. The study calendar remains in your priority-based sequence. Parent counts include mandatory first-learning concepts only.',`<a class="button secondary small" href="${D.OFFICIAL_PAGE}" target="_blank" rel="noreferrer">Official syllabus sources ↗</a>`)}${renderSyllabusFilters()}<div class="notice info" style="margin-bottom:12px"><span>${icon('alert')}</span><span>Difficulty and priority are planning estimates, not question-weightage claims. Optional supporting items are labeled. A checked box records coverage, not proof of mastery.</span></div>${unitMarkup||`<div class="filter-empty">No concepts match these filters. Clear the search or choose a different paper, unit, day or filter.</div>`}<p class="disclaimer">Showing ${visibleTotal} concept${visibleTotal===1?'':'s'} · Paper 1 and Paper 2 syllabus PDFs were checked against the current official UGC NET syllabus portal on 10 Oct 2026. Re-check NTA's December 2026 bulletin for any cycle-specific change.</p>`;
  }
  function renderSyllabusFilters(){
    const unitOptions=unitDefs.filter(u=>app.syllabusPaper==='all'||app.syllabusPaper==='Paper 1'&&u.id.startsWith('p1')||app.syllabusPaper==='Paper 2'&&u.id.startsWith('p2'));
    const days=state.plans[String(state.settings.activePlan||'60')]||[];
    return `<div class="card syllabus-toolbar"><div class="field search-box"><label for="syllabus-search">Search concepts</label>${icon('search')}<input id="syllabus-search" type="search" data-action="syllabus-search" placeholder="Name, topic, subtopic…" value="${attr(app.syllabusQuery)}"></div><div class="field"><label for="syllabus-paper">Paper</label><select id="syllabus-paper" data-action="syllabus-paper"><option value="Paper 2" ${app.syllabusPaper==='Paper 2'?'selected':''}>Paper 2 · Psychology</option><option value="Paper 1" ${app.syllabusPaper==='Paper 1'?'selected':''}>Paper 1 · General</option><option value="all" ${app.syllabusPaper==='all'?'selected':''}>Both papers</option></select></div><div class="field"><label for="syllabus-filter">Filter</label><select id="syllabus-filter" data-action="syllabus-filter"><option value="all" ${app.syllabusFilter==='all'?'selected':''}>All concepts</option><option value="incomplete" ${app.syllabusFilter==='incomplete'?'selected':''}>Incomplete</option><option value="high" ${app.syllabusFilter==='high'?'selected':''}>High priority</option><option value="tough" ${app.syllabusFilter==='tough'?'selected':''}>Tough</option><option value="revision" ${app.syllabusFilter==='revision'?'selected':''}>Revision due</option><option value="pyqs" ${app.syllabusFilter==='pyqs'?'selected':''}>PYQs remaining</option></select></div><div class="field"><label for="syllabus-unit">Unit</label><select id="syllabus-unit" data-action="syllabus-unit"><option value="all">All units</option>${unitOptions.map(u=>`<option value="${u.id}" ${app.syllabusUnit===u.id?'selected':''}>${u.id.startsWith('p1')?'P1':'P2'} · ${u.number}. ${esc(u.title)}</option>`).join('')}</select></div><div class="field"><label for="syllabus-day">Study day</label><select id="syllabus-day" data-action="syllabus-day"><option value="all">All days · ${state.settings.activePlan}-day plan</option>${days.map(d=>`<option value="${d.day}" ${String(app.syllabusDay)===String(d.day)?'selected':''}>Day ${d.day} · ${esc(d.title.slice(0,26))}</option>`).join('')}</select></div></div>`;
  }
  function findConceptDay(planId,id){const days=state.plans[String(planId)]||[];const d=days.find(x=>(x.conceptIds||[]).includes(id));return d?.day||0;}
  function renderConceptRow(c,context={}){
    const planId=String(context.planId||state.settings.activePlan||'60');const fromDay=context.dayNum||findConceptDay(planId,c.id);const complete=c.status==='completed';
    const revisions=(state.revisions||[]).filter(r=>r.conceptId===c.id&&r.status==='scheduled').sort((a,b)=>a.dueDate.localeCompare(b.dueDate));const dueRev=revisions.find(r=>r.dueDate<=today());
    const priorityClass=c.priority==='High'?'high':'';const difficultyClass=c.difficulty==='Tough'?'tough':c.difficulty==='Easy'?'easy':'';
    const editKey=`concept-edit-${c.id}`;
    const days=state.plans[planId]||[];
    return `<article class="concept-row ${complete?'is-complete':''}"><input class="concept-check" type="checkbox" data-action="concept-toggle" data-id="${attr(c.id)}" ${complete?'checked':''} aria-label="Mark ${attr(c.title)} completed"><div class="concept-row-main"><strong class="concept-name">${esc(c.title)}</strong><span class="concept-target">${esc(c.learningTarget)}</span><div class="concept-meta"><span class="tag ${priorityClass}">${esc(c.priority||'Medium')}</span><span class="tag ${difficultyClass}">${esc(c.difficulty||'Moderate')}</span><span class="tag">${Number(c.estimatedMinutes)||0} min</span><span class="tag type-new-learning">${esc(typeName(c.taskType||'new-learning'))}</span>${c.mandatory===false?'<span class="tag optional">Optional support</span>':''}${dueRev?`<span class="tag ${dueRev.dueDate<today()?'high':'tough'}">${dueRev.dueDate<today()?'Revision overdue':'Revision due'}</span>`:''}</div></div><div class="concept-side"><button class="concept-edit-toggle" type="button" data-action="toggle-details" data-target="${attr(editKey)}" aria-label="Edit concept details">${icon('pencil')}</button></div>
      <details class="concept-edit" id="${attr(editKey)}" data-open-key="${attr(editKey)}"><summary>Concept details</summary><div class="concept-edit-grid">
        <div class="field span-all"><label for="concept-title-${attr(c.id)}">Concept title</label><input id="concept-title-${attr(c.id)}" data-action="concept-field" data-id="${attr(c.id)}" data-field="title" value="${attr(c.title)}"></div>
        <div class="field span-all"><label for="concept-target-${attr(c.id)}">Actionable learning target</label><textarea id="concept-target-${attr(c.id)}" data-action="concept-field" data-id="${attr(c.id)}" data-field="learningTarget">${esc(c.learningTarget)}</textarea></div>
        <div class="field"><label>Status</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="status">${[['not_started','Not started'],['in_progress','In progress'],['completed','Completed'],['needs_revision','Needs revision']].map(([v,l])=>`<option value="${v}" ${c.status===v?'selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Priority</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="priority">${['High','Medium','Low'].map(v=>`<option ${c.priority===v?'selected':''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label>Difficulty</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="difficulty">${['Easy','Moderate','Tough'].map(v=>`<option ${c.difficulty===v?'selected':''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label>Study value</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="studyValue">${['Scoring potential','Conceptual foundation','Factual recall'].map(v=>`<option ${c.studyValue===v?'selected':''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label>Estimated minutes</label><input type="number" min="0" step="1" data-action="concept-field" data-id="${attr(c.id)}" data-field="estimatedMinutes" value="${Number(c.estimatedMinutes)||0}"></div>
        <div class="field"><label>Confidence (1–5)</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="confidence"><option value="0" ${!Number(c.confidence)?'selected':''}>Not rated</option>${[1,2,3,4,5].map(v=>`<option value="${v}" ${Number(c.confidence)===v?'selected':''}>${v} · ${['','Very unsure','Unsure','Developing','Confident','Very confident'][v]}</option>`).join('')}</select></div>
        <div class="field"><label>Quiz correct / total</label><div style="display:flex;gap:5px"><input aria-label="Quiz correct" type="number" min="0" data-action="concept-field" data-id="${attr(c.id)}" data-field="quizCorrect" value="${attr(c.quizCorrect)}" placeholder="Correct"><input aria-label="Quiz total" type="number" min="0" data-action="concept-field" data-id="${attr(c.id)}" data-field="quizTotal" value="${attr(c.quizTotal)}" placeholder="Total"></div></div>
        <div class="field"><label>Last studied</label><input type="date" data-action="concept-field" data-id="${attr(c.id)}" data-field="lastStudied" value="${attr(c.lastStudied||'')}"></div>
        <div class="field"><label>Next revision date</label><input type="date" data-action="concept-field" data-id="${attr(c.id)}" data-field="nextRevisionDate" value="${attr(c.nextRevisionDate||'')}"></div>
        <div class="field"><label>Task type</label><select data-action="concept-field" data-id="${attr(c.id)}" data-field="taskType">${[['new-learning','New learning'],['pyq','PYQ practice'],['revision','Revision'],['mock','Mock test']].map(([v,l])=>`<option value="${v}" ${c.taskType===v?'selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Reschedule in ${planId}-day plan</label><select data-action="move-concept" data-id="${attr(c.id)}" data-plan-id="${planId}" data-from-day="${fromDay}"><option value="0">Not scheduled in this plan</option>${days.map(d=>`<option value="${d.day}" ${Number(fromDay)===d.day?'selected':''}>Day ${d.day}</option>`).join('')}</select></div>
        <div class="field span-all"><label>Source / reference</label><input data-action="concept-field" data-id="${attr(c.id)}" data-field="source" value="${attr(c.source||'')}"></div>
        <div class="field span-all"><label>My notes</label><textarea data-action="concept-field" data-id="${attr(c.id)}" data-field="notes" placeholder="Keep it short: key distinction, example, or confusion">${esc(c.notes||'')}</textarea></div>
        <div class="field span-all"><small class="small-text">${esc(c.paper)} · Unit ${c.unitNumber}: ${esc(c.unitTitle)} · ${esc(c.topic)} → ${esc(c.subtopic)} · ID ${esc(c.id)}</small><button type="button" class="link-button" data-action="schedule-manual-revision" data-id="${attr(c.id)}">Schedule one extra revision</button></div>
      </div></details></article>`;
  }
  function renderPractice(){
    const tabs=[['pyqs','PYQs & errors'],['revisions','Revisions'],['mocks','Mock tests'],['timer','Study timer']];
    const label=tabs.find(x=>x[0]===app.practiceTab)?.[1]||'Practice';
    const content=app.practiceTab==='pyqs'?renderPyqs():app.practiceTab==='revisions'?renderRevisions():app.practiceTab==='mocks'?renderMocks():renderTimer();
    return `${pageHeader('Practice & review','Log real questions and your own mock results. No past questions, answer keys, year associations or JRF predictions are generated by this tracker.')}<div class="practice-tabs" role="tablist">${tabs.map(([id,name])=>`<button type="button" role="tab" aria-selected="${app.practiceTab===id}" class="${app.practiceTab===id?'active':''}" data-action="practice-tab" data-tab="${id}">${esc(name)}</button>`).join('')}</div><div aria-label="${esc(label)}">${content}</div>`;
  }
  function unitOptions(paper,selected=''){
    const units=unitDefs.filter(u=>paper==='Paper 1'?u.id.startsWith('p1'):paper==='Paper 2'?u.id.startsWith('p2'):true);
    return `<option value="">Select unit</option>${units.map(u=>`<option value="${u.id}" ${selected===u.id?'selected':''}>Unit ${u.number} · ${esc(u.title)}</option>`).join('')}`;
  }
  function renderPyqs(){
    const q=app.editingPyqId?state.pyqs.find(x=>x.id===app.editingPyqId):null;
    const p=q?.paper||'Paper 2';const stats=C.pyqStats(state,{minAnswered:5});
    return `<div class="content-grid"><section class="card form-card"><h2>${q?'Edit PYQ record':'Log a PYQ attempt'}</h2><p>Record a question you attempted from your own book or a verified paper source. Keep the source reference; this app includes no question bank. <a href="https://ndl.iitkgp.ac.in/cd_document/ugc_net/04_psychology" target="_blank" rel="noreferrer">NDLI Psychology paper collection ↗</a></p>
      <form data-form="pyq" class="form-grid three">
        <div class="field"><label for="pyq-date">Date</label><input id="pyq-date" type="date" name="date" value="${attr(q?.date||today())}" required></div>
        <div class="field"><label for="pyq-paper-field">Paper</label><select id="pyq-paper-field" name="paper" data-action="pyq-paper-select"><option ${p==='Paper 1'?'selected':''}>Paper 1</option><option ${p==='Paper 2'?'selected':''}>Paper 2</option></select></div>
        <div class="field"><label for="pyq-unit">Unit</label><select id="pyq-unit" name="unitId">${unitOptions(p,q?.unitId||'')}</select></div>
        <div class="field span-2"><label for="pyq-topic">Topic</label><input id="pyq-topic" name="topic" maxlength="160" value="${attr(q?.topic||'')}" placeholder="Specific topic or concept"></div>
        <div class="field"><label for="pyq-year">Exam year (if known)</label><input id="pyq-year" type="number" min="1990" max="2100" name="examYear" value="${attr(q?.examYear||'')}" placeholder="Optional"></div>
        <div class="field span-2"><label for="pyq-ref">Question identifier / source</label><input id="pyq-ref" name="identifier" maxlength="180" value="${attr(q?.identifier||'')}" placeholder="Book, paper/date/shift, page or question number"></div>
        <div class="field"><label for="pyq-result">Result</label><select id="pyq-result" name="result"><option value="unattempted" ${q?.result==='unattempted'?'selected':''}>Unattempted</option><option value="correct" ${q?.result==='correct'?'selected':''}>Correct</option><option value="incorrect" ${q?.result==='incorrect'?'selected':''}>Incorrect</option></select></div>
        <div class="field"><label for="pyq-time">Time taken (seconds)</label><input id="pyq-time" type="number" min="0" name="timeSeconds" value="${attr(q?.timeSeconds||'')}" placeholder="Optional"></div>
        <div class="field"><label for="pyq-error">Error type</label><select id="pyq-error" name="errorType"><option value="">Not applicable / not set</option>${['Knowledge gap','Confusion between theories','Calculation error','Misreading','Careless mistake'].map(x=>`<option ${q?.errorType===x?'selected':''}>${x}</option>`).join('')}</select></div>
        <div class="field span-2"><label for="pyq-correction">Explanation / corrective note</label><textarea id="pyq-correction" name="correctiveNote" placeholder="Why was the answer missed? What will you recall next time?">${esc(q?.correctiveNote||'')}</textarea></div>
        <div class="field"><label for="pyq-reattempt">Reattempt date</label><input id="pyq-reattempt" type="date" name="reattemptDate" value="${attr(q?.reattemptDate||'')}"></div>
        <div class="form-actions span-3"><button class="button" type="submit">${q?'Save changes':'Save PYQ record'}</button>${q?`<button class="button secondary" type="button" data-action="cancel-edit-pyq">Cancel</button>`:''}</div>
      </form>
      <div class="spacer"></div><div class="backup-actions"><button class="button secondary small" type="button" data-action="import-pyq-csv">Import PYQs from CSV</button><button class="button secondary small" type="button" data-action="export-pyq-csv">Export PYQ CSV</button><input id="pyq-csv-file" class="file-input" type="file" accept=".csv,text/csv"></div>
    </section><aside class="card form-card"><div class="card-title-row"><div><h2>Accuracy by unit/topic</h2><p>Displayed as meaningful only after 5 answered records.</p></div></div>${stats.length?`<div class="data-table-wrap"><table class="data-table" style="min-width:420px"><thead><tr><th>Paper / unit</th><th>Topic</th><th>Answered</th><th>Accuracy</th></tr></thead><tbody>${stats.map(s=>`<tr><td>${esc(s.paper)}<br><small>${esc(unitTitle(s.unitId))}</small></td><td>${esc(s.topic||'Unit-level')}</td><td>${s.answered}</td><td>${s.meaningful?`<span class="${s.accuracy<.6?'accuracy-low':'accuracy-good'}">${Math.round(s.accuracy*100)}%</span>`:`<span class="accuracy-missing">Need ${5-s.answered} more</span>`}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-inline">No PYQ attempts yet. Add a real attempt to begin the log.</div>`}<p class="disclaimer">Unattempted entries do not affect accuracy. Accuracy is descriptive, not a prediction of exam performance.</p></aside></div>
      <section class="section-title"><div><h2>Your PYQ log</h2><p>${state.pyqs.length} recorded question${state.pyqs.length===1?'':'s'} · inaccurate or incomplete entries can be edited or removed.</p></div></section>
      ${state.pyqs.length?`<div class="card data-table-wrap"><table class="data-table"><thead><tr><th>Date / paper</th><th>Unit / topic</th><th>Source reference</th><th>Result / error</th><th>Reattempt</th><th>Actions</th></tr></thead><tbody>${[...state.pyqs].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>`<tr><td>${esc(x.date||'—')}<br><span class="muted">${esc(x.paper)}${x.examYear?` · ${esc(x.examYear)}`:''}</span></td><td>${esc(unitTitle(x.unitId))}<br><span class="muted">${esc(x.topic||'—')}</span></td><td>${esc(x.identifier||'—')}</td><td><b>${esc(x.result)}</b>${x.errorType?`<br><span class="muted">${esc(x.errorType)}</span>`:''}${x.timeSeconds?`<br><span class="muted">${x.timeSeconds}s</span>`:''}</td><td>${esc(x.reattemptDate||'—')}</td><td><div class="table-actions"><button data-action="edit-pyq" data-id="${attr(x.id)}">Edit</button><button data-action="delete-pyq" data-id="${attr(x.id)}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="card card-pad"><div class="filter-empty">No PYQs logged yet. Use the form above after you attempt a question from a verified source.</div></div>`}`;
  }
  function renderRevisions(){
    const b=C.dueRevisionBuckets(state);const upcoming=b.upcoming.filter(r=>r.dueDate<=C.addDays(today(),7));
    const card=(r,isOverdue=false)=>`<article class="revision-card ${isOverdue?'overdue':''}" id="revision-${attr(r.id)}"><div><strong>${esc(r.concept?.title||'Concept unavailable')}</strong><small>${esc(r.concept?.paper||'')} · ${esc(r.concept?.unitTitle||'')} · ${esc(r.concept?.topic||'')}</small><small>${isOverdue?'Overdue since':r.dueDate===today()?'Due today':'Due'} ${esc(r.dueDate)} · ${r.kind==='retry'?'extra revision':`revision ${r.step||''} (${r.intervalDays||'?'}d)`}</small></div><div class="revision-actions"><button class="button small" type="button" data-action="toggle-revision-form" data-target="revision-form-${attr(r.id)}">Mark reviewed</button><button class="quiet-button" type="button" data-action="open-concept" data-id="${attr(r.conceptId)}" title="Open concept">↗</button></div><form class="revision-complete-form form-grid three" id="revision-form-${attr(r.id)}" data-form="revision-complete" data-id="${attr(r.id)}"><div class="field"><label>Confidence after review</label><select name="confidenceAfter"><option value="0">Not rated</option>${[1,2,3,4,5].map(n=>`<option ${Number(r.concept?.confidence)===n?'selected':''}>${n}</option>`).join('')}</select></div><div class="field span-2"><label>Revision note</label><input name="notes" placeholder="What became clearer?" value="${attr(r.notes||'')}"></div><div class="field span-3"><label class="check-row"><input type="checkbox" name="stillUnclear"> Still unclear — schedule one retry for tomorrow</label></div><div class="form-actions span-3"><button class="button small" type="submit">Save review</button></div></form></article>`;
    return `<div class="notice info" style="margin-bottom:13px"><span>${icon('clock')}</span><span>Revisions are separate from syllabus coverage. Completing or reviewing a concept does not automatically mark its revision history as done. Default intervals: ${esc((state.settings.revisionIntervals||[]).join(' · '))} days after completion; edit them in Settings.</span></div>
      <div class="analytics-grid"><section class="card form-card"><div class="card-title-row"><div><h2>Overdue revisions</h2><p>${b.overdue.length} revision${b.overdue.length===1?'':'s'} need attention.</p></div></div>${b.overdue.length?`<div class="revision-list">${b.overdue.map(r=>card(r,true)).join('')}</div>`:`<div class="empty-inline">Nothing overdue. If a concept is still unclear, use “Schedule one extra revision” in its details.</div>`}</section>
      <section class="card form-card"><div class="card-title-row"><div><h2>Due today</h2><p>${b.due.length} revision${b.due.length===1?'':'s'} due.</p></div></div>${b.due.length?`<div class="revision-list">${b.due.map(r=>card(r)).join('')}</div>`:`<div class="empty-inline">No revision is due today.</div>`}</section>
      <section class="card form-card"><div class="card-title-row"><div><h2>Coming up · 7 days</h2><p>${upcoming.length} upcoming revision${upcoming.length===1?'':'s'}.</p></div></div>${upcoming.length?`<div class="revision-list">${upcoming.map(r=>card(r)).join('')}</div>`:`<div class="empty-inline">No scheduled revision in the next 7 days.</div>`}</section>
      <section class="card form-card"><div class="card-title-row"><div><h2>Revision history</h2><p>Confidence is kept before and after each review where entered.</p></div></div>${b.history.length?`<div class="list-rows">${b.history.slice(0,20).map(r=>`<div class="list-row"><span class="tag">Reviewed</span><span class="list-row-main"><strong>${esc(C.getConcept(state,r.conceptId)?.title||'Concept')}</strong><small>${esc(r.completedAt?.slice(0,10)||'')} · confidence ${r.confidenceBefore||'—'} → ${r.confidenceAfter||'—'}${r.notes?` · ${esc(r.notes)}`:''}</small></span></div>`).join('')}</div>`:`<div class="empty-inline">Completed revision records will appear here.</div>`}</section></div>`;
  }
  function renderMocks(){
    const m=app.editingMockId?state.mockTests.find(x=>x.id===app.editingMockId):null;
    const sorted=[...state.mockTests].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    return `<div class="notice warn" style="margin-bottom:13px"><span>${icon('alert')}</span><span>Mock-test trends are for self-review only. A few scores cannot reliably predict JRF qualification. Confirm the applicable December 2026 marking scheme in the current NTA bulletin.</span></div><div class="content-grid"><section class="card form-card"><h2>${m?'Edit mock test':'Record a mock test'}</h2><p>Enter official practice scores if you have them, or leave them blank to calculate a total from correct/incorrect counts and your configured marking scheme.</p><form data-form="mock" class="form-grid three">
      <div class="field"><label>Test date</label><input type="date" name="date" value="${attr(m?.date||today())}" required></div>
      <div class="field"><label>Paper 1 score</label><input type="number" step="0.01" name="paper1Score" value="${attr(m?.paper1Score??'')}" placeholder="Optional"></div>
      <div class="field"><label>Paper 2 score</label><input type="number" step="0.01" name="paper2Score" value="${attr(m?.paper2Score??'')}" placeholder="Optional"></div>
      <div class="field"><label>Attempted questions</label><input type="number" min="0" name="attempted" value="${attr(m?.attempted??'')}"></div>
      <div class="field"><label>Correct</label><input type="number" min="0" name="correct" value="${attr(m?.correct??'')}"></div>
      <div class="field"><label>Incorrect</label><input type="number" min="0" name="incorrect" value="${attr(m?.incorrect??'')}"></div>
      <div class="field"><label>Time taken (minutes)</label><input type="number" min="0" name="timeMinutes" value="${attr(m?.timeMinutes??'')}"></div>
      <div class="field span-2"><label>Weak units (comma separated)</label><input name="weakUnits" value="${attr((m?.weakUnits||[]).join(', '))}" placeholder="e.g., Research Aptitude, Unit 5"></div>
      <div class="field span-3"><label>Lessons learned / next actions</label><textarea name="lessons" placeholder="What will you change before the next attempt?">${esc(m?.lessons||'')}</textarea></div>
      <div class="form-actions span-3"><button class="button" type="submit">${m?'Save changes':'Save mock result'}</button>${m?`<button class="button secondary" type="button" data-action="cancel-edit-mock">Cancel</button>`:''}</div></form><p class="disclaimer">Current settings: ${state.settings.marksPerCorrect} mark(s) per correct · ${state.settings.negativeMarks} negative mark(s) per incorrect. Total is the sum of paper scores if entered; otherwise it is calculated from correct/incorrect counts.</p></section>
      <aside class="card form-card"><h2>Score trend</h2><p>Raw totals only; no qualification forecast.</p>${sorted.length?mockChart(sorted):`<div class="empty-inline">Record two or more mock tests to see a trend.</div>`}<div class="report-stat-row"><span>Tests recorded</span><b>${state.mockTests.length}</b></div><div class="report-stat-row"><span>Latest total</span><b>${sorted.length?Number(sorted[sorted.length-1].totalScore||0).toFixed(1):'—'}</b></div></aside></div>
      <section class="section-title"><div><h2>Mock-test history</h2><p>Scores and accuracy are your entered results, not qualification predictions.</p></div></section>${sorted.length?`<div class="card data-table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Paper 1</th><th>Paper 2</th><th>Total</th><th>Attempt / accuracy</th><th>Weak units / lesson</th><th>Actions</th></tr></thead><tbody>${sorted.slice().reverse().map(x=>`<tr><td>${esc(x.date)}</td><td>${x.paper1Score===''||x.paper1Score==null?'—':esc(x.paper1Score)}</td><td>${x.paper2Score===''||x.paper2Score==null?'—':esc(x.paper2Score)}</td><td><b>${Number(x.totalScore||0).toFixed(1)}</b></td><td>${esc(x.attempted||0)} attempted<br>${x.accuracy==null?'—':`${Number(x.accuracy).toFixed(1)}%`}</td><td>${esc((x.weakUnits||[]).join(', ')||'—')}<br><span class="muted">${esc(x.lessons||'')}</span></td><td><div class="table-actions"><button data-action="edit-mock" data-id="${attr(x.id)}">Edit</button><button data-action="delete-mock" data-id="${attr(x.id)}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`:`<div class="card card-pad"><div class="filter-empty">No mock results yet.</div></div>`}`;
  }
  function mockChart(tests){
    const data=tests.slice(-8);const max=Math.max(1,...data.map(x=>Number(x.totalScore)||0));
    return `<div class="chart-wrap"><div class="chart-bars" role="img" aria-label="Mock total scores across the last ${data.length} recorded tests">${data.map(x=>`<div class="chart-bar" title="${esc(x.date)} · ${Number(x.totalScore||0).toFixed(1)} points"><span style="height:${Math.max(4,Number(x.totalScore||0)/max*100)}%"></span><small>${esc(x.date?.slice(5)||'')}</small></div>`).join('')}</div><div class="small-text" style="margin-top:7px">Each bar is a recorded total; scores use the marking settings only when paper scores are not entered.</div></div>`;
  }
  function formatClock(ms){const total=Math.max(0,Math.floor(ms/1000));const h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function currentTimerMs(){const t=state.timer||{};return Number(t.elapsedMs||0)+(t.status==='running'&&t.startedAt?Math.max(0,Date.now()-Number(t.startedAt)):0);}
  function updateTimerDisplay(){const el=$('#timer-display');if(el)el.textContent=formatClock(currentTimerMs());const status=$('#timer-status');if(status&&state)status.textContent=state.timer.status==='running'?'Timer running · elapsed time is saved locally but logged only when stopped.':state.timer.status==='paused'?'Timer paused · resume or stop to save a session.':'Not running · incomplete timers are never added to study hours.';}
  function renderTimer(){
    const t=state.timer||{};const running=t.status==='running',paused=t.status==='paused';const last=[...state.sessions].sort((a,b)=>(b.startedAt||'').localeCompare(a.startedAt||'')).slice(0,8);
    const todayMin=C.dailyMinutes(state,today());const weekStart=C.addDays(today(),-6);const weekMin=state.sessions.filter(s=>s.date>=weekStart&&s.date<=today()).reduce((sum,s)=>sum+Number(s.durationMinutes||0),0);
    return `<div class="content-grid"><section class="card timer-panel"><div class="eyebrow">Focused study timer</div><div id="timer-display" class="timer-display">${formatClock(currentTimerMs())}</div><p id="timer-status" class="timer-subtitle">${running?'Timer running · elapsed time is saved locally but logged only when stopped.':paused?'Timer paused · resume or stop to save a session.':'Not running · incomplete timers are never added to study hours.'}</p><div class="form-grid three" style="width:100%;max-width:720px;text-align:left;margin-bottom:17px"><div class="field"><label>Assign session to</label><select data-action="timer-field" data-field="paper"><option ${t.paper==='Paper 1'?'selected':''}>Paper 1</option><option ${t.paper==='Paper 2'?'selected':''}>Paper 2</option></select></div><div class="field"><label>Session type</label><select data-action="timer-field" data-field="category">${[['new-learning','New learning'],['pyq','PYQs'],['revision','Revision'],['mock','Mock test']].map(([v,l])=>`<option value="${v}" ${t.category===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label>Unit (optional)</label><select data-action="timer-field" data-field="unitId"><option value="">Not assigned</option>${unitDefs.filter(u=>t.paper==='Paper 1'?u.id.startsWith('p1'):u.id.startsWith('p2')).map(u=>`<option value="${u.id}" ${t.unitId===u.id?'selected':''}>${u.number}. ${esc(u.title)}</option>`).join('')}</select></div><div class="field"><label>Plan</label><select data-action="timer-field" data-field="planId"><option value="60" ${t.planId==='60'?'selected':''}>60-day</option><option value="15" ${t.planId==='15'?'selected':''}>15-day emergency</option></select></div><div class="field"><label>Study day</label><select data-action="timer-field" data-field="day">${(state.plans[t.planId||'60']||[]).map(d=>`<option value="${d.day}" ${Number(t.day)===d.day?'selected':''}>Day ${d.day}</option>`).join('')}</select></div></div><div class="timer-actions">${!running&&!paused?`<button class="button" type="button" data-action="timer-start">${icon('clock')} Start session</button>`:''}${running?`<button class="button secondary" type="button" data-action="timer-pause">Pause</button><button class="button" type="button" data-action="timer-stop">Stop &amp; save session</button>`:''}${paused?`<button class="button" type="button" data-action="timer-resume">Resume</button><button class="button secondary" type="button" data-action="timer-stop">Stop &amp; save session</button>`:''}</div><p class="disclaimer">Only a stopped session is written to study-hour reports. If the page closes while running, the timer state is restored safely; stopping later creates one session.</p></section>
      <aside class="card form-card"><h2>Focused time</h2><p>Session totals come only from saved timer sessions.</p><div class="report-stat-row"><span>Today</span><b>${(todayMin/60).toFixed(1)} h</b></div><div class="report-stat-row"><span>Last 7 days</span><b>${(weekMin/60).toFixed(1)} h</b></div><div class="report-stat-row"><span>All time</span><b>${(C.totalStudyMinutes(state)/60).toFixed(1)} h</b></div><div class="report-stat-row"><span>Current streak</span><b>${C.streakDays(state)} day${C.streakDays(state)===1?'':'s'}</b></div></aside></div>
      <section class="section-title"><div><h2>Recent sessions</h2><p>${state.sessions.length} saved session${state.sessions.length===1?'':'s'}.</p></div></section>${last.length?`<div class="card card-pad"><div class="session-list">${last.map(s=>`<div class="session-row"><div><b>${esc(s.paper)} · ${esc(typeName(s.category))}</b><small>${esc(s.date)}${s.unitId?` · ${esc(unitTitle(s.unitId))}`:''} · Day ${s.day||'—'}</small></div><div style="text-align:right"><b>${Number(s.durationMinutes||0)} min</b><small>${esc(s.startTime||'')}–${esc(s.endTime||'')}</small></div></div>`).join('')}</div></div>`:`<div class="card card-pad"><div class="filter-empty">Start and stop a study timer to build your session log.</div></div>`}`;
  }
  function collectedNotes(){
    const rows=[];
    (state.notes||[]).forEach(n=>rows.push({id:n.id,kind:'note',title:n.title,category:n.category||'General',body:n.body||'',updatedAt:n.updatedAt||n.createdAt||'',paper:n.paper||'',unitId:n.unitId||'',topic:n.topic||''}));
    (state.concepts||[]).filter(c=>c.notes&&c.notes.trim()).forEach(c=>rows.push({id:`concept:${c.id}`,kind:'concept',title:c.title,category:'Concept note',body:c.notes,updatedAt:c.lastStudied||c.completedAt||'',paper:c.paper,unitId:c.unitId,topic:c.topic}));
    Object.entries(state.topicNotes||{}).filter(([,body])=>body&&body.trim()).forEach(([key,body])=>{const [unitId,topic]=key.split('::');rows.push({id:`topic:${key}`,kind:'topic',title:topic||'Topic note',category:'Topic note',body,updatedAt:'',paper:unitId?.startsWith('p1')?'Paper 1':'Paper 2',unitId,topic});});
    Object.entries(state.plans||{}).forEach(([planId,days])=>days.forEach(d=>{if(d.notes&&d.notes.trim())rows.push({id:`day:${planId}:${d.day}`,kind:'day',title:`Day ${d.day}: ${d.title}`,category:'Day note',body:d.notes,updatedAt:'',paper:'',unitId:'',topic:''});}));
    return rows;
  }
  function renderNotes(){
    const notes=collectedNotes().filter(n=>!app.noteQuery||`${n.title} ${n.category} ${n.body} ${n.topic}`.toLowerCase().includes(app.noteQuery.toLowerCase()));
    const selected=app.selectedNoteId?state.notes.find(n=>n.id===app.selectedNoteId):null;
    const categoryOptions=['Researchers and contributions','Theory comparison','Brain structures and neurotransmitters','Statistics formulas and test selection','Psychometrics','Experiments and findings','Frequently confused concepts','PYQ / mock mistake','General'];
    return `${pageHeader('Revision notebook','Keep short revision sheets in one place. Concept, topic and day notes also appear in the searchable index below.',`<button class="button secondary small" data-action="export-notebook">Export notebook</button>`)}<div class="notes-grid"><section class="card form-card"><div class="card-title-row"><div><h2>${selected?'Edit note':'New revision note'}</h2><p>Optional tags make quick revision easier.</p></div></div><form data-form="note" class="form-grid"><input type="hidden" name="id" value="${attr(selected?.id||'')}"><div class="field span-2"><label for="note-title">Title</label><input id="note-title" name="title" required maxlength="160" value="${attr(selected?.title||'')}" placeholder="e.g., Reliability vs validity"></div><div class="field"><label for="note-category">Revision sheet type</label><select id="note-category" name="category">${categoryOptions.map(x=>`<option ${selected?.category===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="note-paper">Paper</label><select id="note-paper" name="paper"><option value="">Not assigned</option><option ${selected?.paper==='Paper 1'?'selected':''}>Paper 1</option><option ${selected?.paper==='Paper 2'?'selected':''}>Paper 2</option></select></div><div class="field span-2"><label for="note-topic">Unit / topic tags</label><input id="note-topic" name="topic" value="${attr(selected?.topic||'')}" placeholder="Optional unit, theorist or topic"></div><div class="field span-2"><label for="note-body">Note</label><textarea id="note-body" name="body" required placeholder="Write in your own words. Keep it concise and easy to retrieve.">${esc(selected?.body||'')}</textarea></div><div class="form-actions span-2"><button class="button" type="submit">${selected?'Save note':'Add to notebook'}</button>${selected?`<button class="button secondary" type="button" data-action="clear-note-selection">Cancel edit</button><button class="button secondary" type="button" data-action="delete-note" data-id="${attr(selected.id)}">Delete</button>`:''}</div></form><p class="disclaimer">Standalone notes are editable here. To change a concept, topic or day note, open that checklist and edit its note field.</p></section>
      <section class="card"><div class="card-pad"><div class="field search-box"><label for="note-search">Search all notes</label>${icon('search')}<input id="note-search" type="search" data-action="note-search" value="${attr(app.noteQuery)}" placeholder="Researchers, formulas, mistakes…"></div></div><div class="note-list">${notes.length?notes.map(n=>`<button type="button" class="${selected?.id===n.id?'active':''}" data-action="select-note" data-id="${attr(n.id)}" data-kind="${attr(n.kind)}"><strong>${esc(n.title)}</strong><small>${esc(n.category)}${n.paper?` · ${esc(n.paper)}`:''}${n.topic?` · ${esc(n.topic)}`:''}</small><small>${esc(n.body.slice(0,140))}${n.body.length>140?'…':''}</small></button>`).join(''):`<div class="filter-empty">No notes match your search. Add a revision sheet or write a note inside a concept, topic or study day.</div>`}</div></section></div>`;
  }
  function renderReports(){
    const all=C.overallCompletion(state);const units=C.completionByUnit(state);const currentPlan=String(state.settings.activePlan||'60');const planSummary=C.planSummary(state,currentPlan);const remainingExam=C.parseDate(state.settings.examDate)?C.daysBetween(today(),state.settings.examDate):null;
    const ranked=Object.values(units).sort((a,b)=>a.percent-b.percent);const high=state.concepts.filter(c=>c.mandatory!==false&&c.priority==='High'&&c.status!=='completed');const tough=state.concepts.filter(c=>c.mandatory!==false&&c.difficulty==='Tough'&&c.status!=='completed');const marked=state.concepts.filter(c=>c.status==='needs_revision');
    const startWeek=C.addDays(today(),-6);const week=state.sessions.filter(s=>s.date>=startWeek&&s.date<=today()).reduce((sum,s)=>sum+Number(s.durationMinutes||0),0);const total=C.totalStudyMinutes(state);
    const dates=Array.from({length:7},(_,i)=>C.addDays(today(),i-6));const dayRows=dates.map(d=>({date:d,actual:C.dailyMinutes(state,d),planned:(state.plans[currentPlan]||[]).filter(x=>C.planDate(state,currentPlan,x.day)===d).reduce((s,x)=>s+Number(x.targetMinutes||0),0)}));const maxHours=Math.max(1,...dayRows.map(x=>x.actual));const plannedWeek=dayRows.reduce((sum,x)=>sum+x.planned,0);
    const pyqStats=C.pyqStats(state,{minAnswered:5});const meaningful=pyqStats.filter(x=>x.meaningful);const weak=C.quizWeakTopics(state,5).slice(0,5);const overdue=C.getOverduePlanItems(state,currentPlan).length;const due=C.dueRevisionBuckets(state);
    const mocks=[...state.mockTests].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    return `${pageHeader('Reports & analytics','Progress is calculated from mandatory concept tasks, not unit averages. Coverage, confidence, revision status, PYQ accuracy and mock scores remain separate measures.')}
      <section class="metric-grid">${renderMetric('Combined coverage',`${all.percent}%`,`${all.completed}/${all.total} mandatory concept tasks`,'chart')}${renderMetric('Study days',`${planSummary.completed}/${planSummary.planned}`,`${currentPlan}-day plan · status explicitly marked complete`,'calendar')}${renderMetric('Focused time',`${(total/60).toFixed(1)}h`,`${(week/60).toFixed(1)} h in the last 7 days`,'clock')}${renderMetric('Exam countdown',remainingExam===null?'—':remainingExam<0?'Past':`${remainingExam}d`,remainingExam===null?'Enter a confirmed date in Settings':remainingExam<0?'Update the saved date':'Based on your entered date','calendar')}</section>
      <section class="analytics-grid" style="margin-top:14px"><article class="card analytics-card"><div class="card-title-row"><div><h2>Completion by unit</h2><p>Weighted by actual mandatory concept counts.</p></div></div><div class="unit-bars">${ranked.map(u=>`<div class="unit-bar-row"><span title="${attr(u.unitTitle)}">${u.paper==='Paper 1'?'P1':'P2'} · ${esc(u.unitTitle)}</span><div class="progress-line thin"><span style="width:${u.percent}%"></span></div><b>${u.percent}%</b></div>`).join('')}</div></article>
      <article class="card analytics-card"><div class="card-title-row"><div><h2>Daily focused minutes</h2><p>Last 7 calendar days · unfinished timers excluded.</p></div></div><div class="chart-wrap"><div class="chart-bars">${dayRows.map(d=>`<div class="chart-bar" title="${esc(d.date)} · ${d.actual} focused min; ${d.planned} target min"><span style="height:${Math.max(d.actual?4:0,d.actual/maxHours*100)}%;background:${d.actual>=d.planned&&d.planned?'var(--brand-2)':'var(--accent)'}"></span><small>${esc(d.date.slice(5))}</small></div>`).join('')}</div><div class="small-text" style="margin-top:8px">Bar height is relative to the busiest day shown. Planned minutes use dates in the selected plan.</div></div><div class="report-stat-row"><span>Last 7 days planned</span><b>${(plannedWeek/60).toFixed(1)} h</b></div><div class="report-stat-row"><span>Last 7 days focused</span><b>${(week/60).toFixed(1)} h</b></div><div class="report-stat-row"><span>Planned vs actual</span><b>${plannedWeek?Math.round(week/plannedWeek*100):0}%</b></div></article>
      <article class="card analytics-card"><div class="card-title-row"><div><h2>Attention list</h2><p>Based on your checklist, not a test-weightage forecast.</p></div></div><div class="report-stat-row"><span>High-priority unfinished</span><b>${high.length}</b></div><div class="report-stat-row"><span>Tough unfinished</span><b>${tough.length}</b></div><div class="report-stat-row"><span>Marked needs revision</span><b>${marked.length}</b></div><div class="report-stat-row"><span>Overdue selected-plan items</span><b>${overdue}</b></div><div class="report-stat-row"><span>Revision tasks overdue / due today</span><b>${due.overdue.length} / ${due.due.length}</b></div></article>
      <article class="card analytics-card"><div class="card-title-row"><div><h2>PYQ accuracy</h2><p>Rows require at least 5 answered questions to show a percentage.</p></div></div>${meaningful.length?`<div class="list-rows">${meaningful.slice(0,8).map(x=>`<div class="report-stat-row"><span>${esc(x.paper)} · ${esc(unitTitle(x.unitId))}${x.topic?` · ${esc(x.topic)}`:''}</span><b class="${x.accuracy<.6?'accuracy-low':'accuracy-good'}">${Math.round(x.accuracy*100)}% · ${x.answered}</b></div>`).join('')}</div>`:`<div class="empty-inline">Not enough answered PYQ records yet. Accuracy appears after 5 entries per unit/topic grouping.</div>`}</article>
      <article class="card analytics-card"><div class="card-title-row"><div><h2>Weakest quiz topics</h2><p>Only topics with ≥5 recorded quiz questions.</p></div></div>${weak.length?`<div class="list-rows">${weak.map(x=>`<div class="report-stat-row"><span>${esc(x.paper)} · ${esc(x.topic)}</span><b class="${x.accuracy<.6?'accuracy-low':'accuracy-good'}">${Math.round(x.accuracy*100)}%</b></div>`).join('')}</div>`:`<div class="empty-inline">Add concept quiz correct/total scores before relying on topic accuracy.</div>`}</article>
      <article class="card analytics-card"><div class="card-title-row"><div><h2>Mock-test trend</h2><p>Raw scores from your entries; not a JRF prediction.</p></div></div>${mocks.length>=2?mockChart(mocks):`<div class="empty-inline">Record at least two mock results to view a trend.</div>`}<div class="report-stat-row"><span>Mocks logged</span><b>${mocks.length}</b></div></article></section>
      <section class="section-title"><div><h2>Priority repair list</h2><p>Work on the topics you have marked High or Tough; reschedule if today's target is unrealistic.</p></div><button class="button secondary small" data-action="navigate" data-view="syllabus">Open checklist</button></section><div class="analytics-grid"><article class="card form-card"><h2>High-priority unfinished · ${high.length}</h2>${high.length?`<div class="list-rows">${high.slice(0,8).map(c=>`<div class="list-row"><span class="tag high">High</span><span class="list-row-main"><strong>${esc(c.title)}</strong><small>${esc(c.paper)} · ${esc(c.unitTitle)}</small></span><button class="quiet-button" data-action="open-concept" data-id="${attr(c.id)}">Open</button></div>`).join('')}</div>`:`<div class="empty-inline">No high-priority mandatory concepts remain unfinished.</div>`}</article><article class="card form-card"><h2>Tough concepts to revisit · ${tough.length}</h2>${tough.length?`<div class="list-rows">${tough.slice(0,8).map(c=>`<div class="list-row"><span class="tag tough">Tough</span><span class="list-row-main"><strong>${esc(c.title)}</strong><small>${esc(c.paper)} · ${esc(c.unitTitle)}</small></span><button class="quiet-button" data-action="open-concept" data-id="${attr(c.id)}">Open</button></div>`).join('')}</div>`:`<div class="empty-inline">No tough mandatory concepts remain unfinished.</div>`}</article></div>
      <div class="notice warn" style="margin-top:15px"><span>${icon('alert')}</span><span><strong>No qualification prediction:</strong> mock trends and PYQ accuracy describe recorded practice only. They do not predict JRF eligibility. Verify examination dates and current rules in the official NTA bulletin.</span></div>`;
  }
  function renderSettings(){
    const intervals=state.settings.revisionIntervals||[1,3,7,14];
    return `${pageHeader('Settings & backups','Your data stays in this browser profile on this device. Export backups regularly if you clear browser storage or change phones.')}
      <div class="settings-grid"><section class="card settings-card"><h2>Dates &amp; daily targets</h2><p>Calendar dates recalculate from the start date. Individual day overrides remain until you clear them.</p><div class="form-grid"><div class="field"><label for="setting-start">Plan start date</label><input id="setting-start" type="date" data-action="settings-field" data-field="startDate" value="${attr(state.settings.startDate||'')}"></div><div class="field"><label for="setting-exam">Confirmed exam date</label><input id="setting-exam" type="date" data-action="settings-field" data-field="examDate" value="${attr(state.settings.examDate||'')}"><span class="hint">Leave blank until confirmed by NTA.</span></div><div class="field"><label for="setting-daily">Total daily target (minutes)</label><input id="setting-daily" type="number" min="0" max="720" step="5" data-action="settings-field" data-field="dailyTargetMinutes" value="${Number(state.settings.dailyTargetMinutes??210)}"></div><div class="field"><label for="setting-p1">Paper 1 target (minutes)</label><input id="setting-p1" type="number" min="0" max="360" step="5" data-action="settings-field" data-field="paper1TargetMinutes" value="${Number(state.settings.paper1TargetMinutes??50)}"></div><div class="field"><label for="setting-p2">Paper 2 target (minutes)</label><input id="setting-p2" type="number" min="0" max="480" step="5" data-action="settings-field" data-field="paper2TargetMinutes" value="${Number(state.settings.paper2TargetMinutes??160)}"></div></div><p class="disclaimer">The default combined target is 210 minutes (3 h 30 min), split as 50 min Paper 1 + 160 min Paper 2. Each study day also has its own editable target.</p></section>
      <section class="card settings-card"><h2>Spaced-revision intervals</h2><p>Intervals are measured from the date a concept is first completed. Changing them affects concepts completed from now on; existing scheduled dates stay intact.</p><div class="form-grid four">${[0,1,2,3].map(i=>`<div class="field"><label for="rev-int-${i}">Revision ${i+1} · days</label><input id="rev-int-${i}" type="number" min="1" max="365" data-action="settings-interval" data-index="${i}" value="${Number(intervals[i]??[1,3,7,14][i])}"></div>`).join('')}</div><p class="disclaimer">The 14-day review is skipped automatically if it falls on or after the exam date entered. You can schedule an additional review from any concept.</p></section>
      <section class="card settings-card"><h2>Mock-test marking settings</h2><p>Defaults mirror the recent official scheme (2 marks per correct answer, no negative marking); verify against the December 2026 NTA bulletin before relying on totals.</p><div class="form-grid"><div class="field"><label for="setting-marks">Marks per correct</label><input id="setting-marks" type="number" step="0.25" min="0" data-action="settings-field" data-field="marksPerCorrect" value="${Number(state.settings.marksPerCorrect??2)}"></div><div class="field"><label for="setting-negative">Negative marks per incorrect</label><input id="setting-negative" type="number" step="0.25" min="0" data-action="settings-field" data-field="negativeMarks" value="${Number(state.settings.negativeMarks??0)}"></div></div></section>
      <section class="card settings-card"><h2>Local data &amp; backups</h2><p>IndexedDB is the primary store. A small LocalStorage fallback is attempted if IndexedDB is unavailable.</p><div class="notice info" style="margin-bottom:13px"><span class="dot dot-green" style="margin-top:5px"></span><span>Current storage: <strong>${esc(dbBackend)}</strong>. Clearing site data, uninstalling the browser or changing devices can erase local progress. This PWA does not sync to cloud.</span></div><div class="backup-actions"><button class="button" type="button" data-action="export-json">Export full JSON backup</button><button class="button secondary" type="button" data-action="export-csv">Export tasks &amp; progress CSV</button><button class="button secondary" type="button" data-action="import-json">Import JSON backup</button><button class="button secondary" type="button" data-action="import-pyq-csv">Import PYQ CSV</button><button class="button secondary" type="button" data-action="navigate" data-view="notes">Export / search notes</button><input id="json-file" class="file-input" type="file" accept="application/json,.json"><input id="pyq-csv-file" class="file-input" type="file" accept=".csv,text/csv"></div><p class="disclaimer">Importing JSON replaces the current local dataset after validation and confirmation. PYQ CSV import appends valid rows. Export before replacing or resetting.</p></section>
      <section class="card settings-card"><h2>Reset local tracker</h2><p>This removes checklist progress, dates, notes, sessions, PYQs, revisions and mock results from this browser profile.</p><button class="button danger" type="button" data-action="reset-data">Reset and reseed everything</button></section>
      <section class="card settings-card"><h2>Official syllabus &amp; schedule</h2><p>Unit lists were checked against the current official UGC NET syllabus page/PDFs as accessed 10 Oct 2026. The official portal states its updated syllabi apply from June 2019 onwards; check for a December 2026 cycle-specific notice.</p><div class="source-list"><div class="source-item"><strong>Paper 1 · General Paper, Code 00</strong><a href="${D.PAPER1_SOURCE}" target="_blank" rel="noreferrer">Official PDF ↗</a></div><div class="source-item"><strong>Paper 2 · Psychology, Code 04</strong><a href="${D.PSY_SOURCE}" target="_blank" rel="noreferrer">Official PDF ↗</a></div><div class="source-item"><strong>UGC NET syllabus page</strong><a href="${D.OFFICIAL_PAGE}" target="_blank" rel="noreferrer">UGC syllabus portal ↗</a></div><div class="source-item"><strong>NTA examination schedule</strong><a href="https://ugcnet.nta.ac.in/" target="_blank" rel="noreferrer">Official NTA site ↗</a></div><div class="source-item"><strong>Psychology previous-paper collection</strong><a href="https://ndl.iitkgp.ac.in/cd_document/ugc_net/04_psychology" target="_blank" rel="noreferrer">NDLI collection ↗</a></div></div><div class="notice warn" style="margin-top:11px"><span>${icon('alert')}</span><span>Do not treat difficulty labels, topic priorities or plan pacing as guaranteed exam weightage. Follow the current NTA bulletin for schedule, marking and policy.</span></div></section></div>`;
  }
  function renderMore(){
    const cards=[['notes','Revision notebook','Researchers, formulas, comparisons and mistake notes','note'],['reports','Reports & analytics','Coverage, study time, accuracy and mock trends','chart'],['settings','Settings & backups','Dates, targets, revision intervals and data export','settings'],['install','Install & offline guide','Android home-screen installation and static hosting','calendar']];
    return `${pageHeader('More tools','Quick access to study utilities, personal data controls and installation help.')}<div class="quick-links">${cards.map(([view,title,desc,ico])=>`<button class="quick-link" data-action="navigate" data-view="${view}" style="min-height:110px">${icon(ico)}<span>${esc(title)}</span><small style="color:var(--muted);font-size:10px">${esc(desc)}</small></button>`).join('')}</div><div class="section-title"><div><h2>Preparation profile</h2><p>UGC NET December 2026 · JRF target · beginner-friendly, local-first.</p></div></div><div class="card card-pad"><div class="report-stat-row"><span>Selected plan</span><b>${state.settings.activePlan==='15'?'15-day emergency selective pass':'60-day priority-based plan'}</b></div><div class="report-stat-row"><span>Plan start</span><b>${esc(state.settings.startDate||'Not set')}</b></div><div class="report-stat-row"><span>Exam date</span><b>${esc(state.settings.examDate||'Not entered — check NTA')}</b></div><div class="report-stat-row"><span>Storage</span><b>${esc(dbBackend)} · this browser profile</b></div></div>`;
  }
  function renderInstall(){
    return `${pageHeader('Install & offline guide','This project is a real PWA with a manifest, service worker and local icons. It has not been installed or deployed for you.')}
      <div class="notice warn" style="margin-bottom:14px"><span>${icon('alert')}</span><span><strong>Important:</strong> opening <code>index.html</code> directly with <code>file://</code> is not enough for normal PWA installation. Serve it over HTTPS (or use localhost for development). No login, paid API or backend is needed.</span></div>
      <div class="analytics-grid"><section class="card form-card"><h2>Install on Android</h2><div class="install-steps"><div class="install-step"><strong>Host the project over HTTPS</strong><p>Deploy this folder to GitHub Pages, Netlify or another static HTTPS host. The tracker uses only local files and browser storage; no server-side database is required.</p></div><div class="install-step"><strong>Open the HTTPS URL in Chrome on Android</strong><p>Load the app once while online so the service worker can cache the offline application shell. Use the same browser profile where you want the saved progress.</p></div><div class="install-step"><strong>Install the app</strong><p>In Chrome, open the ⋮ menu and choose <b>Install app</b> or <b>Add to Home screen</b>. Confirm the prompt. Menu wording can vary by Chrome version.</p></div><div class="install-step"><strong>Test offline and back up</strong><p>Open the home-screen app once, then enable airplane mode and reload. Use Settings → Export full JSON backup regularly. Local data is not synced across devices.</p></div></div></section>
      <section class="card form-card"><h2>Run locally for development</h2><p>Python 3 is sufficient; no dependency install is needed.</p><code class="code-block">python3 -m http.server 8000 --bind 0.0.0.0</code><p>Visit <code>http://localhost:8000</code> on the same computer. Browsers treat localhost as a secure development context. A phone cannot use a computer's <code>localhost</code>; use the HTTPS preview/deployment URL or host both devices on a secure test server.</p><p>To test PWA install from a phone, use HTTPS. This project is configured to register the service worker at its relative path, including a GitHub Pages project subfolder.</p></section>
      <section class="card form-card"><h2>Free static deployment</h2><div class="install-steps"><div class="install-step"><strong>GitHub Pages</strong><p>Create a repository, add these project files at its root, push to GitHub, then choose <b>Settings → Pages → Deploy from a branch</b> and select the main branch/root. Wait for the published HTTPS link. Keep the manifest and service worker next to <code>index.html</code>.</p></div><div class="install-step"><strong>Netlify Drop</strong><p>Upload the project folder (or connect its Git repository) to Netlify. The static site is served over HTTPS with no backend configuration.</p></div></div><p class="disclaimer">Do not rename or move <code>manifest.webmanifest</code>, <code>sw.js</code>, <code>data.js</code>, <code>core.js</code>, <code>db.js</code>, <code>app.js</code>, styles or icons unless you also update their relative paths.</p></section>
      <section class="card form-card"><h2>Offline, updates and limits</h2><ul class="small-text" style="padding-left:18px;line-height:1.8"><li>The service worker caches the app shell and first-party icon assets with a versioned cache.</li><li>Tracker data is stored in IndexedDB on this device/browser profile (LocalStorage fallback may be used). It is not included in the offline cache.</li><li>When a new version waits, the app shows an update prompt; reload only after your latest data has saved.</li><li>Export JSON before clearing browser storage, reinstalling or changing devices.</li><li>External official syllabus links require an internet connection, but the core tracker works offline after its first successful load.</li></ul><button class="button secondary small" type="button" data-action="export-json">Export a backup now</button></section></div>`;
  }
  function moveConceptTo(planId,conceptId,targetDay,fromHint=0){
    const days=state.plans[String(planId)]||[];const target=Number(targetDay);let from=Number(fromHint)||findConceptDay(planId,conceptId);
    if(from&&target===from)return true;
    if(target===0){if(from){const f=C.planDay(state,planId,from);const i=f?.conceptIds.indexOf(conceptId)??-1;if(i>=0)f.conceptIds.splice(i,1);}return true;}
    const t=C.planDay(state,planId,target);if(!t)return false;
    if(from){const f=C.planDay(state,planId,from);const i=f?.conceptIds.indexOf(conceptId)??-1;if(i>=0)f.conceptIds.splice(i,1);}
    // Keep a concept in at most one day per plan after a reschedule.
    days.forEach(d=>{if(d.day!==target){d.conceptIds=d.conceptIds.filter(id=>id!==conceptId);}});
    if(!t.conceptIds.includes(conceptId))t.conceptIds.push(conceptId);
    return true;
  }
  function findTask(planId,dayNum,taskId){return C.planDay(state,planId,dayNum)?.tasks.find(t=>t.id===taskId)||null;}
  function setTaskDone(planId,dayNum,taskId,done){const task=findTask(planId,dayNum,taskId);if(!task)return false;task.done=!!done;task.completedAt=done?new Date().toISOString():'';return true;}
  function setConceptField(target,field,value){
    const c=C.getConcept(state,target);if(!c)return false;
    if(field==='status'){return C.setConceptStatus(state,target,value);}
    if(['estimatedMinutes','confidence','quizCorrect','quizTotal'].includes(field)){c[field]=value===''?'':Math.max(0,Number(value)||0);if(field==='confidence')c.confidence=Math.min(5,Number(c.confidence)||0);}
    else if(field==='lastStudied'||field==='nextRevisionDate'){c[field]=C.parseDate(value)?value:'';}
    else c[field]=value;
    return true;
  }
  function currentControlValue(el){return el.type==='checkbox'?el.checked:el.value;}
  function updateSimpleAction(el){
    const action=el.dataset.action;
    if(action==='concept-field')return setConceptField(el.dataset.id,el.dataset.field,currentControlValue(el));
    if(action==='task-field'){const t=findTask(state.settings.activePlan,el.dataset.day,el.dataset.taskId);if(!t)return false;const field=el.dataset.field;t[field]=field==='estimatedMinutes'?Math.max(0,Number(el.value)||0):el.value;return true;}
    if(action==='day-note'){const d=C.planDay(state,el.dataset.planId,el.dataset.day);if(!d)return false;d.notes=el.value;state.planNotes[`${el.dataset.planId}-${el.dataset.day}`]=el.value;return true;}
    if(action==='topic-note'){state.topicNotes[el.dataset.topickey]=el.value;return true;}
    if(action==='settings-field'){
      const field=el.dataset.field;let value=el.value;
      if(['dailyTargetMinutes','paper1TargetMinutes','paper2TargetMinutes','marksPerCorrect','negativeMarks'].includes(field))value=value===''?0:Number(value)||0;
      if(field==='startDate'||field==='examDate')value=C.parseDate(value)?value:'';
      state.settings[field]=value;
      if(field==='dailyTargetMinutes')state.settings.paper2TargetMinutes=Math.max(0,Number(value)-(Number(state.settings.paper1TargetMinutes)||0));
      if(field==='paper1TargetMinutes'||field==='paper2TargetMinutes')state.settings.dailyTargetMinutes=(Number(state.settings.paper1TargetMinutes)||0)+(Number(state.settings.paper2TargetMinutes)||0);
      if(['dailyTargetMinutes','paper1TargetMinutes','paper2TargetMinutes'].includes(field))for(const plan of ['60','15'])for(const day of state.plans[plan]||[])if(!day.targetCustomized)day.targetMinutes=Number(state.settings.dailyTargetMinutes)||0;
      return true;
    }
    if(action==='settings-interval'){const i=Number(el.dataset.index);const arr=[...(state.settings.revisionIntervals||[1,3,7,14])];arr[i]=Math.max(1,Number(el.value)||1);state.settings.revisionIntervals=arr;return true;}
    if(action==='day-date'){const d=C.planDay(state,el.dataset.planId,el.dataset.day);if(!d)return false;d.dateOverride=C.parseDate(el.value)?el.value:'';state.dayDateOverrides[`${el.dataset.planId}-${el.dataset.day}`]=d.dateOverride;return true;}
    if(action==='day-target'){const d=C.planDay(state,el.dataset.planId,el.dataset.day);if(!d)return false;d.targetMinutes=Math.max(0,Math.min(1440,Number(el.value)||0));d.targetCustomized=true;return true;}
    if(action==='day-status'){const d=C.planDay(state,el.dataset.planId,el.dataset.day);if(!d)return false;d.status=el.value;d.isRest=el.value==='rest';return true;}
    if(action==='task-toggle')return setTaskDone(state.settings.activePlan,el.dataset.day,el.dataset.taskId,el.checked);
    if(action==='move-task'){const from=Number(el.dataset.fromDay),to=Number(el.value);if(from===to)return false;return C.movePlanTask(state,el.dataset.planId,el.dataset.taskId,from,to);}
    if(action==='move-concept')return moveConceptTo(el.dataset.planId,el.dataset.id,el.value,el.dataset.fromDay);
    if(action==='timer-field'){state.timer[el.dataset.field]=el.value;if(el.dataset.field==='paper')state.timer.unitId='';if(el.dataset.field==='planId')state.timer.day=1;return true;}
    return false;
  }
  async function afterChange(message='Saved on this device.') {await persist(message);render();}
  function handleClick(e){
    const btn=e.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action;
    if(action==='navigate'){if(btn.dataset.tab){app.practiceTab=btn.dataset.tab;if(btn.dataset.tab==='timer'&&state.timer.status==='stopped'){state.timer.planId=String(state.settings.activePlan||'60');state.timer.day=Number(app.selectedDay||C.currentDayNumber(state,state.timer.planId));}}navigate(btn.dataset.view);return;}
    if(action==='continue-today'){const mode=String(state.settings.activePlan||'60');app.selectedDay=C.currentDayNumber(state,mode);navigate('plan');return;}
    if(action==='select-plan'){selectPlan(btn.dataset.mode);return;}
    if(action==='select-day'){app.selectedDay=Number(btn.dataset.day);render();return;}
    if(action==='go-plan-day'){const planId=String(btn.dataset.planId||state.settings.activePlan||'60');if(state.settings.activePlan!==planId){state.settings.activePlan=planId;state.ui.activePlan=planId;}app.selectedDay=Number(btn.dataset.day);navigate('plan');persist();return;}
    if(action==='open-syllabus-paper'){app.syllabusPaper=btn.dataset.paper||'Paper 2';app.syllabusUnit='all';app.syllabusDay='all';app.syllabusFilter='all';app.syllabusQuery='';navigate('syllabus');return;}
    if(action==='practice-tab'){app.practiceTab=btn.dataset.tab;render();return;}
    if(action==='toggle-details'){const target=document.getElementById(btn.dataset.target);if(target)target.open=!target.open;return;}
    if(action==='toggle-revision-form'){const form=document.getElementById(btn.dataset.target);if(form){const card=form.closest('.revision-card');card?.classList.toggle('show-form');}return;}
    if(action==='theme-toggle'){state.settings.theme=state.settings.theme==='dark'?'light':'dark';persist().then(render);return;}
    if(action==='import-json'){document.getElementById('json-file')?.click();return;}
    if(action==='import-pyq-csv'){document.getElementById('pyq-csv-file')?.click();return;}
    if(action==='export-json'){exportJSON();return;}
    if(action==='export-csv'){exportTasksCSV();return;}
    if(action==='export-pyq-csv'){exportPyqCSV();return;}
    if(action==='export-notebook'){exportNotebook();return;}
    if(action==='reset-data'){
      if(!confirm('Reset everything on this device? This permanently removes study progress, dates, notes, sessions, PYQs, revisions and mocks. Export a backup first if needed.'))return;
      state=D.createInitialState();app.selectedDay=C.currentDayNumber(state,'60');app.view='dashboard';app.selectedNoteId=null;window.TrackDB.clear().then(()=>persist('Tracker reset and reseeded.')).then(render);return;
    }
    if(action==='delete-plan-task'){
      const day=C.planDay(state,state.settings.activePlan,btn.dataset.day);if(!day)return;
      if(!confirm('Remove this optional plan task? Syllabus concepts and study history are not affected.'))return;
      day.tasks=day.tasks.filter(t=>t.id!==btn.dataset.taskId);persist('Plan task removed.').then(render);return;
    }
    if(action==='edit-pyq'){app.editingPyqId=btn.dataset.id;render();window.scrollTo({top:0,behavior:'smooth'});return;}
    if(action==='cancel-edit-pyq'){app.editingPyqId=null;render();return;}
    if(action==='delete-pyq'){
      if(!confirm('Delete this PYQ record?'))return;state.pyqs=state.pyqs.filter(q=>q.id!==btn.dataset.id);persist('PYQ record deleted.').then(render);return;
    }
    if(action==='edit-mock'){app.editingMockId=btn.dataset.id;render();window.scrollTo({top:0,behavior:'smooth'});return;}
    if(action==='cancel-edit-mock'){app.editingMockId=null;render();return;}
    if(action==='delete-mock'){
      if(!confirm('Delete this mock-test record?'))return;state.mockTests=state.mockTests.filter(m=>m.id!==btn.dataset.id);persist('Mock record deleted.').then(render);return;
    }
    if(action==='clear-note-selection'){app.selectedNoteId=null;render();return;}
    if(action==='select-note'){
      const id=btn.dataset.id,kind=btn.dataset.kind;
      if(kind==='note'){app.selectedNoteId=id;render();return;}
      if(kind==='concept'){const concept=C.getConcept(state,id.replace(/^concept:/,''));if(concept){app.syllabusPaper=concept.paper;app.syllabusUnit=concept.unitId;app.syllabusQuery=concept.title;app.syllabusFilter='all';navigate('syllabus');}return;}
      if(kind==='topic'){const key=id.replace(/^topic:/,'');const unitId=key.split('::')[0];app.syllabusPaper=unitId.startsWith('p1')?'Paper 1':'Paper 2';app.syllabusUnit=unitId;app.syllabusQuery=key.split('::')[1]||'';app.syllabusFilter='all';navigate('syllabus');return;}
      if(kind==='day'){const [,planId,day]=id.split(':');state.settings.activePlan=planId;app.selectedDay=Number(day);navigate('plan');return;}
    }
    if(action==='delete-note'){
      if(!confirm('Delete this revision note?'))return;state.notes=state.notes.filter(n=>n.id!==btn.dataset.id);app.selectedNoteId=null;persist('Note deleted.').then(render);return;
    }
    if(action==='open-concept'){const c=C.getConcept(state,btn.dataset.id);if(!c)return;app.syllabusPaper=c.paper;app.syllabusUnit=c.unitId;app.syllabusQuery=c.title;app.syllabusFilter='all';navigate('syllabus');return;}
    if(action==='schedule-manual-revision'){
      const c=C.getConcept(state,btn.dataset.id);if(!c)return;const proposed=C.addDays(today(),1);const date=prompt('Choose one additional revision date (YYYY-MM-DD):',proposed);if(date===null)return;if(!C.parseDate(date)){showToast('Enter a valid date in YYYY-MM-DD format.','error');return;}C.scheduleOneOffRevision(state,c.id,date,'Manually scheduled from concept details.');persist('Extra revision scheduled.').then(render);return;
    }
    if(action==='timer-start'){startTimer();return;}
    if(action==='timer-pause'){pauseTimer();return;}
    if(action==='timer-resume'){resumeTimer();return;}
    if(action==='timer-stop'){stopTimer();return;}
    if(action==='apply-update'){if(swRegistration?.waiting){reloadAfterUpdate=true;swRegistration.waiting.postMessage({type:'SKIP_WAITING'});}else showToast('No waiting update is available.');return;}
    if(action==='dismiss-update'){document.getElementById('update-banner').hidden=true;return;}
  }
  function handleInput(e){
    const el=e.target;const action=el.dataset.action;
    if(action==='syllabus-search'){app.syllabusQuery=el.value;render();return;}
    if(action==='note-search'){app.noteQuery=el.value;render();return;}
    if(['concept-field','task-field','day-note','topic-note'].includes(action)){updateSimpleAction(el);persistSoon();return;}
  }
  async function handleChange(e){
    const el=e.target;const action=el.dataset.action;if(!action)return;
    if(action==='syllabus-paper'){app.syllabusPaper=el.value;app.syllabusUnit='all';app.syllabusDay='all';render();return;}
    if(action==='syllabus-filter'){app.syllabusFilter=el.value;render();return;}
    if(action==='syllabus-unit'){app.syllabusUnit=el.value;render();return;}
    if(action==='syllabus-day'){app.syllabusDay=el.value;render();return;}
    if(action==='pyq-paper-select'){const unit=$('#pyq-unit');if(unit){const p=el.value;unit.innerHTML=unitOptions(p);};return;}
    if(action==='concept-toggle'){const c=C.getConcept(state,el.dataset.id);if(!c)return;C.setConceptStatus(state,c.id,el.checked?'completed':'not_started');await afterChange(el.checked?'Concept marked completed; revision dates scheduled separately.':'Concept reopened; existing revision history retained.');return;}
    if(action==='concept-field'){updateSimpleAction(el);await afterChange('Concept details saved.');return;}
    if(action==='task-toggle'){setTaskDone(state.settings.activePlan,el.dataset.day,el.dataset.taskId,el.checked);await afterChange(el.checked?'Plan task completed.':'Plan task reopened; it has not been discarded.');return;}
    if(action==='task-field'){updateSimpleAction(el);await afterChange('Plan task updated.');return;}
    if(action==='day-date'||action==='day-target'||action==='day-status'){updateSimpleAction(el);await afterChange('Study day updated.');return;}
    if(action==='day-note'||action==='topic-note'){updateSimpleAction(el);await persist('Note saved.');return;}
    if(action==='settings-field'){updateSimpleAction(el);await afterChange(el.dataset.field==='examDate'&&state.settings.examDate?'Exam date saved. Confirm it against the official NTA schedule.':'Settings saved.');return;}
    if(action==='settings-interval'){updateSimpleAction(el);await afterChange('Revision interval saved.');return;}
    if(action==='move-concept'){const ok=updateSimpleAction(el);await afterChange(ok?'Concept rescheduled.':'Concept could not be moved.');return;}
    if(action==='move-task'){const from=Number(el.dataset.fromDay),to=Number(el.value);if(from!==to){const ok=C.movePlanTask(state,el.dataset.planId,el.dataset.taskId,from,to);await afterChange(ok?'Plan task rescheduled; it remains incomplete if it was not checked.':'Task could not be moved.');}return;}
    if(action==='timer-field'){updateSimpleAction(el);await afterChange('Timer assignment saved.');return;}
    if(action==='pyq-csv-file'){await importPyqCsv(el.files?.[0]);el.value='';return;}
    if(action==='json-file'){await importJSONFile(el.files?.[0]);el.value='';return;}
  }
  async function handleSubmit(e){
    const form=e.target.closest('form[data-form]');if(!form)return;e.preventDefault();const kind=form.dataset.form;const fd=new FormData(form);const v=Object.fromEntries(fd.entries());
    if(kind==='pyq'){
      const data={id:app.editingPyqId||uid('pyq'),date:C.parseDate(v.date)?v.date:today(),paper:v.paper,unitId:v.unitId||'',topic:(v.topic||'').trim(),examYear:v.examYear?Number(v.examYear):'',identifier:(v.identifier||'').trim(),result:v.result||'unattempted',timeSeconds:v.timeSeconds?Number(v.timeSeconds):'',errorType:v.errorType||'',correctiveNote:(v.correctiveNote||'').trim(),reattemptDate:C.parseDate(v.reattemptDate)?v.reattemptDate:'',updatedAt:new Date().toISOString()};
      if(!['Paper 1','Paper 2'].includes(data.paper)||!['correct','incorrect','unattempted'].includes(data.result)){showToast('Check the paper and result fields.','error');return;}
      const i=state.pyqs.findIndex(q=>q.id===data.id);if(i>=0)state.pyqs[i]=data;else state.pyqs.push(data);app.editingPyqId=null;await afterChange(i>=0?'PYQ record updated.':'PYQ record saved.');return;
    }
    if(kind==='mock'){
      const data={id:app.editingMockId||uid('mock'),date:C.parseDate(v.date)?v.date:today(),paper1Score:v.paper1Score===''?'':Number(v.paper1Score),paper2Score:v.paper2Score===''?'':Number(v.paper2Score),attempted:v.attempted===''?'':Number(v.attempted),correct:v.correct===''?'':Number(v.correct),incorrect:v.incorrect===''?'':Number(v.incorrect),timeMinutes:v.timeMinutes===''?'':Number(v.timeMinutes),weakUnits:(v.weakUnits||'').split(',').map(x=>x.trim()).filter(Boolean),lessons:(v.lessons||'').trim(),updatedAt:new Date().toISOString()};
      data.totalScore=C.markMockScore(data,state.settings);const accuracy=C.mockAccuracy(data);data.accuracy=accuracy==null?null:Number(accuracy.toFixed(1));
      if(data.attempted!==''&&data.correct!==''&&data.incorrect!==''&&data.correct+data.incorrect>data.attempted){showToast('Correct + incorrect cannot exceed attempted questions.','error');return;}
      const i=state.mockTests.findIndex(x=>x.id===data.id);if(i>=0)state.mockTests[i]=data;else state.mockTests.push(data);app.editingMockId=null;await afterChange(i>=0?'Mock result updated.':'Mock result saved.');return;
    }
    if(kind==='note'){
      const id=v.id||uid('note');const old=state.notes.find(n=>n.id===id);const note={id,title:(v.title||'').trim(),category:v.category||'General',paper:v.paper||'',unitId:'',topic:(v.topic||'').trim(),body:(v.body||'').trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      if(!note.title||!note.body){showToast('Add a title and note text.','error');return;}const i=state.notes.findIndex(n=>n.id===id);if(i>=0)state.notes[i]=note;else state.notes.unshift(note);app.selectedNoteId=id;await afterChange(i>=0?'Note updated.':'Revision note added.');return;
    }
    if(kind==='add-plan-task'){
      const planId=String(form.dataset.planId);const day=C.planDay(state,planId,form.dataset.day);if(!day)return;const title=(v.title||'').trim();if(!title)return;
      day.tasks.push({id:uid(`task-${planId}-${day.day}`),title,paper:v.paper||'Paper 2',unitId:'',topic:'',subtopic:'',taskType:v.taskType||'practice',estimatedMinutes:Math.max(0,Number(v.minutes)||0),done:false,notes:'',source:'User-created',mandatory:false});await afterChange('Custom plan task added.');return;
    }
    if(kind==='revision-complete'){
      const conf=Number(v.confidenceAfter)||0;const still=form.querySelector('[name="stillUnclear"]')?.checked||false;const ok=C.completeRevision(state,form.dataset.id,{confidenceAfter:conf,notes:(v.notes||'').trim(),stillUnclear:still});if(!ok){showToast('Revision is not available.','error');return;}await afterChange(still?'Revision saved; one retry is scheduled for tomorrow.':'Revision history saved.');return;
    }
  }
  function startTimer(){
    if(state.timer.status==='running'){showToast('Timer is already running.');return;}
    state.timer.status='running';state.timer.startedAt=Date.now();state.timer.elapsedMs=Number(state.timer.elapsedMs)||0;
    state.timer.planId=String(state.timer.planId||state.settings.activePlan||'60');state.timer.day=Number(state.timer.day||app.selectedDay||C.currentDayNumber(state,state.timer.planId));
    persist('Timer started.').then(render);startTick();
  }
  function pauseTimer(){if(state.timer.status!=='running')return;state.timer.elapsedMs=currentTimerMs();state.timer.status='paused';state.timer.startedAt=null;persist('Timer paused; not logged yet.').then(render);}
  function resumeTimer(){if(state.timer.status!=='paused')return;state.timer.status='running';state.timer.startedAt=Date.now();persist('Timer resumed.').then(render);startTick();}
  function stopTimer(){
    const t=state.timer;if(!t||t.status==='stopped'){showToast('No active timer to stop.');return;}
    const elapsed=currentTimerMs();if(elapsed<30000){state.timer={...t,status:'stopped',startedAt:null,elapsedMs:0};persist('Short session discarded; no study record was created.').then(render);return;}
    const end=new Date();const start=new Date(end.getTime()-elapsed);const duration=Math.max(1,Math.round(elapsed/60000));
    const session={id:uid('session'),date:C.TODAY(start),paper:t.paper||'Paper 2',category:t.category||'new-learning',unitId:t.unitId||'',planId:String(t.planId||state.settings.activePlan||'60'),day:Number(t.day)||1,durationMinutes:duration,durationSeconds:Math.round(elapsed/1000),startedAt:start.toISOString(),endedAt:end.toISOString(),startTime:start.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),endTime:end.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
    state.sessions.push(session);state.timer={...t,status:'stopped',startedAt:null,elapsedMs:0};persist(`Saved a ${duration}-minute focused session.`).then(render);
  }
  function startTick(){if(window.__studyTimerInterval)return;window.__studyTimerInterval=setInterval(()=>{if(state?.timer?.status==='running')updateTimerDisplay();else{clearInterval(window.__studyTimerInterval);window.__studyTimerInterval=null;}},1000);}
  function parseCsv(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
      else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell='';}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=ch;
    }
    if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    return rows.filter(r=>r.some(v=>String(v).trim()!=='')).map(r=>r.map(v=>String(v).trim()));
  }
  function exportCSVRows(headers,rows,filename){const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;const csv=[headers,...rows].map(r=>r.map(quote).join(',')).join('\r\n');downloadBlob(csv,'text/csv;charset=utf-8',filename);}
  function exportPyqCSV(){const h=['Date','Paper','Unit','Topic','ExamYear','Identifier','Result','TimeSeconds','ErrorType','CorrectiveNote','ReattemptDate'];exportCSVRows(h,state.pyqs.map(q=>[q.date,q.paper,unitTitle(q.unitId),q.topic,q.examYear,q.identifier,q.result,q.timeSeconds,q.errorType,q.correctiveNote,q.reattemptDate]),`ugc-net-pyq-log-${today()}.csv`);showToast('PYQ CSV exported.');}
  function exportTasksCSV(){
    const h=['TaskID','Paper','UnitID','Unit','Topic','Subtopic','Concept','LearningTarget','Priority','Difficulty','StudyValue','TaskType','EstimatedMinutes','Status','Mandatory','Confidence','QuizCorrect','QuizTotal','LastStudied','CompletedAt','NextRevisionDate','Plan60Day','Plan15Day','Source','Notes'];
    const rows=state.concepts.map(c=>[c.id,c.paper,c.unitId,c.unitTitle,c.topic,c.subtopic,c.title,c.learningTarget,c.priority,c.difficulty,c.studyValue,c.taskType,c.estimatedMinutes,c.status,c.mandatory,c.confidence,c.quizCorrect,c.quizTotal,c.lastStudied,c.completedAt,c.nextRevisionDate,findConceptDay('60',c.id),findConceptDay('15',c.id),c.source,c.notes]);
    for(const planId of ['60','15']) for(const day of state.plans[planId]||[]) for(const t of day.tasks||[]) rows.push([t.id,t.paper||'',t.unitId||'',unitTitle(t.unitId),t.topic||'',t.subtopic||'',t.title||'',t.notes||'', '', '', '',t.taskType||'',t.estimatedMinutes||0,t.done?'completed':'not_started',false,'','','','',t.completedAt||'','',planId==='60'?day.day:'',planId==='15'?day.day:'',t.source||'Plan task',t.notes||'']);
    exportCSVRows(h,rows,`ugc-net-study-progress-${today()}.csv`);showToast('Task, plan-task and progress CSV exported.');
  }
  function exportJSON(){const blob=JSON.stringify(state,null,2);downloadBlob(blob,'application/json;charset=utf-8',`ugc-net-jrf-backup-${today()}.json`);showToast('Full JSON backup exported.');}
  function exportNotebook(){
    const notes=collectedNotes();const lines=['UGC NET JRF revision notebook',`Exported ${today()}`,''];notes.forEach(n=>lines.push(`## ${n.title}`,`${n.category}${n.paper?` · ${n.paper}`:''}${n.topic?` · ${n.topic}`:''}`,n.body,'','---',''));
    downloadBlob(lines.join('\n'),'text/plain;charset=utf-8',`ugc-net-revision-notebook-${today()}.txt`);showToast('Notebook exported as plain text.');
  }
  function downloadBlob(content,type,filename){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  async function importJSONFile(file){
    if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());const valid=C.validateBackup(parsed);if(!valid.ok){showToast(`Import rejected: ${valid.error}`,'error');return;}
      const count=state.concepts.filter(c=>c.status==='completed').length;
      if(!confirm(`This valid ${file.name} backup contains ${parsed.concepts.length} concepts. Importing will replace all current local data${count?` (including ${count} completed concepts)`:''}. Export first if you want to keep a copy. Continue?`))return;
      state=C.hydrateImported(parsed);app.selectedDay=C.currentDayNumber(state,state.settings.activePlan||'60');app.view='dashboard';app.selectedNoteId=null;await persist('Backup restored successfully.');render();
    }catch(error){showToast(`Import failed: ${error.message||'invalid JSON'}`,'error');}
  }
  async function importPyqCsv(file){
    if(!file)return;
    try{
      const rows=parseCsv(await file.text());if(rows.length<2){showToast('CSV has no data rows.','error');return;}
      const headers=rows[0].map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,''));const col=(r,...names)=>{for(const n of names){const i=headers.indexOf(n.toLowerCase().replace(/[^a-z0-9]/g,''));if(i>=0)return r[i]||'';}return '';};
      const imported=[];let skipped=0;
      for(const r of rows.slice(1)){
        const paper=col(r,'Paper');const result=col(r,'Result').toLowerCase();const date=col(r,'Date');
        if(!['Paper 1','Paper 2'].includes(paper)||!['correct','incorrect','unattempted'].includes(result)||!C.parseDate(date)){skipped++;continue;}
        const u=unitDefs.find(x=>x.id===col(r,'UnitID'))||unitDefs.find(x=>x.title.toLowerCase()===col(r,'Unit').toLowerCase()&&x.id.startsWith(paper==='Paper 1'?'p1':'p2'));
        imported.push({id:uid('pyq'),date,paper,unitId:u?.id||'',topic:col(r,'Topic'),examYear:col(r,'ExamYear')?Number(col(r,'ExamYear')):'',identifier:col(r,'Identifier'),result,timeSeconds:col(r,'TimeSeconds')?Number(col(r,'TimeSeconds')):'',errorType:col(r,'ErrorType'),correctiveNote:col(r,'CorrectiveNote'),reattemptDate:C.parseDate(col(r,'ReattemptDate'))?col(r,'ReattemptDate'):'',updatedAt:new Date().toISOString()});
      }
      if(!imported.length){showToast(`No valid PYQ rows found${skipped?`; ${skipped} skipped`:''}.`,'error');return;}
      if(!confirm(`Append ${imported.length} valid PYQ record(s) from ${file.name}${skipped?` (${skipped} invalid row(s) will be skipped)`:''}? Existing records will not be overwritten.`))return;
      state.pyqs.push(...imported);await persist(`${imported.length} PYQ record(s) imported${skipped?`; ${skipped} skipped`:''}.`);render();
    }catch(error){showToast(`CSV import failed: ${error.message||'could not read file'}`,'error');}
  }
  function registerServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    const secure=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';if(!secure)return;
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
      swRegistration=reg;
      if(reg.waiting&&navigator.serviceWorker.controller)document.getElementById('update-banner').hidden=false;
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)document.getElementById('update-banner').hidden=false;});});
    }).catch(()=>{/* App remains usable online; offline install is unavailable until served correctly. */});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadAfterUpdate)window.location.reload();});
  }
  function keydown(e){if((e.key==='Enter'||e.key===' ')&&e.target.id==='header-countdown'){e.preventDefault();navigate('settings');}}
  async function init(){
    try{
      const loaded=await window.TrackDB.load();dbBackend=loaded.backend;
      if(loaded.value){
        const v=C.validateBackup(loaded.value);if(v.ok)state=C.hydrateImported(loaded.value);else{state=D.createInitialState();showToast('Saved data could not be read; a fresh tracker was started.','error');}
      }else state=D.createInitialState();
      state.settings.activePlan=String(state.settings.activePlan||state.ui?.activePlan||'60');state.ui ||= {};state.ui.activePlan=state.settings.activePlan;
      app.selectedDay=C.currentDayNumber(state,state.settings.activePlan);
      if(state.timer?.status==='running')startTick();
      document.addEventListener('click',handleClick);document.addEventListener('change',handleChange);document.addEventListener('input',handleInput);document.addEventListener('submit',handleSubmit);document.addEventListener('keydown',keydown);
      const themeButton=$('#theme-toggle');themeButton?.addEventListener('click',()=>{state.settings.theme=state.settings.theme==='dark'?'light':'dark';persist().then(render);});
      render();await persist();registerServiceWorker();
    }catch(error){main.innerHTML=`<div class="card card-pad"><h1>Study tracker could not start</h1><p>${esc(error.message||'Unknown initialization error')}</p><p>Try refreshing. If this continues, export browser storage before resetting.</p></div>`;}
  }
  init();
})();
