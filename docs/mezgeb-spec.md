# Build "Mezgeb": my private personal finance PWA inside this portfolio

> Status: approved 2026-11-03 ("implement it in the way it's good"). Decisions are listed at the end under "Decisions log".

You are working in my existing Next.js portfolio project. Build a private, mobile-first personal finance app called **Mezgeb** (መዝገብ, "ledger") that lives under the route `/mezgeb`, installs on my phone as a PWA, stores data in **Supabase** (free tier), and is protected by **Supabase Auth with a mandatory authenticator-app code (TOTP)** and **Row-Level Security**.

Everything must stay on free tiers. The app must not change how the existing portfolio looks or behaves, except for one tiny hidden entry link.

Save this whole prompt as `docs/mezgeb-spec.md` before you start, and keep it updated if we change decisions.

**Visual design:** the screens are at https://claude.ai/artifact/RVkS2QvXxE8YHEJo2Y6Goa (my own private Claude artifact). Open it with your **Artifact tool** (`action: "read"` with that `url`), not a web fetch. Save the HTML you get back as `docs/mezgeb-design.html` in the repo so the design stays next to the code, and build every screen to match it. The page also contains the design tokens as a JSON block with the id `mezgeb-design-tokens`. If you cannot open the link, tell me immediately instead of guessing the design; sections 5 and 6 below describe it in words as a fallback.

---

## 0. First: inspect, then report, then wait

Before writing any code, inspect the project and report back to me in a short message:

1. Next.js version, App Router or Pages Router, TypeScript or not, package manager.
2. `next.config.*`: is it a static export (`output: 'export'`)? Any `runtime = 'edge'` usage?
3. How it deploys to Cloudflare: static output on Cloudflare Pages, the deprecated `@cloudflare/next-on-pages`, or `@opennextjs/cloudflare` on Workers. Show the build command and output directory.
4. Styling setup (Tailwind, CSS Modules, global CSS) and what the root layout renders (nav, footer, global styles) that could leak into `/mezgeb`.
5. Your implementation plan, phase by phase (section 9), and anything in this spec that conflicts with the project.

**Then stop and wait for my OK.** Do not migrate the deployment adapter, upgrade Next.js or restructure the portfolio unless I approve it.

---

## 1. Architecture (and why)

- **Client-side app with Supabase directly from the browser.** All reads and writes go through `@supabase/supabase-js` using the public anon/publishable key. Security comes from **Supabase Auth + Row-Level Security**, not from hidden URLs or server code. This works whether the portfolio is a static export or runs on Workers, so no deployment migration is needed.
- **No server secrets in the app.** Never put the `service_role` / secret key anywhere in this project. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the newer publishable key) are used, from environment variables. Add `.env.local` to `.gitignore` if it isn't there, and create `.env.example` with empty values.
- **Isolated from the portfolio.** Mezgeb has its own layout, fonts, styles and components, and it must not import portfolio components or depend on portfolio design tokens. Portfolio global CSS must not change Mezgeb's look:
  - If the root layout renders portfolio chrome (nav, footer), propose moving the existing pages into a `(site)` route group and creating a separate `(mezgeb)` group with its **own root layout** (Next.js supports multiple root layouts). Every existing URL must stay exactly the same. Ask me before doing this.
  - Otherwise use `app/mezgeb/layout.tsx` with a root element `.mz` and scope all Mezgeb styles to it (CSS Modules or a scoped stylesheet), resetting anything the portfolio's global CSS sets.
- **Hidden from search engines.** Add `<meta name="robots" content="noindex, nofollow">` to every Mezgeb page, keep `/mezgeb` out of the sitemap, and **do not** list it in `robots.txt` (that would advertise it).
- **Hidden entry from the portfolio.** Add one small, low-contrast link in the portfolio footer (for example, make the copyright year a link, or a 6 px dot) pointing to `/mezgeb/login`, with `aria-label="Private area"`. This is only a convenience. Real security is auth + MFA + RLS.

---

## 2. Authentication and security

- **Supabase Auth, email + password, plus required TOTP MFA.**
  - Public sign-up must be impossible. I will disable sign-ups in the Supabase dashboard and create my one user there. The app has **no sign-up screen**.
  - Login flow: email + password → if no TOTP factor is enrolled, show an **enrollment screen** (show the QR code returned by `supabase.auth.mfa.enroll({ factorType: 'totp' })`, then verify a code) → otherwise show the **6-digit code screen** (`mfa.challenge` + `mfa.verify`).
  - Encourage enrolling a **second TOTP factor** as a backup (Supabase does not provide recovery codes). Show this in Settings › Security.
  - Every Mezgeb page except login checks the session and requires `aal2` (`supabase.auth.mfa.getAuthenticatorAssuranceLevel()`), redirecting to login otherwise.
- **The database enforces MFA too.** Every RLS policy requires both the owner and AAL2: `user_id = auth.uid() and (auth.jwt() ->> 'aal') = 'aal2'`. A stolen password alone must not be able to read a single row.
- **Auto-lock:** sign out after N minutes of inactivity (setting, default 5) and when the app has been in the background longer than that.
- **Hide balances:** optional setting that blurs all amounts until tapped; protected accounts (role `emergency`, `savings`, `debt_fund`) always show `•••••` until tapped.
- **No secrets or financial data in logs, URLs or analytics.** Do not add analytics to Mezgeb.

---

## 3. Money rules

- Store every amount as **`bigint` minor units** (santim / cents) in a column named `*_minor`. Never use floats for money anywhere: parse user input as a string and convert to minor units with integer math.
- Every account has a **currency** (ISO code, default `ETB`). Amounts are shown with thousands separators and the symbol (`Br` for ETB, `$` for USD).
- **Hours of work** for any amount = `amount / (net_salary / work_hours_per_month)`, rounded to 1 decimal. Show it on expenses, wishes and monthly spending.
- Balances are **computed from transactions**, never typed in (except an opening balance per account).

---

## 4. Data model (Supabase / PostgreSQL)

Write it as `supabase/migrations/0001_init.sql`, plus a `README` section telling me to paste it into the Supabase SQL editor. Requirements for every table:

- `id uuid primary key default gen_random_uuid()`, `user_id uuid not null default auth.uid() references auth.users on delete cascade`, `created_at`, `updated_at` (with a trigger).
- RLS enabled **and forced**, with select/insert/update/delete policies using the owner + `aal2` rule above.
- **Ownership-safe foreign keys:** add `unique (id, user_id)` on parent tables and use composite foreign keys `(parent_id, user_id) references parent(id, user_id)`, so a row can never point to another user's account, category, trip and so on.
- Check constraints for every enum-like text column and for positive amounts.
- Views use `with (security_invoker = true)` so RLS applies.

Tables:

| Table | Purpose and key columns |
| --- | --- |
| `settings` | One row per user: `net_salary_minor`, `work_hours_per_month` (default 176), `payday_day`, `tithe_percent` (default 10), `base_currency` (`ETB`), `lock_minutes` (5), `hide_balances` (bool), `trading_loss_limit_minor` |
| `institutions` | Banks and wallets I can add any time: `name` (Commercial Bank of Ethiopia), `short_label` (CBE), `kind` (`bank`, `mobile_wallet`, `cash`, `other`), `color` |
| `accounts` | `institution_id`, `name` (Salary inbox), `role` (`salary_inbox`, `spending`, `tithe`, `trading`, `debt_fund`, `emergency`, `savings`, `usd`, `other`), `currency`, `opening_balance_minor`, `is_protected`, `is_archived`, `sort_order`, `notes`. Never store account numbers |
| `categories` | `name`, `kind` (`expense`, `income`), `group` (`personal`, `giving`, `trading`, `debt`, `work`, `other`), `is_need` (bool), `is_archived` |
| `transactions` | `occurred_on`, `kind` (`expense`, `income`, `transfer`), `account_id`, `to_account_id` (transfers only), `amount_minor > 0`, `category_id`, `note`, `is_want`, `goal_id`, `debt_id`, `trip_id`, `source` (`manual`, `payday`, `trading`, `debt`, `wish`). Constraints: transfers need a different `to_account_id`, and the other kinds must not have one |
| `payday_rules` | `name`, `kind` (`percent_of_salary`, `fixed`, `remainder`), `value`, `target_account_id`, `goal_id`, `debt_id`, `sort_order`, `is_active`. At most one `remainder` rule |
| `paydays` and `payday_allocations` | A payday records `received_on`, `amount_minor`, `account_id`. Each allocation stores `rule_id`, `amount_minor`, `transaction_id` (null until moved). Ticking an allocation creates the transfer transaction |
| `debts` | `counterparty`, `direction` (`i_owe`, `owed_to_me`, `gift_received`), `principal_minor`, `currency`, `started_on`, `target_on`, `priority`, `status` (`active`, `paid`), `notes`. Payments are transactions with `debt_id`. Gifts are recorded for memory only and are never counted as debt |
| `goals` | `name`, `kind` (`emergency`, `savings`, `usd`, `custom`), `target_minor` (nullable), `account_id`, `deadline`, `status`. Progress = sum of transactions tagged with the goal |
| `cities`, `trade_items` | Cities I trade between; items with `name`, `unit`, `target_margin_percent` (default 10) |
| `price_logs` | `item_id`, `city_id`, `price_minor`, `observed_on`, `note` |
| `trips` | `name`, `from_city_id`, `to_city_id`, `capital_account_id`, `started_on`, `closed_on`, `status` (`open`, `closed`) |
| `trip_lines` | `trip_id`, `item_id`, `quantity numeric(12,3)`, `buy_unit_minor`, `sell_unit_minor` (nullable until sold), `sold_on` |
| `trip_costs` | `trip_id`, `kind` (`transport`, `food`, `lodging`, `phone`, `loss`, `other`), `amount_minor`, `note` |
| `wishes` | `name`, `amount_minor`, `ready_at` (created_at + 48 hours), `status` (`waiting`, `bought`, `let_go`), `decided_at`, `transaction_id` |
| `fx_rates` | Manual rates for later USD use: `base`, `quote`, `rate numeric(18,8)`, `rated_on` |

Views (security invoker): `account_balances` (opening + income + transfers in − expenses − transfers out), `debt_progress`, `goal_progress`, `trip_summaries` (purchases, costs, sales, net, net margin %, days to sell, unsold stock value), `monthly_summary` (personal spending excluding giving, trading and debt groups; trading net; tithe set aside).

When a trip purchase, cost or sale is recorded, also create the matching transaction on the trip's capital account (tagged with `trip_id`), so account balances always agree with the trip.

Archive instead of delete whenever a row is referenced, and show archived items in a collapsed section.

---

## 5. Screens (match the design below)

Mobile-first, max width 480 px centered on larger screens, bottom navigation with five items: **Home, Accounts, + (Add), Trading, Plan**. Settings opens from the Home header and Wishlist from Plan.

1. **Login** (`/mezgeb/login`): app mark, email, password, Continue; then the 6-digit code step (six boxes, auto-advance, paste support). Text: "No sign-up here."
2. **Home** (`/mezgeb`): date + Settings button; an accent card with **Net position** (assets − debts), assets, debts and days until payday; two tiles: "Spent this month" with "= N hours of work", and "Trading net" with trips and average margin; friend-loan progress card; a checklist (tithe set aside, emergency-fund progress, wishes waiting); recent entries.
3. **Add entry** (`/mezgeb/add`): Expense / Income / Transfer tabs; a large amount with "= N hours of your work"; category chips plus "+ New"; account picker showing its remaining balance; a need/want switch; when it is a want, offer "Wait 48 hours instead?" which creates a wish instead of a transaction; a numeric keypad; Save.
4. **Payday split** (`/mezgeb/payday`): salary card, a colored split bar, "N of M moved", "0 Br left to assign"; one row per rule with its target account and a tick button; "Mark remaining as moved". Validate that allocations equal the salary exactly.
5. **Accounts** (`/mezgeb/accounts`): grouped by role (Everyday, Business, Protected, Inactive and planned), institution badge, purpose line, balance; protected balances hidden until tapped; the trading account shows unsold stock and the loss limit. Add or edit institutions and accounts from here.
6. **Trading** (`/mezgeb/trading`): capital, net this month, margin vs target; trip cards with goods bought, transport/food/lodging, sold for, net %, days to sell; open trips highlighted with "Record sale"; a **price gap** table per item between two cities with a verdict (go ≥ target, ok ≥ costs, skip below). Trip detail and price logging screens.
7. **Plan** (`/mezgeb/plan`): debts (remaining amount, progress bar, monthly amount from salary, target date, on-track status, "Record a payment"); gifts shown as "a gift, not a debt"; goals with progress and an estimate of paydays remaining.
8. **Wishlist** (`/mezgeb/wishlist`): an amber hero "Kept by letting go, this month: X Br = N hours of work"; waiting items with countdown bars; ready items with "Still want it" (records the purchase) and "Let it go"; an input to add a wish.
9. **Settings** (`/mezgeb/settings`): income and giving (salary, work hours → hourly rate, payday, tithe %); manage institutions, accounts, categories, payday rules, cities and items; security (MFA factors, lock minutes, hide balances, sign out everywhere); data (export and import backup, last backup date, reminder that the free database pauses after a week without use).

### First-run setup wizard

After the first MFA sign-in, if `settings` is empty, run a short wizard that pre-fills my plan and lets me edit every value before saving. Nothing may be hard-coded in the app; these are only defaults:

- Institutions: CBE, Telebirr, ebirr, Dashen Bank, Awash Bank.
- Accounts: CBE · Salary inbox; CBE · Trading capital; Telebirr · Spending; Telebirr · Tithe; Dashen · Debt fund (protected); Awash · Emergency and savings (protected); two ebirr accounts (archived); a planned USD account (archived until used).
- Settings: net salary 20,000 Br, 176 work hours, tithe 10%, lock 5 minutes, trading loss limit 100,000 Br.
- Payday rules: Tithe 10% → Telebirr · Tithe; Taxi and airtime 2,500 → Spending; Personal 1,500 → Spending; Friend loan 8,000 → Dashen · Debt fund; Emergency fund 4,000 → Awash; Long-term savings = remainder → Awash.
- Debts: Friend loan, I owe, 60,000 Br, target end of January, priority 1. Uncle start-up money, 55,000 Br, gift received.
- Goals: Emergency fund 30,000 Br (Awash); Long-term savings (no target yet); USD savings (planned).
- Categories: Taxi, Airtime, Eating out, Clothes, Gifts, Family, Tithe (giving), Trading stock, Trading costs (trading), Debt payment (debt), Salary, Contract work, Freelance, Trading sales (income).
- Cities: Arba Minch, Addis Ababa, Adama, Hawassa (editable).

---

## 6. Design system (independent of the portfolio)

Dark, calm, high-contrast; one bright accent for positive and primary actions; amber for debts, waits and warnings. No gradients, no emoji, no left-border cards. Icons are simple inline stroke SVGs (24×24, stroke 1.8).

| Token | Value |
| --- | --- |
| Background | `#0E1311` |
| Surface / raised | `#161D1A` / `#1E2723` |
| Border | `#2A3530` |
| Nav background | `#11171A` |
| Text / muted / dim | `#EEF3EF` / `#A3B1AA` / `#7F8D86` |
| Accent (lime) and text on it | `#C4F06A` / `#10140F` |
| Amber and text on it | `#F3B544` / `#1A1406` |
| Accent tint backgrounds | lime `#23301A`, amber `#1E1A10` with border `#4A3D1A` |
| Extra series colors (payday bar) | `#9CC4FF`, `#7FE0C2` |
| Fonts | **Space Grotesk** 500/600/700 for headings and all numbers (with `font-variant-numeric: tabular-nums`); **DM Sans** 400/500/600 for text. Load them with `next/font/google`, scoped to Mezgeb only |
| Radii | cards 16 to 22 px, inputs and buttons 12 to 16 px, chips 999 px |
| Spacing | 18 px page padding, 8 to 14 px gaps |
| Touch targets | at least 44 px; primary buttons 52 to 54 px tall |

Accessibility: real `<button>`, `<a>`, `<input>` + `<label>`; `aria-label` on icon-only buttons; text contrast at least 4.5:1; never rely on color alone (always show a sign, word or icon too).

---

## 7. PWA

- A manifest only for Mezgeb (served under `/mezgeb/`): `name` "Mezgeb", `short_name` "Mezgeb", `start_url` "/mezgeb", `scope` "/mezgeb/", `display` "standalone", `background_color` and `theme_color` `#0E1311`, icons 192 and 512 plus a maskable icon (generate a simple icon: the letter መ in `#10140F` on a `#C4F06A` rounded square).
- A small hand-written service worker at `/mezgeb/sw.js` with scope `/mezgeb/`: cache the app shell and static assets; **never cache Supabase API responses** (financial data stays out of the cache); show an offline screen when there is no network.
- Link the manifest and register the service worker only on Mezgeb pages, never on the portfolio.
- An "Install app" hint in Settings when the browser supports installing.

---

## 8. Backup, free-tier limits and docs

- **Export backup:** download all my tables as one JSON file (with a schema version and export date). **Import backup:** validate it, show what will change, ask for confirmation, then upsert. Record the last backup date and remind me monthly.
- The Supabase free tier pauses a project after about a week without activity. Show a reminder in Settings, and document it.
- Write `docs/mezgeb-setup.md` with the exact manual steps I must do from my phone:
  1. Create the Supabase project and run `0001_init.sql` in the SQL editor.
  2. Auth › Providers › Email: turn off "Allow new users to sign up". Auth › Users: add my user with a strong password.
  3. Auth › URL configuration: set the site URL to my domain.
  4. Confirm TOTP MFA is enabled (Auth › Multi-Factor).
  5. Add the two `NEXT_PUBLIC_SUPABASE_*` variables to the Cloudflare project's build environment and redeploy.
  6. Enroll the authenticator app, then a backup factor.

---

## 9. Work in phases and commit after each

Run lint, type-check and build at the end of every phase, fix what fails, then commit with a clear message. After each phase, tell me in two or three lines what works and what I should test on my phone.

1. **Phase 1 · Foundation:** isolated layout, design tokens, fonts, bottom nav, Supabase client, env files, noindex, hidden footer link. Migration SQL with all tables, constraints, RLS and views.
2. **Phase 2 · Auth:** login, TOTP enrollment and verification, AAL2 guard, auto-lock, sign out everywhere.
3. **Phase 3 · Core money:** settings, institutions, accounts, categories, transactions (add, edit, delete, list, filter), balances, Home, the setup wizard.
4. **Phase 4 · Plans:** payday rules and payday split, debts and payments, goals, wishlist with the 48-hour rule and hours-of-work.
5. **Phase 5 · Trading:** cities, items, trips, lines, costs, sales, price log, trip summaries, loss-limit warning.
6. **Phase 6 · PWA and data:** manifest, icons, service worker, offline screen, backup export and import, setup docs.

---

## 10. Tests and acceptance checks

- Unit tests (Vitest, or the project's existing runner) for: parsing amounts into minor units, formatting, hours-of-work, payday split math (percent, fixed, remainder, rounding to whole santim, totals equal the salary), trip net and margin, debt remaining, goal progress.
- An SQL test script in `supabase/tests/rls.sql` that I can run, proving that a second user, and a session without AAL2, can read or write **zero** rows in every table and cannot reference another user's rows through foreign keys.
- Acceptance checks:
  - [ ] The portfolio's existing pages look and behave exactly as before; only the footer gains the hidden link.
  - [ ] `/mezgeb/*` is unreachable without password **and** TOTP code; a direct API call with a password-only session returns no data.
  - [ ] No secret key exists anywhere in the repository or the built output.
  - [ ] I can add a new bank, wallet, account, category, city or item from the UI without code changes.
  - [ ] Balances, trip results and debt progress always match the underlying transactions.
  - [ ] No floating-point money math anywhere.
  - [ ] The app installs on my Android phone from `/mezgeb` and opens full-screen.
  - [ ] Export then import reproduces the same data.
  - [ ] Lint, type-check, tests and the Cloudflare build all pass.

If anything here is impossible or risky with this project's setup, stop and tell me before choosing an alternative.

---

## Decisions log

- 2026-11-03 · Design artifact read successfully and saved as `docs/mezgeb-design.html`. Its `mezgeb-design-tokens` block matches section 6 exactly.
- 2026-11-03 · The owner left the open decisions to the implementer. Chosen:
  - **Route groups.** Portfolio pages moved to `src/app/(site)` (URLs unchanged); Mezgeb has its own root layout in `src/app/(mezgeb)`. Leaving the portfolio for Mezgeb is a full page load.
  - **Hidden entry.** The portfolio has no footer, so the link is a 6 px low-contrast dot (24 px tap area) after "AI Backend Engineer" in the mobile menu's signature block, `aria-label="Private area"`, pointing to `/mezgeb/login`.
  - **Git.** `git init` with local commits per phase; nothing is pushed.
  - **Cloudflare.** The build command is not in the repo, so Mezgeb is fully static and client-side (no middleware, no edge runtime, no dynamic segments). It works on static Pages, next-on-pages and OpenNext alike.
  - **`categories.group` → `categories.category_group`**, because `group` is a reserved word in SQL.
- Data model details added on top of section 4:
  - `payday_rules.value` is basis points for percent rules (1000 = 10 %) and minor units for fixed rules, so it stays an integer.
  - `payday_allocations` snapshot the rule's name, target, goal and debt, plus `moved_at` (an allocation of 0 can be "moved" without a transaction).
  - `paydays.income_transaction_id` records the salary arriving in the inbox.
  - `trip_lines` hold `bought_on`, `purchase_transaction_id` and `sale_transaction_id`; `trip_costs` hold `incurred_on` and `transaction_id`. Triggers keep these mirrored transactions in sync on insert, update and delete.
  - `settings.last_backup_at` stores the last export date.
  - Atomic RPCs: `mz_record_payday`, `mz_move_allocation`, `mz_unmove_allocation`, `mz_buy_wish`, `mz_import` (backup import and the first-run wizard).
- Rules chosen where the spec was open:
  - **Debt progress** counts actual payments (expenses tagged with the debt; income for money owed to me). Money set aside in the debt fund is shown on its account, not as paid.
  - **Assets** = account balances + unsold trip stock at cost (this matches the design's numbers).
  - **Price-gap verdict.** go = gap minus usual trip costs ≥ the item's target margin; ok = gap covers usual costs; skip = below. Usual costs are total costs ÷ goods bought over closed trips.
- **Service worker location (deviation from section 7).** The worker is `/mezgeb-sw.js`, registered with scope `/mezgeb`; the manifest uses `start_url` and `scope` `/mezgeb`. Two reasons. Next.js serves the home page at `/mezgeb` with no trailing slash, and a worker at `/mezgeb/sw.js` can only control `/mezgeb/…`, so the start page would never work offline. Also, `start_url: "/mezgeb"` is not inside `scope: "/mezgeb/"`, so Chrome would ignore the scope and treat the whole portfolio as the app. A `Service-Worker-Allowed` header could fix this, but static Cloudflare hosting cannot set it. The worker is still registered only by Mezgeb pages.
- **Offline page** is the static `public/mezgeb/offline.html`, so it works without any JavaScript chunks.
- **Icons** are generated from the outline of መ in Noto Sans Ethiopic Bold (OFL), so they do not depend on fonts on the device. `public/mezgeb/icons/icon.svg` is the source.
- 2026-11-03 · Verified locally:
  - The migration and `rls.sql` pass on Postgres 17 and on the official Supabase stack.
  - API checks pass with real Supabase Auth: sign-up refused; aal1 reads and writes nothing; a password-only session cannot add an authenticator; wrong codes are refused.
  - A full browser walkthrough at phone size passes: enrollment, wizard, entries, payday, debts, wishes, a trade trip, backup export and import, auto-lock, offline page.
  - The service-worker cache holds no Supabase responses.
- 2026-11-04 · **Moved to the new portfolio** (`abel_lane`: Next.js 16, React 19, Tailwind 4, pnpm, OpenNext on Cloudflare Workers). Everything Mezgeb was copied unchanged in behaviour: `src/mezgeb`, `src/app/(mezgeb)`, `public/mezgeb`, `public/mezgeb-sw.js`, `supabase/`, these docs and the Vitest tests. The same Supabase project and data keep working.
  - **Route groups again.** This portfolio's root layout renders the loader, cursor, nav, footer, route shutter, smooth scroll, theme script and JSON-LD, so its pages moved to `src/app/(site)` (URLs unchanged) and Mezgeb keeps its own root layout. `api/contact`, `robots`, `sitemap` and the portfolio `manifest` stay at the app root. Unmatched URLs use `src/app/global-not-found.tsx`, which renders the same portfolio 404 as before.
  - **Hidden entry.** This portfolio has a footer, so the entry is where section 1 asked for it: a 6 px low-contrast dot (24 px tap area) right after "© 2026 Abel Addis", `aria-label="Private area"`, pointing to `/mezgeb/login`. The custom cursor ring ignores it (`data-cursor-quiet`), so hovering it gives nothing away.
  - **Cloudflare.** The `NEXT_PUBLIC_SUPABASE_*` values must be Workers Builds **build** variables. Mezgeb is still fully static and client-side, so OpenNext serves it from static assets.
- 2026-11-04 · **Next.js 16.4.0 → 16.4.5** (security release; `next`, `@next/mdx`, `eslint-config-next`). 16.4.5 turns on strict route matching, which attached the portfolio's `@modal/[...catchAll]` to every URL and then removed the `/mezgeb/*` routes because the `(site)` layout's `children` slot had no default for them (404 on `/mezgeb/login`). Fix: `src/app/(site)/default.tsx`, which calls `notFound()` exactly like Next's built-in default, so behaviour is unchanged and the routes are kept. Do not delete it.
- 2026-11-04 · **Added: people, stored goods, yearly savings, daily limit, light mode** (`0002_people_goods_savings.sql`, verified on the Supabase Postgres 17 image together with `rls.sql`).
  - **Money kept for others** is a new debt direction `held_for_other`; **credit given** stays `owed_to_me`. Lending, borrowing more, deposits and give-backs are transactions tagged with the person (`debt_id`), so balances stay true. `debt_progress` now has `added_minor`: what grew the amount (borrowed more, lent, deposited) next to `paid_minor` (what settled it). Money of others is subtracted in the net position and left out of savings (`held_by_account`). People money is never income or personal spending.
  - **Stored goods** are a trip of kind `stock` with no destination. Goods are bought into it (from any account), sold where they are, or the holding becomes a trip ("Take these goods on a trip"). Goods bought with trading capital count as trading capital.
  - **Yearly savings**: accounts marked "Counts as savings" (default: emergency, savings and USD roles), minus money kept for others, plus stored goods at cost when chosen. Target on 31 December in ETB or USD (converted with the manual exchange rates, both directions). Growth since 1 January leaves out deposits from people; the projection extends this year's pace to 31 December (from day 7 on).
  - **Daily limit**: automatic = the monthly payday budget into spending accounts ÷ days of the month (owner's choice); or a fixed amount; or off. Only personal spending counts. Going over shows one of 100 warnings; staying under, saving and letting a wish go show one of 100 words of praise (English, static in `lib/messages.ts`, so no database storage).
  - **Light mode**: Dark / Light / System in Settings, sun/moon button on Home. Stored per device in localStorage (a preference, not data); applied before first paint.
  - Free-tier note: nothing here adds a service or a table; the views are computed on read. A year of daily use is a few MB of the 500 MB database.
- 2026-11-05 · **Help pages and a danger zone** (no database change).
  - **Help** (`/mezgeb/help`, static): what every screen does, the words Mezgeb uses, safety and common questions, with examples and tap paths. **How to add things** (`/mezgeb/help/add`): 20 step-by-step guides. Reached from the ? on Home and the first card in Settings. Plan now has a Payday button.
  - **Danger zone** (Settings, last section): deletes every row of the signed-in user in a foreign-key-safe order (`lib/wipe.ts`, trips first, settings last so a failed run can simply be repeated), after offering a backup and asking for `DELETE ALL`. The login and authenticators stay; without settings the setup wizard opens. Verified on Supabase Postgres 17 with 0001 + 0002: all of the user's rows go, another user's rows and the login stay.
- 2026-11-05 · **Trading capital, asset breakdown and balance fix** (no database change).
  - Trading capital = cash on trading accounts + goods bought with trading money (open stores and trips, at cost) + credit given from a trading account (the person's "Usually from") still owed (`lib/position.ts`). The loss-limit warning, Trading and Accounts use it, so buying goods or lending never looks like a loss.
  - Home shows what assets are made of: cash in accounts, goods, owed to you = total assets, then debts and money kept for others.
  - Stored goods count as savings only when paid from a non-trading account; goods paid with trading money are trading capital.
  - "Real balance now" on an existing account sets the opening balance so the account shows what the bank shows, keeping every entry (fixes a negative balance caused by typing today's balance as the opening balance and also recording older entries). Accounts warns about any balance below zero.
- 2026-11-05 · **Money taken from trading for myself** (no database change).
  - Credit I gave › "I took it for myself" stores the person as `Myself` (`SELF_NAME`; `isSelfLoan` also accepts "Me"). It still counts in trading capital, but not in total assets or "owed to you" (it is the owner's own money); Home shows it as "To put back in trading". Plan words it "To put back", "Put money back", "Take more". Like any lending, it never touches the daily limit.
