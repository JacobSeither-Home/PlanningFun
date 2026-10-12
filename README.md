# PlanningFun

Jacob's and his girlfriend's shared planner: save activity ideas, put them on a calendar, plan packing, reservations and meals for each one, and keep a watch list of movies and shows.

**Live app:** https://jacobseither-home.github.io/PlanningFun/

## What's in it

- **Ideas.** Saved activities shown as ticket stubs, colored by category. Search, filter, and "Surprise us" to pick a random idea.
- **Calendar.** Month view. On a computer, drag ideas from the Someday tray onto a day, between days, or back to the tray. On a phone, tap a day, then "Pick an idea" or "New".
- **When (Booked or Maybe).** The top of every activity has a When section with a Booked / Maybe switch. Booked: start date and time, plus an optional end date and time for multi-day plans (a trip Fri 3pm – Sun 11am shows on every day; dragging it on the calendar moves the whole span). Maybe: several possible options, each with its own start date, time and optional end date; each shows faded on the calendar until you tap Choose. "Not doing it" clears the options but keeps the idea. Switching a booked plan to Maybe keeps its date as the first option.
- **Busy times.** On the calendar, "Mark busy" records when Jacob or Caroline is busy on their own, all day or for set hours, across one or several days. Each busy time draws as a bar positioned by time of day: for a multi-day stretch the start time applies to the first day, the end time to the last, and days between are full. Tapping a day shows that day's part ("From 3pm", "All day", "Until 11am").
- **Activity details.** When (above), place, cost, link and notes, plus Packing, Reservations and Meals checklists. "Duplicate" copies an activity (without its date) with its checklists reset.
- **Drinks.** Rate drinks you order around town from 1 (gross) to 10 (awesome). Each of you rates separately and the list ranks by your average. Types start with Old Fashioned (with spirit) and Beer (with type), and you can add more, like Sazerac.
- **Watch list.** Quick-add movies and shows, note where to watch them, check them off, and "Pick for tonight".
- **Votes on maybes.** Each possible date has ♡ J / ♡ C. Tap yours if it works for you; when you both do, it gets a gold ring and a ♥ on the calendar.
- **Both free.** Upcoming weekend days with nothing planned and nobody busy get a dashed gold ring ("both free" on computers).
- **Add to phone calendar.** On any dated plan, makes a calendar file with a reminder (1 hour before, or 9am the day before for all-day plans).
- **Saved checklists.** "Save this list" under Packing, Reservations or Meals; "Use a saved list" adds it to another activity. Manage them in Settings.
- **Watch list lookups.** With a free TMDB key in Settings, typing a title suggests matches with posters, and picking one fills in where it's streaming (US, via JustWatch). This app uses the TMDB API but is not endorsed or certified by TMDB.
- **Drinks by place.** Drinks → Places ranks bars by your average rating, with their best drink, plus a shared Want to try list.
- **Monthly colors.** Each month has its own accent pair and wallpaper tint (follows the month shown on the calendar). The menu, text and category colors stay fixed. Turn off per device in Settings (gear icon, or Settings in the sidebar).
- **Keyboard.** Press N anywhere to add something.

## Stack

| Layer | Choice |
|---|---|
| App | React 18 + Vite, plain CSS |
| Install | PWA via vite-plugin-pwa (Add to Home Screen on iPhone) |
| Sign-in | Firebase Auth, email and password |
| Data | Firestore, shared under `spaces/main/` (activities, watch, drinks, drinkKinds, busy, templates, tryPlaces, settings), cached offline on each device |
| Hosting | GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main` |

Firebase project: `planningfun` (Spark/free plan). If `src/lib/firebaseConfig.js` is ever emptied, the app falls back to **demo mode** and saves to the current browser only.

## One-time setup (done October 2026, kept for reference)

### 1. Turn on GitHub Pages
Repo → Settings → Pages → Source: **GitHub Actions**. Then re-run the latest "Deploy to GitHub Pages" workflow (Actions tab), or push any commit.

### 2. Create the Firebase project
1. [console.firebase.google.com](https://console.firebase.google.com) → Add project → `planningfun` (Analytics can be off).
2. **Authentication** → Get started → Sign-in method → enable **Email/Password**.
3. Authentication → Settings → Authorized domains → add `jacobseither-home.github.io`.
4. **Firestore Database** → Create database → production mode → region `us-central` (or nearest).
5. Firestore → **Rules** → paste the contents of `firestore.rules` → Publish. To let someone else in, add their email there and publish again.
6. Project settings (gear) → Your apps → **Web** (`</>`) → register `planningfun` → copy the `firebaseConfig` values into `src/lib/firebaseConfig.js` and commit.

The web config identifies the project; it isn't a password. Who can read and write data is enforced by the Firestore rules, which only allow the two listed emails.

### 3. Create your accounts
Open the live app → "First time here? Create an account". Each of you signs up once with the email listed in the rules.

### 4. Install on iPhone
Open the live app in **Safari** → Share → **Add to Home Screen**.

## Local development

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build in dist/
```
