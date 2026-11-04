-- Mezgeb · 0001_init
-- Paste the whole file into the Supabase SQL editor and run it once.
--
-- Rules that hold for every table:
--   * Money is bigint minor units (santim / cents) in *_minor columns. No floats.
--   * Rows belong to user_id (defaults to auth.uid()).
--   * RLS is enabled and forced. Every policy requires the owner AND an aal2
--     (password + authenticator code) session, so a password alone reads nothing.
--   * Parent tables expose unique (id, user_id) and children use composite
--     foreign keys, so a row can never point at another user's row.

begin;

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────

create or replace function public.mz_touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  net_salary_minor bigint not null default 0 check (net_salary_minor >= 0),
  work_hours_per_month integer not null default 176 check (work_hours_per_month between 1 and 744),
  payday_day smallint not null default 1 check (payday_day between 1 and 31),
  tithe_percent numeric(5,2) not null default 10 check (tithe_percent between 0 and 100),
  base_currency text not null default 'ETB' check (base_currency ~ '^[A-Z]{3}$'),
  lock_minutes integer not null default 5 check (lock_minutes between 1 and 120),
  hide_balances boolean not null default false,
  trading_loss_limit_minor bigint not null default 0 check (trading_loss_limit_minor >= 0),
  last_backup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  short_label text not null check (length(short_label) between 1 and 6),
  kind text not null default 'bank' check (kind in ('bank', 'mobile_wallet', 'cash', 'other')),
  color text not null default '#A3B1AA' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  institution_id uuid,
  name text not null check (length(name) between 1 and 80),
  role text not null default 'other' check (role in ('salary_inbox', 'spending', 'tithe', 'trading', 'debt_fund', 'emergency', 'savings', 'usd', 'other')),
  currency text not null default 'ETB' check (currency ~ '^[A-Z]{3}$'),
  opening_balance_minor bigint not null default 0,
  is_protected boolean not null default false,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  notes text check (length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (institution_id, user_id) references public.institutions (id, user_id)
);
comment on table public.accounts is 'Never store account numbers here.';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 60),
  kind text not null check (kind in ('expense', 'income')),
  -- "group" is a reserved word in SQL, so the column is category_group.
  category_group text not null default 'personal' check (category_group in ('personal', 'giving', 'trading', 'debt', 'work', 'other')),
  is_need boolean not null default true,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index categories_name_unique on public.categories (user_id, kind, lower(name));

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  counterparty text not null check (length(counterparty) between 1 and 80),
  direction text not null check (direction in ('i_owe', 'owed_to_me', 'gift_received')),
  principal_minor bigint not null check (principal_minor > 0),
  currency text not null default 'ETB' check (currency ~ '^[A-Z]{3}$'),
  started_on date,
  target_on date,
  priority smallint not null default 1 check (priority between 1 and 99),
  status text not null default 'active' check (status in ('active', 'paid')),
  notes text check (length(notes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  kind text not null default 'custom' check (kind in ('emergency', 'savings', 'usd', 'custom')),
  target_minor bigint check (target_minor > 0),
  account_id uuid,
  deadline date,
  status text not null default 'active' check (status in ('active', 'planned', 'reached', 'archived')),
  notes text check (length(notes) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id)
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 60),
  short_label text check (length(short_label) <= 8),
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.trade_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 60),
  unit text not null default 'piece' check (length(unit) between 1 and 20),
  target_margin_percent numeric(5,2) not null default 10 check (target_margin_percent between 0 and 1000),
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  from_city_id uuid not null,
  to_city_id uuid not null,
  capital_account_id uuid not null,
  started_on date not null default current_date,
  closed_on date,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text check (length(notes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (from_city_id <> to_city_id),
  check ((status = 'closed') = (closed_on is not null)),
  check (closed_on is null or closed_on >= started_on),
  foreign key (from_city_id, user_id) references public.cities (id, user_id),
  foreign key (to_city_id, user_id) references public.cities (id, user_id),
  foreign key (capital_account_id, user_id) references public.accounts (id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  occurred_on date not null default current_date,
  kind text not null check (kind in ('expense', 'income', 'transfer')),
  account_id uuid not null,
  to_account_id uuid,
  amount_minor bigint not null check (amount_minor > 0),
  category_id uuid,
  note text check (length(note) <= 300),
  is_want boolean not null default false,
  goal_id uuid,
  debt_id uuid,
  trip_id uuid,
  source text not null default 'manual' check (source in ('manual', 'payday', 'trading', 'debt', 'wish')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  -- transfers need a different to_account_id; other kinds must not have one
  check ((kind = 'transfer') = (to_account_id is not null)),
  check (to_account_id is null or to_account_id <> account_id),
  check (kind <> 'transfer' or category_id is null),
  foreign key (account_id, user_id) references public.accounts (id, user_id),
  foreign key (to_account_id, user_id) references public.accounts (id, user_id),
  foreign key (category_id, user_id) references public.categories (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id),
  foreign key (debt_id, user_id) references public.debts (id, user_id),
  foreign key (trip_id, user_id) references public.trips (id, user_id)
);
create index transactions_user_date on public.transactions (user_id, occurred_on desc);
create index transactions_account on public.transactions (account_id);
create index transactions_to_account on public.transactions (to_account_id);
create index transactions_debt on public.transactions (debt_id) where debt_id is not null;
create index transactions_goal on public.transactions (goal_id) where goal_id is not null;
create index transactions_trip on public.transactions (trip_id) where trip_id is not null;

create table public.payday_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 60),
  kind text not null check (kind in ('percent_of_salary', 'fixed', 'remainder')),
  -- percent_of_salary: basis points (1000 = 10.00 %); fixed: minor units; remainder: 0
  value bigint not null default 0 check (value >= 0),
  target_account_id uuid not null,
  goal_id uuid,
  debt_id uuid,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (kind <> 'percent_of_salary' or value <= 10000),
  check (kind <> 'remainder' or value = 0),
  foreign key (target_account_id, user_id) references public.accounts (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id),
  foreign key (debt_id, user_id) references public.debts (id, user_id)
);
-- at most one active remainder rule
create unique index payday_rules_one_remainder on public.payday_rules (user_id) where kind = 'remainder' and is_active;

create table public.paydays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  received_on date not null default current_date,
  amount_minor bigint not null check (amount_minor > 0),
  account_id uuid not null,
  income_transaction_id uuid,
  note text check (length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id),
  foreign key (income_transaction_id, user_id) references public.transactions (id, user_id) on delete set null (income_transaction_id)
);

create table public.payday_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  payday_id uuid not null,
  rule_id uuid,
  -- snapshot of the rule when the payday was recorded, so later rule edits do not rewrite history
  name text not null check (length(name) between 1 and 60),
  target_account_id uuid not null,
  goal_id uuid,
  debt_id uuid,
  amount_minor bigint not null check (amount_minor >= 0),
  sort_order integer not null default 0,
  transaction_id uuid,
  moved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (payday_id, user_id) references public.paydays (id, user_id) on delete cascade,
  foreign key (rule_id, user_id) references public.payday_rules (id, user_id) on delete set null (rule_id),
  foreign key (target_account_id, user_id) references public.accounts (id, user_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id),
  foreign key (debt_id, user_id) references public.debts (id, user_id),
  foreign key (transaction_id, user_id) references public.transactions (id, user_id) on delete set null (transaction_id)
);

create table public.price_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid not null,
  city_id uuid not null,
  price_minor bigint not null check (price_minor > 0),
  observed_on date not null default current_date,
  note text check (length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (item_id, user_id) references public.trade_items (id, user_id) on delete cascade,
  foreign key (city_id, user_id) references public.cities (id, user_id) on delete cascade
);
create index price_logs_lookup on public.price_logs (user_id, item_id, city_id, observed_on desc);

create table public.trip_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id uuid not null,
  item_id uuid not null,
  quantity numeric(12,3) not null check (quantity > 0),
  buy_unit_minor bigint not null check (buy_unit_minor > 0),
  sell_unit_minor bigint check (sell_unit_minor > 0),
  bought_on date not null default current_date,
  sold_on date,
  purchase_transaction_id uuid,
  sale_transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((sell_unit_minor is null) = (sold_on is null)),
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references public.trade_items (id, user_id),
  foreign key (purchase_transaction_id, user_id) references public.transactions (id, user_id) on delete set null (purchase_transaction_id),
  foreign key (sale_transaction_id, user_id) references public.transactions (id, user_id) on delete set null (sale_transaction_id)
);

create table public.trip_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  trip_id uuid not null,
  kind text not null check (kind in ('transport', 'food', 'lodging', 'phone', 'loss', 'other')),
  amount_minor bigint not null check (amount_minor > 0),
  incurred_on date not null default current_date,
  note text check (length(note) <= 200),
  transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade,
  foreign key (transaction_id, user_id) references public.transactions (id, user_id) on delete set null (transaction_id)
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  amount_minor bigint not null check (amount_minor > 0),
  -- always created_at + 48 hours (enforced by trigger)
  ready_at timestamptz not null default (now() + interval '48 hours'),
  status text not null default 'waiting' check (status in ('waiting', 'bought', 'let_go')),
  decided_at timestamptz,
  transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((status = 'waiting') = (decided_at is null)),
  foreign key (transaction_id, user_id) references public.transactions (id, user_id) on delete set null (transaction_id)
);

create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  base text not null check (base ~ '^[A-Z]{3}$'),
  quote text not null check (quote ~ '^[A-Z]{3}$'),
  rate numeric(18,8) not null check (rate > 0),
  rated_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (base <> quote)
);

-- ─────────────────────────────────────────────────────────────
-- updated_at triggers, RLS (enabled + forced) and policies
-- ─────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'institutions', 'accounts', 'categories', 'debts', 'goals', 'cities',
    'trade_items', 'trips', 'transactions', 'payday_rules', 'paydays', 'payday_allocations',
    'price_logs', 'trip_lines', 'trip_costs', 'wishes', 'fx_rates'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.mz_touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format($p$create policy %I on public.%I for select to authenticated
      using (user_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')$p$, t || '_select', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
      with check (user_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
      using (user_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')
      with check (user_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')$p$, t || '_update', t);
    execute format($p$create policy %I on public.%I for delete to authenticated
      using (user_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2')$p$, t || '_delete', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Integrity triggers
-- ─────────────────────────────────────────────────────────────

-- Transfers stay within one currency; categories match the entry kind.
create or replace function public.mz_check_transaction()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  from_ccy text;
  to_ccy text;
  cat_kind text;
begin
  if new.kind = 'transfer' then
    select currency into from_ccy from public.accounts where id = new.account_id;
    select currency into to_ccy from public.accounts where id = new.to_account_id;
    -- an unknown (or someone else's) account is rejected by the foreign key instead
    if from_ccy is not null and to_ccy is not null and from_ccy <> to_ccy then
      raise exception 'A transfer must stay in one currency (% → %)', from_ccy, to_ccy using errcode = '23514';
    end if;
  end if;
  if new.category_id is not null then
    select kind into cat_kind from public.categories where id = new.category_id;
    if cat_kind is not null and cat_kind <> new.kind then
      raise exception 'Category kind % does not match entry kind %', cat_kind, new.kind using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

create trigger transactions_check before insert or update on public.transactions
  for each row execute function public.mz_check_transaction();

-- A wish always waits exactly 48 hours from when it was created.
create or replace function public.mz_wish_ready_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  new.ready_at := new.created_at + interval '48 hours';
  return new;
end $$;

create trigger wishes_ready_at before insert or update on public.wishes
  for each row execute function public.mz_wish_ready_at();

-- Trip purchases, sales and costs mirror themselves as transactions on the
-- trip's capital account, so account balances always agree with the trip.
create or replace function public.mz_trip_line_sync()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  trip record;
  item_name text;
  buy_total bigint;
  sell_total bigint;
  label text;
begin
  select t.capital_account_id, t.name into trip from public.trips t where t.id = new.trip_id;
  if not found then
    return new; -- unknown or someone else's trip: the foreign key rejects the row
  end if;
  select i.name into item_name from public.trade_items i where i.id = new.item_id;
  label := left(trip.name || ' · ' || coalesce(item_name, 'item'), 300);
  buy_total := round(new.quantity * new.buy_unit_minor)::bigint;

  if new.purchase_transaction_id is null then
    insert into public.transactions (user_id, occurred_on, kind, account_id, amount_minor, note, trip_id, source)
    values (new.user_id, new.bought_on, 'expense', trip.capital_account_id, buy_total, label, new.trip_id, 'trading')
    returning id into new.purchase_transaction_id;
  else
    update public.transactions
      set occurred_on = new.bought_on, account_id = trip.capital_account_id, amount_minor = buy_total, note = label
      where id = new.purchase_transaction_id;
  end if;

  if new.sell_unit_minor is not null then
    sell_total := round(new.quantity * new.sell_unit_minor)::bigint;
    if new.sale_transaction_id is null then
      insert into public.transactions (user_id, occurred_on, kind, account_id, amount_minor, note, trip_id, source)
      values (new.user_id, new.sold_on, 'income', trip.capital_account_id, sell_total, label, new.trip_id, 'trading')
      returning id into new.sale_transaction_id;
    else
      update public.transactions
        set occurred_on = new.sold_on, account_id = trip.capital_account_id, amount_minor = sell_total, note = label
        where id = new.sale_transaction_id;
    end if;
  else
    -- sale removed: the old sale transaction is deleted in the AFTER trigger
    new.sale_transaction_id := null;
  end if;
  return new;
end $$;

create or replace function public.mz_trip_line_cleanup()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    delete from public.transactions where id in (old.purchase_transaction_id, old.sale_transaction_id);
    return old;
  end if;
  if old.sale_transaction_id is not null and new.sale_transaction_id is null then
    delete from public.transactions where id = old.sale_transaction_id;
  end if;
  return new;
end $$;

create trigger trip_lines_sync before insert or update on public.trip_lines
  for each row execute function public.mz_trip_line_sync();
create trigger trip_lines_cleanup after update or delete on public.trip_lines
  for each row execute function public.mz_trip_line_cleanup();

create or replace function public.mz_trip_cost_sync()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  trip record;
  label text;
begin
  select t.capital_account_id, t.name into trip from public.trips t where t.id = new.trip_id;
  if not found then
    return new; -- unknown or someone else's trip: the foreign key rejects the row
  end if;
  label := left(trip.name || ' · ' || new.kind || coalesce(' · ' || new.note, ''), 300);
  if new.transaction_id is null then
    insert into public.transactions (user_id, occurred_on, kind, account_id, amount_minor, note, trip_id, source)
    values (new.user_id, new.incurred_on, 'expense', trip.capital_account_id, new.amount_minor, label, new.trip_id, 'trading')
    returning id into new.transaction_id;
  else
    update public.transactions
      set occurred_on = new.incurred_on, account_id = trip.capital_account_id, amount_minor = new.amount_minor, note = label
      where id = new.transaction_id;
  end if;
  return new;
end $$;

create or replace function public.mz_trip_cost_cleanup()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  delete from public.transactions where id = old.transaction_id;
  return old;
end $$;

create trigger trip_costs_sync before insert or update on public.trip_costs
  for each row execute function public.mz_trip_cost_sync();
create trigger trip_costs_cleanup after delete on public.trip_costs
  for each row execute function public.mz_trip_cost_cleanup();

-- Moving a trip to another capital account moves its transactions too.
create or replace function public.mz_trip_account_sync()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.capital_account_id <> old.capital_account_id then
    update public.transactions set account_id = new.capital_account_id where trip_id = new.id;
  end if;
  return new;
end $$;

create trigger trips_account_sync after update of capital_account_id on public.trips
  for each row execute function public.mz_trip_account_sync();

-- Deleting a trip removes its lines, costs and their transactions first, so the
-- foreign key from transactions.trip_id never sees a half-deleted trip.
create or replace function public.mz_trip_before_delete()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  delete from public.trip_lines where trip_id = old.id;
  delete from public.trip_costs where trip_id = old.id;
  delete from public.transactions where trip_id = old.id;
  return old;
end $$;

create trigger trips_before_delete before delete on public.trips
  for each row execute function public.mz_trip_before_delete();

-- ─────────────────────────────────────────────────────────────
-- Views (security invoker, so RLS applies to whoever queries them)
-- ─────────────────────────────────────────────────────────────

create view public.account_balances with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.currency,
  a.opening_balance_minor + coalesce(m.movement, 0)::bigint as balance_minor
from public.accounts a
left join lateral (
  select sum(
    case
      when t.kind = 'income' and t.account_id = a.id then t.amount_minor
      when t.kind = 'expense' and t.account_id = a.id then -t.amount_minor
      when t.kind = 'transfer' and t.to_account_id = a.id then t.amount_minor
      when t.kind = 'transfer' and t.account_id = a.id then -t.amount_minor
      else 0
    end
  ) as movement
  from public.transactions t
  where t.account_id = a.id or t.to_account_id = a.id
) m on true;

create view public.debt_progress with (security_invoker = true) as
select
  d.id as debt_id,
  d.user_id,
  d.direction,
  d.principal_minor,
  coalesce(p.paid, 0)::bigint as paid_minor,
  case when d.direction = 'gift_received' then 0
       else greatest(d.principal_minor - coalesce(p.paid, 0), 0)::bigint end as remaining_minor,
  p.last_paid_on
from public.debts d
left join lateral (
  select
    sum(t.amount_minor) as paid,
    max(t.occurred_on) as last_paid_on
  from public.transactions t
  where t.debt_id = d.id
    and ((d.direction = 'i_owe' and t.kind = 'expense') or (d.direction = 'owed_to_me' and t.kind = 'income'))
) p on true;

create view public.goal_progress with (security_invoker = true) as
select
  g.id as goal_id,
  g.user_id,
  g.target_minor,
  coalesce(s.saved, 0)::bigint as saved_minor
from public.goals g
left join lateral (
  select sum(case when t.kind = 'expense' then -t.amount_minor else t.amount_minor end) as saved
  from public.transactions t
  where t.goal_id = g.id
) s on true;

create view public.trip_summaries with (security_invoker = true) as
select
  t.id as trip_id,
  t.user_id,
  t.status,
  t.started_on,
  t.closed_on,
  coalesce(l.purchases, 0)::bigint as purchases_minor,
  coalesce(c.costs, 0)::bigint as costs_minor,
  coalesce(c.transport, 0)::bigint as transport_minor,
  coalesce(c.food, 0)::bigint as food_minor,
  coalesce(c.lodging, 0)::bigint as lodging_minor,
  coalesce(c.other, 0)::bigint as other_costs_minor,
  coalesce(l.sales, 0)::bigint as sales_minor,
  (coalesce(l.sales, 0) - coalesce(l.purchases, 0) - coalesce(c.costs, 0))::bigint as net_minor,
  round((coalesce(l.sales, 0) - coalesce(l.purchases, 0) - coalesce(c.costs, 0)) * 100.0
        / nullif(coalesce(l.purchases, 0) + coalesce(c.costs, 0), 0), 1) as net_margin_percent,
  coalesce(l.unsold, 0)::bigint as unsold_stock_minor,
  coalesce(l.line_count, 0)::integer as line_count,
  coalesce(l.unsold_count, 0)::integer as unsold_count,
  case when coalesce(l.line_count, 0) > 0 and coalesce(l.unsold_count, 0) = 0
       then (l.last_sold_on - t.started_on) end as days_to_sell
from public.trips t
left join lateral (
  select
    sum(round(x.quantity * x.buy_unit_minor)) as purchases,
    sum(round(x.quantity * x.sell_unit_minor)) filter (where x.sell_unit_minor is not null) as sales,
    sum(round(x.quantity * x.buy_unit_minor)) filter (where x.sell_unit_minor is null) as unsold,
    count(*) as line_count,
    count(*) filter (where x.sell_unit_minor is null) as unsold_count,
    max(x.sold_on) as last_sold_on
  from public.trip_lines x
  where x.trip_id = t.id
) l on true
left join lateral (
  select
    sum(y.amount_minor) as costs,
    sum(y.amount_minor) filter (where y.kind = 'transport') as transport,
    sum(y.amount_minor) filter (where y.kind = 'food') as food,
    sum(y.amount_minor) filter (where y.kind = 'lodging') as lodging,
    sum(y.amount_minor) filter (where y.kind not in ('transport', 'food', 'lodging')) as other
  from public.trip_costs y
  where y.trip_id = t.id
) c on true;

-- Personal spending leaves out giving, trading and debt; trading net counts
-- trips closed in the month; tithe set aside is money moved into tithe accounts.
create view public.monthly_summary with (security_invoker = true) as
with tx as (
  select
    t.user_id,
    date_trunc('month', t.occurred_on)::date as month,
    sum(t.amount_minor) filter (
      where t.kind = 'expense' and t.trip_id is null and t.debt_id is null and t.source <> 'trading'
        and coalesce(c.category_group, 'personal') not in ('giving', 'trading', 'debt')
    ) as personal_spent,
    sum(t.amount_minor) filter (where t.kind = 'expense' and c.category_group = 'giving') as giving_spent,
    sum(t.amount_minor) filter (where t.kind = 'income' and t.trip_id is null) as income,
    sum(t.amount_minor) filter (
      where (t.kind = 'transfer' and ta.role = 'tithe') or (t.kind = 'income' and fa.role = 'tithe')
    ) as tithe_set_aside
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  left join public.accounts fa on fa.id = t.account_id
  left join public.accounts ta on ta.id = t.to_account_id
  group by 1, 2
),
tr as (
  select
    s.user_id,
    date_trunc('month', s.closed_on)::date as month,
    sum(s.net_minor) as trading_net,
    sum(s.purchases_minor + s.costs_minor) as trading_spent,
    count(*) as trips_closed
  from public.trip_summaries s
  where s.status = 'closed'
  group by 1, 2
)
select
  coalesce(tx.user_id, tr.user_id) as user_id,
  coalesce(tx.month, tr.month) as month,
  coalesce(tx.personal_spent, 0)::bigint as personal_spent_minor,
  coalesce(tx.giving_spent, 0)::bigint as giving_spent_minor,
  coalesce(tx.income, 0)::bigint as income_minor,
  coalesce(tx.tithe_set_aside, 0)::bigint as tithe_set_aside_minor,
  coalesce(tr.trading_net, 0)::bigint as trading_net_minor,
  coalesce(tr.trips_closed, 0)::integer as trips_closed,
  round(tr.trading_net * 100.0 / nullif(tr.trading_spent, 0), 1) as trading_margin_percent
from tx
full outer join tr on tr.user_id = tx.user_id and tr.month = tx.month;

revoke all on public.account_balances, public.debt_progress, public.goal_progress,
  public.trip_summaries, public.monthly_summary from anon;
grant select on public.account_balances, public.debt_progress, public.goal_progress,
  public.trip_summaries, public.monthly_summary to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC functions (security invoker: RLS still applies inside them)
-- ─────────────────────────────────────────────────────────────

create or replace function public.mz_require_aal2()
returns void language plpgsql stable set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Two-step sign-in required' using errcode = '42501';
  end if;
end $$;

-- Record a salary: the income transaction, the payday, and its allocations.
-- Allocations must add up to the salary exactly.
create or replace function public.mz_record_payday(
  p_received_on date,
  p_amount_minor bigint,
  p_account_id uuid,
  p_category_id uuid,
  p_allocations jsonb
) returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_tx uuid;
  v_payday uuid;
  v_total bigint;
begin
  perform public.mz_require_aal2();
  select coalesce(sum((a ->> 'amount_minor')::bigint), 0) into v_total from jsonb_array_elements(p_allocations) a;
  if v_total <> p_amount_minor then
    raise exception 'Allocations (%) must equal the salary (%)', v_total, p_amount_minor using errcode = '23514';
  end if;

  insert into public.transactions (occurred_on, kind, account_id, amount_minor, category_id, note, source)
  values (p_received_on, 'income', p_account_id, p_amount_minor, p_category_id, 'Salary', 'payday')
  returning id into v_tx;

  insert into public.paydays (received_on, amount_minor, account_id, income_transaction_id)
  values (p_received_on, p_amount_minor, p_account_id, v_tx)
  returning id into v_payday;

  insert into public.payday_allocations (payday_id, rule_id, name, target_account_id, goal_id, debt_id, amount_minor, sort_order)
  select v_payday,
         nullif(a ->> 'rule_id', '')::uuid,
         a ->> 'name',
         (a ->> 'target_account_id')::uuid,
         nullif(a ->> 'goal_id', '')::uuid,
         nullif(a ->> 'debt_id', '')::uuid,
         (a ->> 'amount_minor')::bigint,
         ord
  from jsonb_array_elements(p_allocations) with ordinality as x(a, ord);

  return v_payday;
end $$;

-- Tick an allocation: create the transfer from the salary account.
create or replace function public.mz_move_allocation(p_allocation_id uuid)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v record;
  v_tx uuid;
begin
  perform public.mz_require_aal2();
  select a.*, p.account_id as from_account_id, p.received_on
    into v
    from public.payday_allocations a
    join public.paydays p on p.id = a.payday_id
   where a.id = p_allocation_id
   for update of a;
  if not found then
    raise exception 'Allocation not found' using errcode = 'P0002';
  end if;
  if v.moved_at is not null then
    return v.transaction_id;
  end if;
  if v.amount_minor > 0 and v.target_account_id <> v.from_account_id then
    insert into public.transactions (occurred_on, kind, account_id, to_account_id, amount_minor, note, goal_id, source)
    values (current_date, 'transfer', v.from_account_id, v.target_account_id, v.amount_minor, left('Payday · ' || v.name, 300), v.goal_id, 'payday')
    returning id into v_tx;
  end if;
  update public.payday_allocations set transaction_id = v_tx, moved_at = now() where id = p_allocation_id;
  return v_tx;
end $$;

-- Untick an allocation: remove its transfer.
create or replace function public.mz_unmove_allocation(p_allocation_id uuid)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_tx uuid;
begin
  perform public.mz_require_aal2();
  select transaction_id into v_tx from public.payday_allocations where id = p_allocation_id for update;
  if not found then
    raise exception 'Allocation not found' using errcode = 'P0002';
  end if;
  update public.payday_allocations set transaction_id = null, moved_at = null where id = p_allocation_id;
  if v_tx is not null then
    delete from public.transactions where id = v_tx;
  end if;
end $$;

-- "Still want it": record the purchase and close the wish.
create or replace function public.mz_buy_wish(p_wish_id uuid, p_account_id uuid, p_category_id uuid)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  w record;
  v_tx uuid;
begin
  perform public.mz_require_aal2();
  select * into w from public.wishes where id = p_wish_id for update;
  if not found then
    raise exception 'Wish not found' using errcode = 'P0002';
  end if;
  if w.status <> 'waiting' then
    raise exception 'This wish is already decided' using errcode = '23514';
  end if;
  if w.ready_at > now() then
    raise exception 'This wish is still waiting out its 48 hours' using errcode = '23514';
  end if;
  insert into public.transactions (occurred_on, kind, account_id, amount_minor, category_id, note, is_want, source)
  values (current_date, 'expense', p_account_id, w.amount_minor, p_category_id, left(w.name, 300), true, 'wish')
  returning id into v_tx;
  update public.wishes set status = 'bought', decided_at = now(), transaction_id = v_tx where id = p_wish_id;
  return v_tx;
end $$;

-- Upsert rows from a backup (or from the first-run wizard) in one transaction.
-- Tables are processed in dependency order; user_id always comes from the session.
create or replace function public.mz_import(p jsonb, p_require_empty boolean default false)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  t text;
  cols text;
  upd text;
  conflict text;
  n integer;
  result jsonb := '{}'::jsonb;
begin
  perform public.mz_require_aal2();
  if p_require_empty and exists (select 1 from public.settings) then
    raise exception 'Mezgeb is already set up' using errcode = '23505';
  end if;

  foreach t in array array[
    'settings', 'institutions', 'accounts', 'categories', 'debts', 'goals', 'cities', 'trade_items',
    'trips', 'transactions', 'payday_rules', 'paydays', 'payday_allocations', 'price_logs',
    'trip_lines', 'trip_costs', 'wishes', 'fx_rates'
  ] loop
    continue when not (p ? t) or jsonb_typeof(p -> t) <> 'array' or jsonb_array_length(p -> t) = 0;

    -- only the columns present in the payload, never user_id / updated_at
    select string_agg(quote_ident(a.attname), ', ' order by a.attnum),
           string_agg(format('%1$I = excluded.%1$I', a.attname), ', ' order by a.attnum)
             filter (where t <> 'settings' or a.attname <> 'id')
      into cols, upd
      from pg_attribute a
     where a.attrelid = format('public.%I', t)::regclass
       and a.attnum > 0 and not a.attisdropped
       and a.attname not in ('user_id', 'updated_at')
       and exists (
         select 1 from jsonb_array_elements(p -> t) e where e ? a.attname
       );

    conflict := case when t = 'settings' then '(user_id)' else '(id)' end;
    execute format(
      'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1) on conflict %s do update set %s',
      t, cols, cols, t, conflict, upd
    ) using p -> t;
    get diagnostics n = row_count;
    result := result || jsonb_build_object(t, n);
  end loop;
  return result;
end $$;

revoke all on function public.mz_record_payday(date, bigint, uuid, uuid, jsonb) from public, anon;
revoke all on function public.mz_move_allocation(uuid) from public, anon;
revoke all on function public.mz_unmove_allocation(uuid) from public, anon;
revoke all on function public.mz_buy_wish(uuid, uuid, uuid) from public, anon;
revoke all on function public.mz_import(jsonb, boolean) from public, anon;
revoke all on function public.mz_require_aal2() from public, anon;
grant execute on function public.mz_record_payday(date, bigint, uuid, uuid, jsonb) to authenticated;
grant execute on function public.mz_move_allocation(uuid) to authenticated;
grant execute on function public.mz_unmove_allocation(uuid) to authenticated;
grant execute on function public.mz_buy_wish(uuid, uuid, uuid) to authenticated;
grant execute on function public.mz_import(jsonb, boolean) to authenticated;
grant execute on function public.mz_require_aal2() to authenticated;

commit;
