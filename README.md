# StudyDesk — UGC NET Psychology JRF Preparation Tracker

A mobile-first, installable, offline-capable Progressive Web App for the UGC NET December 2026 preparation profile described in the project request. It has **no framework dependencies, no runtime CDN, no login, no paid API and no backend**. The project is plain HTML, CSS and JavaScript.

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

## Included features

- Complete official unit navigators: all 10 Paper 2 Psychology units and all 10 Paper 1 units.
- Priority-based 60-day schedule matching the supplied plan, with Paper 1 topics and rotating quantitative, logic, DI and comprehension practice alongside Paper 2.
- A separate 15-day emergency plan, labeled **selective coverage, not full-depth mastery**. Switching modes does not erase the other plan.
- Expandable unit → topic → subtopic → concept checklists; concept status, editable target/title, notes, source, priority, difficulty, value, minutes, confidence, quiz scores and dates.
- Editable start/exam dates, per-day date overrides, targets, day status, notes and rescheduling. Unfinished work stays unfinished until you check it.
- Spaced revisions (default 1, 3, 7, 14 days), revision history, confidence before/after and a one-retry “still unclear” path.
- PYQ/error log with manual entry and CSV import/export. No PYQ questions or answer keys are fabricated.
- Mock-test log, configurable marking settings, score trends, and a study timer that records only stopped sessions.
- Notebook, topic/day/concept notes, searchable reports, JSON backup/restore and task-progress CSV export.
- Light/dark themes, responsive mobile bottom navigation, large controls, Android icons, install guide and safe service-worker update prompt.

## Data model and progress calculations

- **IndexedDB-first:** one versioned app-state document is stored under the `ugc-net-jrf-tracker` database. If IndexedDB is unavailable, the app attempts a LocalStorage fallback. There is no cloud sync.
- Stable concept IDs are seeded in `data.js`. Each concept stores syllabus metadata and the user's status, notes, confidence, quiz entry and study/revision dates. Plan days hold concept references plus separate plan-task records for PYQ, revision, practice, mock and consolidation work.
- **Syllabus coverage** counts only mandatory concept records with status `completed`, divided by all mandatory concepts. `In progress`, `Needs revision`, PYQs, revisions, mock tests and day-status flags do not count as completed coverage. Optional supporting items are labeled and excluded from the denominator.
- Unit completion is calculated from that unit's actual mandatory child-concept count, not by averaging unit percentages. A unit is not complete just because one child is complete.
- Study days are counted separately from concepts and are complete only when the user explicitly sets their day status to `Completed`.
- Revision records are generated separately from first-time syllabus tasks. Re-marking a concept completed does not generate a second automatic revision set. A revision completed as “still unclear” schedules one retry for the next day if no retry is already pending.
- PYQ accuracy excludes unattempted questions and is shown only after at least 5 answered records in a paper/unit/topic grouping. Quiz accuracy is shown only after at least 5 quiz questions have been entered for that topic.
- Focused hours include only stopped timer sessions. A running or paused timer is preserved, but it is not reported as completed study until stopped. Timers shorter than 30 seconds are discarded.
- Mock totals use entered Paper 1 + Paper 2 scores when either is present; otherwise the tracker calculates from correct/incorrect counts using settings. The initial 2-marks/no-negative default reflects the recent official scheme available when built; verify the December 2026 NTA bulletin. No JRF qualification prediction is made.

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
- `data.js` — full syllabus structure, task seeds and 60-/15-day schedules.
- `core.js` — date, progress, revision, accuracy, backup validation and scheduling logic.
- `db.js` — IndexedDB/LocalStorage persistence.
- `manifest.webmanifest`, `sw.js`, `icons/` — install/offline PWA assets.
- `tests/core.test.js` — Node acceptance checks.

## Tests and remaining limitations

Run the automated logic/data checks with:

```bash
node tests/core.test.js
```

Also check syntax with `node --check app.js`, `node --check core.js`, and `node --check data.js`. The browser-facing app was served locally and checked with a temporary JSDOM harness across the main screens. The harness simulated an IndexedDB close/reopen and verified that a checked concept, its revision history, and both plan modes persisted. The built-in Node tests cover syllabus coverage, schedule structure/order, unique IDs, progress math, date overrides, revision generation, PYQ thresholds, JSON validation/migration and timer rollups. A physical Android install/offline round-trip, responsive visual inspection on a real narrow-screen browser, and service-worker cache behavior still require an HTTPS browser/device.
