# StudyDesk — UGC NET Psychology 15-Day Revision & Practice

A mobile-first, installable, offline-capable Progressive Web App for a 15-day UGC NET December 2026 Psychology revision and practice sprint. It has **no framework dependencies, no runtime CDN, no login, no paid API and no backend**. The project is plain HTML, CSS and JavaScript.

> This project has not been installed or deployed for you. Serve it over HTTPS (or `localhost` for development) before installing it as a PWA. Opening `index.html` as a `file://` URL is not enough for normal PWA installation.

## Start locally

Requirements: Python 3 (or any static file server). From the project folder:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Open `http://localhost:8000` in a desktop browser. The service worker can register on `localhost`. To install on an Android phone, deploy to HTTPS; a phone's `localhost` is the phone itself, not the development computer.

## Deploy for free over HTTPS

### GitHub Pages

1. Create a repository and add the project files at its root.
2. Push the `main` branch.
3. Open **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`.
4. Wait for the published HTTPS URL. The app's manifest, icon paths and service-worker scope are relative, so a project subdirectory is supported.

### Netlify

Upload the project folder to Netlify Drop or connect the repository. Netlify serves static files over HTTPS; no backend setup is needed.

For Android, open the HTTPS URL in Chrome, load it once online, then use **⋮ → Install app** or **Add to Home screen**. Menu wording varies by Chrome version. Open the installed app once before testing offline. External official-syllabus links still need internet; the tracker shell works offline after it is cached.

## What the app does

A **15-day revision and practice plan** for UGC NET Psychology (Paper 2). The 60-day plan has been removed.

- **15-day plan.** Days 1–12 take one unit (or half of a heavy unit) each: Unit 2 ×2, 3, 5 ×2, 4, 6, 7, 1, 8, 9, 10. Day 13 repairs wrong answers, day 14 is a timed mixed 50-question set, day 15 is a final pass. Every one of the 111 topics is scheduled exactly once.
- **Daily progress is derived from what you do**, not self-reported: topics marked revised, questions answered in that day's practice, flashcards due. You still mark a day complete yourself, and nothing is auto-completed or skipped.
- **Revise.** Per topic: one-line summary, objectives, key terms, exam traps, commonly-confused points, definitions, memory aids, comparison tables, diagrams, full notes and flashcards. Unit browser and title search.
- **Flashcards.** 279 cards on a 5-box schedule sized for 15 days (again = same day, then 1, 2, 4, 7 days). Missed cards return once more in the same session.
- **Practice.** 3,336 questions across all 10 units (conceptual, application, multi-statement, matching, assertion–reason, experimental analysis, numerical), each with an explanation and a reason for every option. Filter by unit, topic, difficulty and type; modes: new first, weakest + new, wrong only, flagged only. Optional exam mode hides feedback until the end. Unfinished sets resume after a reload. Wrong answers feed the repair days; answering one correctly removes it from the wrong list.
- Kept from the original tracker: official syllabus checklist (Paper 2 is linked to the plan day for its unit; Paper 1 is listed but not scheduled), PYQ log with CSV import/export, mock-test log, study timer, notebook, reports, JSON backup/restore, light/dark theme, offline install.

> **The practice questions are generated, not official past papers.** Every record in the supplied bank has `status: "draft"`. Treat explanations as study aids and check anything doubtful against your textbook. Log real PYQs in *Mocks & logs*.

## Content pack

`content/` is generated from the two source folders and committed, so the app needs nothing else to run. To rebuild after editing the source:

```bash
node tools/import-content.js ../psychology ../question-bank
```

The folders default to siblings of `StudyDesk/` (what you get from extracting `Desktop.zip` next to it). The importer reports how many records it skipped; 13 of the 3,349 source questions are skipped because they contain no question text, statements or lists at all. An earlier importer silently dropped 273 assertion–reason, matching and multi-statement questions and the statements of 339 multi-statement questions; both are fixed and covered by tests.

Offline: the shell and `content/index.json` are cached on first load; notes, questions and diagrams are cached as you open them. **Revise → Save for offline** downloads everything (about 5 MB) at once.

## Data model and progress calculations

- **IndexedDB-first**: one versioned (schema 3) app-state document in the `ugc-net-jrf-tracker` database, with a LocalStorage fallback. No cloud sync.
- New state: `topicRevised` (topic → date), `cardReviews` (card → box/due), `qStats` (question → attempts, correct, last result, flag), `dayPractice` (plan day → answered/correct), `quizHistory`, `activeQuiz`.
- **Migration from earlier saves/backups** (schema 1 or 2): the 60-day plan is dropped, the 15-day plan is rebuilt in the new structure, and your day status, notes, date overrides, custom targets, custom tasks, sessions, concept progress, revisions, PYQs and mocks are kept.
- Syllabus coverage, revision scheduling, PYQ accuracy thresholds, timer rules and mock totals are unchanged from the original tracker (see the app's Reports and Settings screens).
- Accuracy by unit is shown after 8+ answered questions; weak topics need 4+ attempts.

## Syllabus sources and accuracy note

The unit order and granular coverage are based on the official UGC NET Paper-I (Code 00) PDF and Psychology (Subject Code 04) PDF linked inside the app. The official syllabus portal described the updated syllabi as applicable from June 2019 onward when checked on **10 October 2026**:

- [UGC NET official syllabus page](https://www.ugcnetonline.in/syllabus-new.php)
- [Paper I · General Paper on Teaching & Research Aptitude](https://www.ugcnetonline.in/showPdf.php?p1=NTA_All_R_Syllabus/00-Paper-I/Paper-I_English.pdf)
- [Paper II · Psychology (Code 04)](https://ugcnetonline.in/NTA_All_R_Syllabus/04/Psychology_English.pdf)
- [Official NTA UGC NET site](https://ugcnet.nta.ac.in/)
- [NDLI UGC NET Psychology question-paper collection](https://ndl.iitkgp.ac.in/cd_document/ugc_net/04_psychology) (use as a source; questions are not bundled into the app)

Some checklist wording expands official syllabus bullets into study-sized learning actions. Items explicitly labeled “supplementary” are optional and do not count toward mandatory coverage. Priority, difficulty and “study value” labels are planning estimates, not guaranteed question frequency. Recheck the official NTA December 2026 bulletin for any syllabus, dates, marking-scheme or policy update.

## Backups and importing

- **Export full JSON** regularly. It contains all study state and is the recommended restore format.
- **Import JSON** validates the schema and IDs, then asks before replacing current local data.
- **Export tasks & progress CSV** exports the concept tracker and plan-day references.
- **PYQ CSV import** appends valid records; it never overwrites existing PYQ rows. Use the headers produced by **Export PYQ CSV** for easiest round-trips.
- Notebook text export includes standalone notes and day/topic/concept notes.
- Reset asks for explicit confirmation and reseeds the initial plans; it cannot be undone without a backup.

## Main project files

- `index.html`, `styles.css`, `app.js` — UI and interactions.
- `data.js` — syllabus structure and the 15-day plan definition.
- `learn.js` — content loading, question picking, scoring, flashcard scheduling and day progress (pure logic).
- `study-ui.js` — Today, 15-day plan, Revise, flashcard and Practice screens.
- `content/` — generated notes, questions and diagrams; `tools/import-content.js` rebuilds it.
- `core.js` — date, progress, revision, accuracy, backup validation and scheduling logic.
- `db.js` — IndexedDB/LocalStorage persistence.
- `manifest.webmanifest`, `sw.js`, `icons/` — install/offline PWA assets.
- `tests/core.test.js` — Node acceptance checks.

## Tests and remaining limitations

```bash
node tests/core.test.js     # plan structure, progress, dates, backups, v1/v2 -> v3 migration
node tests/learn.test.js    # content-pack integrity, question picking, scoring, flashcards, day progress
```

Also run `node --check` on `app.js`, `core.js`, `data.js`, `learn.js`, `study-ui.js`. Before release the app was exercised in headless Chromium at phone size (plan, topic reader, flashcards, a full quiz with reload-and-resume, exam mode, reports) and offline via the service worker. A physical Android install/offline round-trip is still worth doing on your own device over HTTPS.

Known limits: the question bank is AI-generated draft material (see above); questions are single-answer only; Paper 1 has no notes or question bank in this app; if you change the plan start date, "behind schedule" is judged against the new dates.
