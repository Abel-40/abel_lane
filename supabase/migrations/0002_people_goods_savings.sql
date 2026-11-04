-- Mezgeb · 0002_people_goods_savings
-- Run once in the Supabase SQL editor, after 0001_init.sql. It keeps all existing data.
--
-- Adds:
--   * People: money I keep for others (held_for_other) next to debts I owe and credit I give.
--     Lending, borrowing more, deposits and give-backs are transactions tagged with the person,
--     so account balances and the net position always agree.
--   * Stored goods: a "stock" holding is a trip with no destination yet. Goods are bought into it
--     (money leaves the capital account), can be sold where they are, or the holding becomes a trip.
--   * Yearly savings: which accounts count as savings, a year-end target (ETB or USD) and whether
--     stored goods count.
--   * Daily spending: a daily limit (empty = worked out from the monthly budget) and a per-day view.
--
-- Same rules as 0001: integer minor units, RLS with owner + aal2 on every table, security-invoker views.

begin;

-- ─────────────────────────────────────────────────────────────
-- People: debts, credit given, money held for others
-- ─────────────────────────────────────────────────────────────

alter table public.debts drop constraint if exists debts_direction_check;
alter table public.debts add constraint debts_direction_check
  check (direction in ('i_owe', 'owed_to_me', 'held_for_other', 'gift_received'));

-- The starting amount may be 0 when everything is recorded as transactions (lending, deposits).
alter table public.debts drop constraint if exists debts_principal_minor_check;
alter table public.debts add constraint debts_principal_minor_check check (principal_minor >= 0);

-- Where the money sits (held for others) or usually comes from / goes to. Optional.
alter table public.debts add column if not exists account_id uuid;
alter table public.debts drop constraint if exists debts_account_fk;
alter table public.debts add constraint debts_account_fk
  foreign key (account_id, user_id) references public.accounts (id, user_id);

-- ─────────────────────────────────────────────────────────────
-- Stored goods: a trip of kind 'stock' has no destination yet
-- ─────────────────────────────────────────────────────────────

alter table public.trips add column if not exists kind text not null default 'trip';
alter table public.trips drop constraint if exists trips_kind_check;
alter table public.trips add constraint trips_kind_check check (kind in ('trip', 'stock'));
alter table public.trips alter column to_city_id drop not null;
alter table public.trips drop constraint if exists trips_destination_check;
alter table public.trips add constraint trips_destination_check check (kind = 'stock' or to_city_id is not null);
-- trips_check (from_city_id <> to_city_id) still applies once a destination is set.

-- ─────────────────────────────────────────────────────────────
-- Savings and spending settings
-- ─────────────────────────────────────────────────────────────

-- null = decided by the role (emergency, savings and USD accounts count); true / false = chosen by hand
alter table public.accounts add column if not exists counts_as_saving boolean;

alter table public.settings add column if not exists daily_spend_limit_minor bigint;
alter table public.settings add column if not exists year_savings_target_minor bigint;
alter table public.settings add column if not exists year_savings_currency text not null default 'ETB';
alter table public.settings add column if not exists savings_include_goods boolean not null default true;
alter table public.settings drop constraint if exists settings_daily_spend_limit_check;
alter table public.settings add constraint settings_daily_spend_limit_check
  check (daily_spend_limit_minor is null or daily_spend_limit_minor >= 0);
alter table public.settings drop constraint if exists settings_year_savings_target_check;
alter table public.settings add constraint settings_year_savings_target_check
  check (year_savings_target_minor is null or year_savings_target_minor > 0);
alter table public.settings drop constraint if exists settings_year_savings_currency_check;
alter table public.settings add constraint settings_year_savings_currency_check
  check (year_savings_currency ~ '^[A-Z]{3}$');

-- ─────────────────────────────────────────────────────────────
-- Views (recreated; monthly_summary depends on trip_summaries)
-- ─────────────────────────────────────────────────────────────

drop view if exists public.held_by_account;
drop view if exists public.account_monthly_flows;
drop view if exists public.daily_spending;
drop view if exists public.monthly_summary;
drop view if exists public.trip_summaries;
drop view if exists public.debt_progress;

-- For each person, "added" grows what is outstanding and "paid" settles it:
--   i_owe           added = income tagged (borrowed more)    paid = expense tagged (repaid)
--   owed_to_me      added = expense tagged (lent)            paid = income tagged (received back)
--   held_for_other  added = income tagged (they gave me)     paid = expense tagged (given back)
--   gift_received   never outstanding
create view public.debt_progress with (security_invoker = true) as
select
  d.id as debt_id,
  d.user_id,
  d.direction,
  d.principal_minor,
  coalesce(f.added, 0)::bigint as added_minor,
  coalesce(f.paid, 0)::bigint as paid_minor,
  case when d.direction = 'gift_received' then 0
       else greatest(d.principal_minor + coalesce(f.added, 0) - coalesce(f.paid, 0), 0)::bigint end as remaining_minor,
  f.last_paid_on
from public.debts d
left join lateral (
  select
    sum(t.amount_minor) filter (where t.kind = case when d.direction = 'owed_to_me' then 'expense' else 'income' end) as added,
    sum(t.amount_minor) filter (where t.kind = case when d.direction = 'owed_to_me' then 'income' else 'expense' end) as paid,
    max(t.occurred_on) filter (where t.kind = case when d.direction = 'owed_to_me' then 'income' else 'expense' end) as last_paid_on
  from public.transactions t
  where t.debt_id = d.id and t.kind in ('income', 'expense')
) f on true;

create view public.trip_summaries with (security_invoker = true) as
select
  t.id as trip_id,
  t.user_id,
  t.kind,
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

-- As in 0001, plus: money from people (deposits, repayments, borrowing) is not income.
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
    sum(t.amount_minor) filter (where t.kind = 'income' and t.trip_id is null and t.debt_id is null) as income,
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

-- Personal spending per day and currency (same rule as monthly_summary).
create view public.daily_spending with (security_invoker = true) as
select
  t.user_id,
  t.occurred_on as day,
  a.currency,
  sum(t.amount_minor)::bigint as personal_spent_minor,
  count(*)::integer as entries
from public.transactions t
join public.accounts a on a.id = t.account_id
left join public.categories c on c.id = t.category_id
where t.kind = 'expense' and t.trip_id is null and t.debt_id is null and t.source <> 'trading'
  and coalesce(c.category_group, 'personal') not in ('giving', 'trading', 'debt')
group by t.user_id, t.occurred_on, a.currency;

-- Net movement per account and month. own_net_minor leaves out money moving for people I hold money for,
-- so savings growth is not inflated by their deposits.
create view public.account_monthly_flows with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  date_trunc('month', t.occurred_on)::date as month,
  sum(m.amount)::bigint as net_minor,
  sum(m.amount) filter (where d.direction is distinct from 'held_for_other')::bigint as own_net_minor
from public.accounts a
join public.transactions t on t.account_id = a.id or t.to_account_id = a.id
left join public.debts d on d.id = t.debt_id
cross join lateral (
  select case
    when t.kind = 'income' and t.account_id = a.id then t.amount_minor
    when t.kind = 'expense' and t.account_id = a.id then -t.amount_minor
    when t.kind = 'transfer' and t.to_account_id = a.id then t.amount_minor
    when t.kind = 'transfer' and t.account_id = a.id then -t.amount_minor
    else 0
  end as amount
) m
group by a.id, a.user_id, 3;

-- How much of each account's balance belongs to people I keep money for.
create view public.held_by_account with (security_invoker = true) as
select
  x.account_id,
  x.user_id,
  sum(x.amount)::bigint as held_minor
from (
  select t.account_id, t.user_id,
         case when t.kind = 'income' then t.amount_minor else -t.amount_minor end as amount
  from public.transactions t
  join public.debts d on d.id = t.debt_id
  where d.direction = 'held_for_other' and t.kind in ('income', 'expense')
  union all
  select d.account_id, d.user_id, d.principal_minor
  from public.debts d
  where d.direction = 'held_for_other' and d.account_id is not null and d.principal_minor > 0
) x
group by x.account_id, x.user_id;

revoke all on public.debt_progress, public.trip_summaries, public.monthly_summary,
  public.daily_spending, public.account_monthly_flows, public.held_by_account from anon;
grant select on public.debt_progress, public.trip_summaries, public.monthly_summary,
  public.daily_spending, public.account_monthly_flows, public.held_by_account to authenticated;

commit;
