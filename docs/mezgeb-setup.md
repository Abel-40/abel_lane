# Mezgeb setup (from your phone)

You do these steps once. Everything stays on free plans. Budget about 20 minutes.

You need:

- a Supabase account (supabase.com, free plan),
- access to the Cloudflare Worker `abel-lane` that hosts this portfolio,
- an authenticator app on your phone (Google Authenticator, Aegis, 2FAS or similar).

---

## 1. Create the database

1. In Supabase, tap **New project**. Pick a name (for example `mezgeb`), a strong database password (save it in your password manager), and the region closest to you. The Free plan is enough.
2. When the project is ready, open **SQL Editor** › **New query**.
3. Paste the whole of `supabase/migrations/0001_init.sql` from this repository and tap **Run**. It should finish with "Success. No rows returned".
4. Open another new query, paste the whole of `supabase/migrations/0002_people_goods_savings.sql` and tap **Run**. It adds money kept for others, credit given, stored goods, yearly savings and the daily spending limit. It keeps all existing data, and running it twice does no harm. **Already using Mezgeb?** Run only this file; the app shows "The database needs the 0002 update" until you do.
5. Optional but recommended: open a new query, paste `supabase/tests/rls.sql` and run it. The **Results** tab must show one row: **ALL CHECKS PASSED**. If a check fails, you get a red error starting with `FAIL` instead. It uses two throwaway users and rolls everything back, so it leaves nothing behind.

## 2. Turn off sign-ups and create your user

1. **Authentication › Sign In / Providers › Email**: turn **off** "Allow new users to sign up" and save. Nobody can create an account from the app or the API after this.
2. **Authentication › Users › Add user › Create new user**: enter your email and a long, unique password, tick **Auto Confirm User**, and create it.

## 3. Set the site URL

**Authentication › URL Configuration**: set **Site URL** to your portfolio's address, for example `https://your-domain.com`. Mezgeb does not send emails or use magic links, but Supabase uses this value as its default.

## 4. Check that authenticator codes are on

**Authentication › Multi-Factor** (or **Sign In / Providers › Multi-Factor**, depending on the dashboard version): make sure **TOTP (App Authenticator)** is enabled for both enrollment and verification. It is on by default on hosted projects.

## 5. Connect the app

1. In Supabase, open **Project Settings › API Keys** (or **Settings › API**). Copy:
   - the **Project URL** (`https://xxxx.supabase.co`),
   - the **publishable key** (`sb_publishable_…`) or the legacy **anon public** key.

   Never copy the `service_role` / **secret** key anywhere. Mezgeb does not need it.
2. In Cloudflare, open **Workers & Pages › abel-lane › Settings › Build › Variables and secrets** and add both:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable or anon key |

   They must be **build** variables, not the runtime "Variables and Secrets" of the Worker itself: `next build` bakes
   them into the pages. They are public by design; the database's Row-Level Security protects your data.
3. Trigger a new build (**Deployments › Retry build**, or push a commit to `main`). The variables only take effect
   after a fresh build. If you deploy from your computer instead (`pnpm run deploy`), put them in `.env.local` first.

## 6. First sign-in and your authenticator

1. Open `https://your-domain.com/mezgeb/login` on your phone. (From the portfolio: scroll to the very bottom; the faint dot right after "© 2026 Abel Addis" leads there.)
2. Sign in with the email and password from step 2.
3. Mezgeb shows a QR code. In your authenticator app, add an account by scanning it. If you are on the same phone, tap **Can't scan? Show the key** and type the key into the app instead.
4. Enter the 6-digit code. You are now signed in with two steps, and every later sign-in needs the code.
5. The setup wizard opens with your plan filled in. Check each step, and on **Accounts** enter what each account holds today as its opening balance. Tap **Save and start**.

## 7. Add a backup authenticator (do not skip)

Supabase has no recovery codes. If you lose the only device with your authenticator, you cannot sign in.

Go to **Settings › Security › Add backup authenticator** and scan the new QR code with a second device (an old phone, a tablet, or a password manager that supports TOTP). Enter its code to finish.

If you ever lose every authenticator: in Supabase, **Authentication › Users** › your user › delete its MFA factors. Then sign in again and enrol a new one.

## 8. Install it on your phone

Open `/mezgeb` in Chrome on Android, then **⋮ › Add to Home screen / Install app** (or **Settings › Install app** inside Mezgeb when Chrome offers it). It opens full-screen like a normal app.

On iPhone, use Safari: **Share › Add to Home Screen**.

---

## Keeping it healthy

- **The free database pauses after about a week without use.** Open Mezgeb at least once a week. If it does pause, open the Supabase dashboard and tap **Restore project**; your data is kept.
- **Back up monthly.** Use **Settings › Your data › Export backup** and keep the file somewhere safe (not only on the phone). Mezgeb reminds you on Home after 30 days. **Import backup** shows what will change before it writes anything; rows with the same id are replaced and nothing is deleted.
- **Locking.** Mezgeb signs out after the inactivity time you choose (default 5 minutes) and when it has been in the background longer than that. **Sign out everywhere** ends every session on every device.
- **What stays on the phone.** Only the app shell (page code, fonts, icons) is cached for speed and offline start. Your financial data is never cached; it is always read live from the database.
