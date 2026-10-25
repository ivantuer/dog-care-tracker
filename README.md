# Pet Care

Local-first PWA for tracking your pets' care (dogs, cats, fish, birds and more: vaccines, deworming, brushing, water changes, anything that repeats) and sharing it live with a second person. Same stack as Savings Tracker: Preact + signals, IndexedDB (idb-keyval), Vite + vite-plugin-pwa, vitest, a Cloudflare Worker for sync, GitHub Pages for hosting.

- **Today**: what is overdue, due today, coming up. One tap on ✓ logs it (with Undo); tap the card to backdate it, add a note, set the next date by hand, or skip.
- **Plan**: fully customisable routines. Name, emoji, colour, repeat every N days/weeks/months/years, remind N days before, which dogs it applies to, active months (tick season), first due date, notes, pause. 11 presets including Ukrainian vet staples.
- **History**: who did what and when; edit or delete entries.
- **Several dogs**, English and Ukrainian, light/dark/auto, accent colour.
- **Shared household, real time**: one person creates it and sends an invite link; the second joins. Changes show on both phones within a second (WebSocket), with a "Anna: Deworming · Rex" toast. Works offline and catches up when back online.
- **Reminders**: push notifications at the hour you choose, sent even when the app is closed. Plus a calendar export (.ics, repeating events with alerts) as a backup.
- **Private**: the server stores one encrypted blob (AES-GCM). The key lives only on your phones and in the invite link's `#` part, which browsers never send to a server.

```
npm install
npm run dev        # develop
npm test           # unit tests (vitest)
npm run build      # typecheck + production build in dist/ (deployed to GitHub Pages)
npm run preview    # serve the build
npm run icons      # regenerate the paw icons
npm run vapid      # generate push keys (once)
```

## Set up sync and reminders (once)

See [worker/README.md](worker/README.md). Without a server the app still works fully on one phone, with reminders while it is open and the calendar export.

## How it works

- Every record (dog, routine, log entry) has an `updatedAt`; deletions are tombstones. Merging two copies is commutative and idempotent, so two phones always converge, even after being offline.
- Next due = last log + interval, unless the entry has a hand-set date. Routines with active months wait for the season.
- Push has no content: the server only knows *when* to wake a phone. The service worker then reads the local data and writes the message in your language.
- Tests: scheduling and seasons, merge convergence, encryption and invites, Ukrainian plurals, calendar export, VAPID signing. `tests/worker.test.ts` runs two phones against a live server when `SYNC_URL` is set (`cd worker && npx wrangler dev --local`, then `SYNC_URL=http://localhost:8787 npm test`).

## Notes

- iPhone: install to the Home Screen (Share → Add to Home Screen) before enabling push; Safari only allows push for installed apps (iOS 16.4+).
- Calendars repeat on a fixed schedule; after a late completion, export again.
