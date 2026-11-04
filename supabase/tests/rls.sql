-- Mezgeb · security and integrity checks
--
-- Paste into the Supabase SQL editor and run. Everything happens inside one
-- transaction that is rolled back at the end, so no test data is left behind.
-- Success: the Results tab shows one row, "ALL CHECKS PASSED" (in psql the
-- notices also print PASS lines). Any failure stops the script with an error
-- that starts with "FAIL" instead of showing a result.
--
-- What it proves:
--   1. A second user (even with a full aal2 session) sees, changes and deletes
--      zero rows in every table and view.
--   2. A password-only session (aal1) of the real owner sees zero rows and
--      cannot write.
--   3. The anon key cannot touch any table.
--   4. Nobody can point their rows at another user's rows through foreign keys.
--   5. Balances, trip results, debt and goal progress match the transactions.
--   6. Money kept for others, credit given and stored goods (0002) keep the
--      numbers right and never count as income or spending.
--
-- Run it after 0001_init.sql and 0002_people_goods_savings.sql.

begin;

-- Two throwaway users.
insert into auth.users (id, aud, role, email)
values
  ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'mezgeb-test-a@example.invalid'),
  ('b0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'mezgeb-test-b@example.invalid');

-- ── Act as user A with a full aal2 session and create one row in every table ──
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);

insert into public.settings (net_salary_minor, work_hours_per_month, payday_day, trading_loss_limit_minor)
values (2000000, 176, 28, 10000000);

insert into public.institutions (id, name, short_label, kind) values
  ('a1000000-0000-4000-8000-000000000001', 'Test Bank', 'TB', 'bank');

insert into public.accounts (id, institution_id, name, role, opening_balance_minor) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Inbox', 'salary_inbox', 0),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Tithe', 'tithe', 0),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'Capital', 'trading', 10000000);

insert into public.categories (id, name, kind, category_group) values
  ('a3000000-0000-4000-8000-000000000001', 'Taxi', 'expense', 'personal'),
  ('a3000000-0000-4000-8000-000000000002', 'Salary', 'income', 'work'),
  ('a3000000-0000-4000-8000-000000000003', 'Debt payment', 'expense', 'debt');

insert into public.debts (id, counterparty, direction, principal_minor) values
  ('a4000000-0000-4000-8000-000000000001', 'Friend', 'i_owe', 6000000),
  ('a4000000-0000-4000-8000-000000000002', 'Uncle', 'gift_received', 5500000);

insert into public.goals (id, name, kind, target_minor, account_id) values
  ('a5000000-0000-4000-8000-000000000001', 'Emergency', 'emergency', 3000000, 'a2000000-0000-4000-8000-000000000002');

insert into public.cities (id, name) values
  ('a6000000-0000-4000-8000-000000000001', 'City A'),
  ('a6000000-0000-4000-8000-000000000002', 'City B');

insert into public.trade_items (id, name, unit) values
  ('a7000000-0000-4000-8000-000000000001', 'Item', 'kg');

insert into public.trips (id, name, from_city_id, to_city_id, capital_account_id) values
  ('a8000000-0000-4000-8000-000000000001', 'Trip 1', 'a6000000-0000-4000-8000-000000000001',
   'a6000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000003');

insert into public.transactions (kind, account_id, amount_minor, category_id) values
  ('expense', 'a2000000-0000-4000-8000-000000000001', 12000, 'a3000000-0000-4000-8000-000000000001');

insert into public.payday_rules (id, name, kind, value, target_account_id) values
  ('a9000000-0000-4000-8000-000000000001', 'Tithe', 'percent_of_salary', 1000, 'a2000000-0000-4000-8000-000000000002'),
  ('a9000000-0000-4000-8000-000000000002', 'Rest', 'remainder', 0, 'a2000000-0000-4000-8000-000000000003');

-- payday + allocations through the RPC (also checks that totals must match)
select public.mz_record_payday(current_date, 2000000, 'a2000000-0000-4000-8000-000000000001',
  'a3000000-0000-4000-8000-000000000002',
  '[{"rule_id":"a9000000-0000-4000-8000-000000000001","name":"Tithe","target_account_id":"a2000000-0000-4000-8000-000000000002","goal_id":"a5000000-0000-4000-8000-000000000001","amount_minor":200000},
    {"rule_id":"a9000000-0000-4000-8000-000000000002","name":"Rest","target_account_id":"a2000000-0000-4000-8000-000000000003","amount_minor":1800000}]'::jsonb);

insert into public.price_logs (item_id, city_id, price_minor) values
  ('a7000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 35000);

-- 2.5 kg bought at 1,000.00 and sold at 1,300.00; costs 150.00
insert into public.trip_lines (id, trip_id, item_id, quantity, buy_unit_minor) values
  ('aa000000-0000-4000-8000-000000000001', 'a8000000-0000-4000-8000-000000000001',
   'a7000000-0000-4000-8000-000000000001', 2.5, 100000);
update public.trip_lines set sell_unit_minor = 130000, sold_on = current_date
  where id = 'aa000000-0000-4000-8000-000000000001';
insert into public.trip_costs (trip_id, kind, amount_minor) values
  ('a8000000-0000-4000-8000-000000000001', 'transport', 15000);

insert into public.wishes (id, name, amount_minor) values
  ('ab000000-0000-4000-8000-000000000001', 'Watch', 180000);

insert into public.fx_rates (base, quote, rate) values ('USD', 'ETB', 125.5);

-- a debt payment from the inbox
insert into public.transactions (kind, account_id, amount_minor, category_id, debt_id, source) values
  ('expense', 'a2000000-0000-4000-8000-000000000001', 800000, 'a3000000-0000-4000-8000-000000000003',
   'a4000000-0000-4000-8000-000000000001', 'debt');

-- tick the tithe allocation
select public.mz_move_allocation(id) from public.payday_allocations where name = 'Tithe';

-- ── 5. Integrity: numbers agree with the transactions ──
do $$
declare
  v bigint;
  r record;
  t text;
  n integer;
begin
  -- every table has at least one row for user A
  foreach t in array array['settings','institutions','accounts','categories','debts','goals','cities',
    'trade_items','trips','transactions','payday_rules','paydays','payday_allocations','price_logs',
    'trip_lines','trip_costs','wishes','fx_rates'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n = 0 then raise exception 'FAIL: owner cannot see own rows in %', t; end if;
  end loop;

  -- Inbox: +20,000.00 salary − 120.00 taxi − 8,000.00 debt − 2,000.00 tithe moved = 9,880.00
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000001';
  if v <> 988000 then raise exception 'FAIL: inbox balance % <> 988000', v; end if;

  -- Capital: 100,000.00 − 2,500.00 bought − 150.00 cost + 3,250.00 sold = 100,600.00
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000003';
  if v <> 10060000 then raise exception 'FAIL: capital balance % <> 10060000', v; end if;

  select * into r from public.trip_summaries where trip_id = 'a8000000-0000-4000-8000-000000000001';
  if r.purchases_minor <> 250000 or r.sales_minor <> 325000 or r.costs_minor <> 15000 or r.net_minor <> 60000 then
    raise exception 'FAIL: trip summary %', row_to_json(r);
  end if;
  if r.net_margin_percent <> 22.6 then raise exception 'FAIL: trip margin % <> 22.6', r.net_margin_percent; end if;

  select remaining_minor into v from public.debt_progress where debt_id = 'a4000000-0000-4000-8000-000000000001';
  if v <> 5200000 then raise exception 'FAIL: debt remaining % <> 5200000', v; end if;
  select remaining_minor into v from public.debt_progress where debt_id = 'a4000000-0000-4000-8000-000000000002';
  if v <> 0 then raise exception 'FAIL: a gift must never count as debt (%)', v; end if;

  select saved_minor into v from public.goal_progress where goal_id = 'a5000000-0000-4000-8000-000000000001';
  if v <> 200000 then raise exception 'FAIL: goal saved % <> 200000', v; end if;

  select personal_spent_minor into v from public.monthly_summary where month = date_trunc('month', current_date)::date;
  if v <> 12000 then raise exception 'FAIL: personal spending % <> 12000 (debt and trading must be excluded)', v; end if;
  select tithe_set_aside_minor into v from public.monthly_summary where month = date_trunc('month', current_date)::date;
  if v <> 200000 then raise exception 'FAIL: tithe set aside % <> 200000', v; end if;

  -- payday allocations must add up to the salary
  begin
    perform public.mz_record_payday(current_date, 2000000, 'a2000000-0000-4000-8000-000000000001', null,
      '[{"name":"Short","target_account_id":"a2000000-0000-4000-8000-000000000002","amount_minor":100}]'::jsonb);
    raise exception 'FAIL: payday with unbalanced allocations was accepted';
  exception when check_violation then null;
  end;

  -- a wish cannot be bought before its 48 hours are over
  begin
    perform public.mz_buy_wish('ab000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', null);
    raise exception 'FAIL: wish bought before 48 hours';
  exception when check_violation then null;
  end;

  -- removing a sale removes its transaction; deleting the trip removes the rest
  update public.trip_lines set sell_unit_minor = null, sold_on = null where id = 'aa000000-0000-4000-8000-000000000001';
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000003';
  if v <> 9735000 then raise exception 'FAIL: capital after unsell % <> 9735000', v; end if;

  -- an import upserts in one go and keeps balances consistent
  perform public.mz_import(jsonb_build_object('cities', jsonb_build_array(
    jsonb_build_object('id', 'a6000000-0000-4000-8000-000000000001', 'name', 'City A renamed'))));
  if (select name from public.cities where id = 'a6000000-0000-4000-8000-000000000001') <> 'City A renamed' then
    raise exception 'FAIL: import did not update the city';
  end if;

  raise notice 'PASS: owner integrity checks';
end $$;

-- ── 6. People, stored goods, daily spending and savings views (0002) ──
do $$
declare
  v bigint;
  r record;
begin
  insert into public.accounts (id, institution_id, name, role, opening_balance_minor) values
    ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'Savings', 'savings', 1000000);
  insert into public.debts (id, counterparty, direction, principal_minor, account_id) values
    ('a4000000-0000-4000-8000-000000000003', 'Sister', 'held_for_other', 0, 'a2000000-0000-4000-8000-000000000004'),
    ('a4000000-0000-4000-8000-000000000004', 'Neighbour', 'owed_to_me', 0, null);

  -- Sister gives me 5,000.00 to keep, I give 1,000.00 back
  insert into public.transactions (kind, account_id, amount_minor, debt_id, source) values
    ('income', 'a2000000-0000-4000-8000-000000000004', 500000, 'a4000000-0000-4000-8000-000000000003', 'debt'),
    ('expense', 'a2000000-0000-4000-8000-000000000004', 100000, 'a4000000-0000-4000-8000-000000000003', 'debt');
  -- I lend Neighbour 3,000.00 from the inbox and 1,000.00 comes back
  insert into public.transactions (kind, account_id, amount_minor, debt_id, source) values
    ('expense', 'a2000000-0000-4000-8000-000000000001', 300000, 'a4000000-0000-4000-8000-000000000004', 'debt'),
    ('income', 'a2000000-0000-4000-8000-000000000001', 100000, 'a4000000-0000-4000-8000-000000000004', 'debt');

  select remaining_minor into v from public.debt_progress where debt_id = 'a4000000-0000-4000-8000-000000000003';
  if v <> 400000 then raise exception 'FAIL: held for sister % <> 400000', v; end if;
  select remaining_minor into v from public.debt_progress where debt_id = 'a4000000-0000-4000-8000-000000000004';
  if v <> 200000 then raise exception 'FAIL: owed by neighbour % <> 200000', v; end if;
  select remaining_minor into v from public.debt_progress where debt_id = 'a4000000-0000-4000-8000-000000000001';
  if v <> 5200000 then raise exception 'FAIL: friend loan changed to %', v; end if;
  select held_minor into v from public.held_by_account where account_id = 'a2000000-0000-4000-8000-000000000004';
  if v <> 400000 then raise exception 'FAIL: held in savings % <> 400000', v; end if;
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000004';
  if v <> 1400000 then raise exception 'FAIL: savings balance % <> 1400000', v; end if;

  -- money from and to people is neither income nor spending
  select income_minor into v from public.monthly_summary where month = date_trunc('month', current_date)::date;
  if v <> 2000000 then raise exception 'FAIL: income % <> 2000000 (people money must be excluded)', v; end if;
  select personal_spent_minor into v from public.monthly_summary where month = date_trunc('month', current_date)::date;
  if v <> 12000 then raise exception 'FAIL: personal spending % <> 12000 after people entries', v; end if;
  select personal_spent_minor into v from public.daily_spending where day = current_date and currency = 'ETB';
  if v <> 12000 then raise exception 'FAIL: spent today % <> 12000', v; end if;

  -- goods kept in store: a stock holding has no destination yet
  insert into public.trips (id, name, kind, from_city_id, capital_account_id) values
    ('a8000000-0000-4000-8000-000000000002', 'Stored coffee', 'stock', 'a6000000-0000-4000-8000-000000000001',
     'a2000000-0000-4000-8000-000000000004');
  insert into public.trip_lines (trip_id, item_id, quantity, buy_unit_minor) values
    ('a8000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000001', 10, 50000);
  select * into r from public.trip_summaries where trip_id = 'a8000000-0000-4000-8000-000000000002';
  if r.kind <> 'stock' or r.unsold_stock_minor <> 500000 then raise exception 'FAIL: stock summary %', row_to_json(r); end if;
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000004';
  if v <> 900000 then raise exception 'FAIL: savings after buying goods % <> 900000', v; end if;

  begin
    update public.trips set kind = 'trip' where id = 'a8000000-0000-4000-8000-000000000002';
    raise exception 'FAIL: a trip without a destination was accepted';
  exception when check_violation then null;
  end;
  update public.trips set kind = 'trip', to_city_id = 'a6000000-0000-4000-8000-000000000002'
    where id = 'a8000000-0000-4000-8000-000000000002';

  -- savings growth leaves out the sister's money
  select net_minor, own_net_minor into r from public.account_monthly_flows
    where account_id = 'a2000000-0000-4000-8000-000000000004' and month = date_trunc('month', current_date)::date;
  if r.net_minor <> -100000 or r.own_net_minor <> -500000 then raise exception 'FAIL: savings flows %', row_to_json(r); end if;

  raise notice 'PASS: people, stored goods, daily spending and savings views';
end $$;

-- ── 1 + 4. Act as user B with a full aal2 session ──
select set_config('request.jwt.claims',
  '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}', true);

do $$
declare
  t text;
  n integer;
begin
  foreach t in array array['settings','institutions','accounts','categories','debts','goals','cities',
    'trade_items','trips','transactions','payday_rules','paydays','payday_allocations','price_logs',
    'trip_lines','trip_costs','wishes','fx_rates'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then raise exception 'FAIL: user B can read % rows of %', n, t; end if;
    execute format('update public.%I set updated_at = now()', t);
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: user B updated % rows of %', n, t; end if;
    execute format('delete from public.%I', t);
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: user B deleted % rows of %', n, t; end if;
  end loop;

  foreach t in array array['account_balances','debt_progress','goal_progress','trip_summaries','monthly_summary',
    'daily_spending','account_monthly_flows','held_by_account'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then raise exception 'FAIL: user B can read % rows of view %', n, t; end if;
  end loop;

  -- cannot write rows that claim to be user A's
  begin
    insert into public.institutions (user_id, name, short_label) values ('a0000000-0000-4000-8000-000000000001', 'X', 'X');
    raise exception 'FAIL: user B inserted a row owned by user A';
  exception when insufficient_privilege then null;
  end;

  -- cannot point own rows at user A's rows (composite foreign keys)
  begin
    insert into public.accounts (institution_id, name) values ('a1000000-0000-4000-8000-000000000001', 'Steal');
    raise exception 'FAIL: account linked to user A''s institution';
  exception when foreign_key_violation then null;
  end;

  begin
    insert into public.debts (counterparty, direction, principal_minor, account_id)
    values ('Steal', 'held_for_other', 0, 'a2000000-0000-4000-8000-000000000001');
    raise exception 'FAIL: person linked to user A''s account';
  exception when foreign_key_violation then null;
  end;

  insert into public.institutions (id, name, short_label) values ('b1000000-0000-4000-8000-000000000001', 'B Bank', 'BB');
  insert into public.accounts (id, institution_id, name) values ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'B cash');

  begin
    insert into public.transactions (kind, account_id, amount_minor) values ('expense', 'a2000000-0000-4000-8000-000000000001', 100);
    raise exception 'FAIL: transaction on user A''s account';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.transactions (kind, account_id, to_account_id, amount_minor)
    values ('transfer', 'b2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 100);
    raise exception 'FAIL: transfer into user A''s account';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.transactions (kind, account_id, amount_minor, category_id)
    values ('expense', 'b2000000-0000-4000-8000-000000000001', 100, 'a3000000-0000-4000-8000-000000000001');
    raise exception 'FAIL: transaction using user A''s category';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.transactions (kind, account_id, amount_minor, debt_id)
    values ('expense', 'b2000000-0000-4000-8000-000000000001', 100, 'a4000000-0000-4000-8000-000000000001');
    raise exception 'FAIL: payment against user A''s debt';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.trip_costs (trip_id, kind, amount_minor) values ('a8000000-0000-4000-8000-000000000001', 'food', 100);
    raise exception 'FAIL: cost added to user A''s trip';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.price_logs (item_id, city_id, price_minor) values ('a7000000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', 100);
    raise exception 'FAIL: price logged on user A''s item';
  exception when foreign_key_violation then null;
  end;

  -- RPCs cannot reach user A's rows either
  begin
    perform public.mz_move_allocation(id) from (select 'a0000000-0000-4000-8000-0000000000ff'::uuid as id) x;
    raise exception 'FAIL: unknown allocation was moved';
  exception when no_data_found then null;
  end;
  begin
    perform public.mz_buy_wish('ab000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', null);
    raise exception 'FAIL: user B bought user A''s wish';
  exception when no_data_found then null;
  end;
  begin
    perform public.mz_import('{"institutions":[{"id":"a1000000-0000-4000-8000-000000000001","name":"Hijack","short_label":"HJ","kind":"bank"}]}'::jsonb);
    raise exception 'FAIL: user B overwrote user A''s institution through import';
  exception when insufficient_privilege or unique_violation then null;
  end;

  raise notice 'PASS: second user sees and changes nothing of user A';
end $$;

-- ── 2. Act as user A with a password-only (aal1) session ──
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

do $$
declare
  t text;
  n integer;
begin
  foreach t in array array['settings','institutions','accounts','categories','debts','goals','cities',
    'trade_items','trips','transactions','payday_rules','paydays','payday_allocations','price_logs',
    'trip_lines','trip_costs','wishes','fx_rates',
    'account_balances','debt_progress','goal_progress','trip_summaries','monthly_summary',
    'daily_spending','account_monthly_flows','held_by_account'] loop
    execute format('select count(*) from public.%I', t) into n;
    if n <> 0 then raise exception 'FAIL: aal1 session can read % rows of %', n, t; end if;
  end loop;

  begin
    insert into public.cities (name) values ('Sneaky');
    raise exception 'FAIL: aal1 session inserted a row';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.mz_import('{"cities":[{"id":"ac000000-0000-4000-8000-000000000001","name":"Sneaky"}]}'::jsonb);
    raise exception 'FAIL: aal1 session imported data';
  exception when insufficient_privilege then null;
  end;

  raise notice 'PASS: password-only session sees nothing and writes nothing';
end $$;

-- ── Back to user A (aal2): deleting a trip removes its mirrored transactions ──
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);

do $$
declare
  v bigint;
begin
  delete from public.trips where id = 'a8000000-0000-4000-8000-000000000001';
  select balance_minor into v from public.account_balances where account_id = 'a2000000-0000-4000-8000-000000000003';
  if v <> 10000000 then raise exception 'FAIL: capital after trip delete % <> 10000000', v; end if;
  raise notice 'PASS: deleting a trip keeps balances consistent';
end $$;

-- ── 3. Act as anon (the public key without any session) ──
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  t text;
begin
  foreach t in array array['settings','institutions','accounts','categories','debts','goals','cities',
    'trade_items','trips','transactions','payday_rules','paydays','payday_allocations','price_logs',
    'trip_lines','trip_costs','wishes','fx_rates',
    'account_balances','debt_progress','goal_progress','trip_summaries','monthly_summary',
    'daily_spending','account_monthly_flows','held_by_account'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL: anon can query %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  raise notice 'PASS: anon cannot query any table or view';
end $$;

reset role;
do $$ begin raise notice 'ALL CHECKS PASSED'; end $$;
-- The Supabase SQL editor shows only the last result table, not notices, so this row is what you see there.
select 'ALL CHECKS PASSED' as result;

rollback;
