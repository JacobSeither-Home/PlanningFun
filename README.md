# PlanningFun

Jacob's and his girlfriend's shared planner: save activity ideas, put them on a calendar, plan packing, reservations and meals for each one, and keep a watch list of movies and shows.

**Live app:** https://jacobseither-home.github.io/PlanningFun/

## What's in it

- **Ideas.** Saved activities shown as ticket stubs, colored by category. Search, filter, and "Surprise us" to pick a random idea.
- **Calendar.** Month view. On a computer, drag ideas from the Someday tray onto a day, between days, or back to the tray. On a phone, tap a day, then "Pick an idea" or "New".
- **Maybe plans.** An activity can have several possible dates and times ("Symphony: Sat 7:30pm or Sun 3pm") without being booked. Each option shows faded and dashed on the calendar; "Choose" turns it into a real plan, and "Not doing it" clears the options but keeps the idea. Add one from a calendar day (New → Maybe), in any undated activity under Possible dates, or turn a booked plan into one with "Not sure yet? Make it a maybe".
- **Busy times.** On the calendar, "Mark busy" records when Jacob or Caroline is busy on their own, all day or for set hours, across one or several days. Each busy time draws as a bar positioned by time of day: for a multi-day stretch the start time applies to the first day, the end time to the last, and days between are full. Tapping a day shows that day's part ("From 3pm", "All day", "Until 11am").
- **Activity details.** Date, time (tap-only picker, no phone time wheel), place, cost, link and notes, plus Packing, Reservations and Meals checklists. "Do it again" copies an activity with its checklists reset.
- **Drinks.** Rate drinks you order around town from 1 (gross) to 10 (awesome). Each of you rates separately and the list ranks by your average. Types start with Old Fashioned (with spirit) and Beer (with type), and you can add more, like Sazerac.
- **Watch list.** Quick-add movies and shows, note where to watch them, check them off, and "Pick for tonight".
- **Keyboard.** Press N anywhere to add something.

## Stack

| Layer | Choice |
|---|---|
| App | React 18 + Vite, plain CSS |
| Install | PWA via vite-plugin-pwa (Add to Home Screen on iPhone) |
| Sign-in | Firebase Auth, email and password |
| Data | Firestore, shared under `spaces/main/` (activities, watch, drinks, drinkKinds, busy), cached offline on each device |
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
