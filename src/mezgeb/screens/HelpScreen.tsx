// Help: what every screen does and what the words mean. Static text, no data.
import { BackHeader } from "../components/ui";
import { Contents, Example, HelpLink, HelpSection, Path, Tip } from "../components/HelpBits";

const SECTIONS = [
  { id: "start", title: "Start here" },
  { id: "around", title: "Getting around" },
  { id: "home", title: "Home" },
  { id: "add", title: "Adding an entry (+)" },
  { id: "accounts", title: "Accounts" },
  { id: "payday", title: "Payday" },
  { id: "plan", title: "Plan" },
  { id: "people", title: "People and money" },
  { id: "savings", title: "Savings this year" },
  { id: "daily", title: "Daily spending limit" },
  { id: "wishlist", title: "Wishlist" },
  { id: "trading", title: "Trading" },
  { id: "store", title: "Goods in store" },
  { id: "entries", title: "Entries" },
  { id: "settings", title: "Settings" },
  { id: "words", title: "Words Mezgeb uses" },
  { id: "safety", title: "Safety and your data" },
  { id: "faq", title: "Common questions" },
];

export function HelpScreen() {
  return (
    <main className="mz-page mz-page--full mz-help">
      <BackHeader title="Help" subtitle="How Mezgeb works" />
      <p>
        Mezgeb (መዝገብ, “ledger”) is your private money book: where your money is, where it goes, who owes whom, and how your savings grow.
        Every number is worked out from what you record, so the more honestly you record, the more Mezgeb helps you.
      </p>
      <div className="mz-card mz-card--sm mz-card--row">
        <span className="mz-row__main" style={{ gap: 2 }}>
          <span className="mz-row__title">Need steps to add something?</span>
          <span className="mz-row__sub">Banks, accounts, expenses, payday, debts, goals, trips, stored goods…</span>
        </span>
        <HelpLink href="/mezgeb/help/add">How to add things ›</HelpLink>
      </div>
      <Contents items={SECTIONS} />

      <HelpSection id="start" title="Start here">
        <p>Do these once, in this order, and Mezgeb is ready for daily use:</p>
        <ol>
          <li>
            Check your salary, payday and tithe: <Path steps={["Home", "⚙ Settings", "Income and giving"]} />
          </li>
          <li>
            Give every account what it holds today as its <b>opening balance</b>: <Path steps={["Accounts", "tap an account", "Opening balance"]} />
          </li>
          <li>
            Check how your salary is split: <Path steps={["Home", "⚙ Settings", "Manage", "Payday rules"]} />
          </li>
          <li>
            Add a <b>backup authenticator</b> (a second phone or app): <Path steps={["Home", "⚙ Settings", "Security", "Add backup authenticator"]} />
          </li>
          <li>
            Set your yearly savings target: <Path steps={["Home", "⚙ Settings", "Spending and savings"]} />
          </li>
          <li>From now on, record every expense the moment you pay. It takes ten seconds with the + button.</li>
        </ol>
      </HelpSection>

      <HelpSection id="around" title="Getting around">
        <p>The bar at the bottom has five buttons:</p>
        <ul>
          <li>
            <b>Home</b>: today, this month, net position and recent entries.
          </li>
          <li>
            <b>Accounts</b>: every bank, wallet and cash account with its balance.
          </li>
          <li>
            <b>+</b> (the big button): add an expense, income or transfer.
          </li>
          <li>
            <b>Trading</b>: trips, goods in store and price gaps between cities.
          </li>
          <li>
            <b>Plan</b>: savings this year, debts, people, goals, plus the <b>Payday</b> and <b>Wishlist</b> buttons at the top.
          </li>
        </ul>
        <p>
          At the top of Home: <b>?</b> opens this help, <b>☀ / ☾</b> switches light and dark mode, <b>⚙</b> opens Settings.
        </p>
        <Tip>Amounts with ••••• are protected (savings, emergency, debt fund). Tap them to show the number.</Tip>
      </HelpSection>

      <HelpSection id="home" title="Home">
        <ul>
          <li>
            <b>Net position</b>: everything you own minus everything you owe (including money you only keep for other people). This is your
            real wealth.
          </li>
          <li>
            <b>Spent today</b>: today&apos;s personal spending against your daily limit, with a warning or a word of praise.
          </li>
          <li>
            <b>Spent this month</b> and how many hours of work that was; <b>Trading net</b> for trips closed this month.
          </li>
          <li>
            <b>Savings this year</b>: how far you are toward your year-end target. Tap it for details in Plan.
          </li>
          <li>The checklist: tithe set aside, emergency fund, wishes waiting.</li>
          <li>
            <b>Recent</b>: the last entries. <b>See all</b> opens every entry with filters.
          </li>
        </ul>
        <Example>
          Net position 85,000 Br = accounts 140,000 Br + stored coffee 5,000 Br + 3,000 Br your neighbour owes you − 52,000 Br friend loan −
          11,000 Br you keep for your sister.
        </Example>
      </HelpSection>

      <HelpSection id="add" title="Adding an entry (+)">
        <p>Tap the big + at the bottom. Choose the kind at the top:</p>
        <ul>
          <li>
            <b>Expense</b>: money that leaves you (taxi, food, clothes, gifts).
          </li>
          <li>
            <b>Income</b>: money you earned (salary, contract work, freelance).
          </li>
          <li>
            <b>Transfer</b>: money moving between your own accounts (CBE → Telebirr). It is not spending.
          </li>
        </ul>
        <p>
          Type the amount on the keypad, pick a category and the account, then <b>Save</b>. Under the amount Mezgeb shows how many hours of
          your work it costs.
        </p>
        <p>
          <b>Need or want:</b> when an expense is a <b>want</b>, Mezgeb offers <b>Wait 48 hours instead?</b>. That puts it on your
          wishlist instead of buying it now.
        </p>
        <Example>Taxi to work, 60 Br, from Telebirr · Spending: + › Expense › 60 › Taxi › Save. “= 0.5 h of your work”.</Example>
        <Tip>Going over your daily limit shows a warning. That is the point: stop and think before the next purchase.</Tip>
      </HelpSection>

      <HelpSection id="accounts" title="Accounts">
        <p>
          A <b>bank or wallet</b> is the institution (CBE, Telebirr). An <b>account</b> is one pot of money inside it with a job, its
          <b> role</b>:
        </p>
        <ul>
          <li>
            <b>Salary inbox</b> (where salary lands), <b>Spending</b> (daily money), <b>Tithe</b>, <b>Trading capital</b>, <b>Debt fund</b>,
            <b> Emergency</b>, <b>Savings</b>, <b>USD</b>, <b>Other</b>.
          </li>
          <li>Balances are never typed in. They are the opening balance plus everything recorded since.</li>
          <li>
            <b>Counts as savings</b> decides whether the account counts toward this year&apos;s savings (on for emergency, savings and USD).
          </li>
          <li>Accounts you no longer use can be archived; they move to “Inactive and planned”.</li>
        </ul>
        <Example>
          CBE · Salary inbox, CBE · Trading capital, Telebirr · Spending, Telebirr · Tithe, Dashen · Debt fund, Awash · Emergency and
          savings.
        </Example>
      </HelpSection>

      <HelpSection id="payday" title="Payday">
        <p>
          <Path steps={["Plan", "Payday"]} /> When your salary arrives, record it once and Mezgeb splits it by your <b>payday rules</b>:
          a percent (tithe 10 %), a fixed amount (taxi 2,500 Br), and one rule that takes <b>the remainder</b> (long-term savings).
        </p>
        <p>
          Then make each transfer in your bank or wallet app, and tap the tick next to the line in Mezgeb. The split must add up exactly to the
          salary.
        </p>
        <Example>
          20,000 Br: Tithe 2,000 → Telebirr · Tithe · Taxi and airtime 2,500 and Personal 1,500 → Telebirr · Spending · Friend loan 8,000 →
          Dashen · Debt fund · Emergency 4,000 → Awash · Rest 2,000 → Awash.
        </Example>
      </HelpSection>

      <HelpSection id="plan" title="Plan">
        <p>
          Plan holds everything about the future: <b>Savings this year</b>, <b>Debts I owe</b>, <b>Credit I gave</b>, <b>Kept for others</b>,
          gifts and <b>Goals</b>.
        </p>
        <ul>
          <li>
            <b>Debts I owe</b>: what is left, how much each salary pays, the target date and whether you are on track. Use{" "}
            <b>Record a payment</b> when you pay, <b>Borrowed more</b> when the debt grows.
          </li>
          <li>
            <b>Goals</b>: emergency fund, savings, USD savings. Money tagged with a goal counts toward it. <b>Add money</b> moves money into
            the goal&apos;s account.
          </li>
          <li>
            A <b>gift</b> (like start-up money from family) is kept for memory and never counts as debt.
          </li>
        </ul>
      </HelpSection>

      <HelpSection id="people" title="People and money">
        <p>
          Add a person, then choose the <b>Kind</b>:
        </p>
        <Path steps={["Plan", "+ Add person: debt, credit, money kept or gift", "Kind"]} />
        <h3 className="mz-help__h3">I owe</h3>
        <p>You borrowed money. It lowers your net position until you pay it back.</p>
        <h3 className="mz-help__h3">Credit I gave (owed to me)</h3>
        <p>
          You lent money. When you record the loan, the money leaves your account, and it still counts as yours (someone owes it). Use{" "}
          <b>Money received</b> when it comes back and <b>Lend more</b> for a new loan to the same person. After the pay-back date it shows{" "}
          <b>Late</b>.
        </p>
        <Example>You lend Dawit 3,000 Br from CBE. CBE drops by 3,000, “Dawit owes you 3,000”. He pays back 1,000: “2,000 owed to you”.</Example>
        <h3 className="mz-help__h3">Money I keep for someone</h3>
        <p>
          Someone gives you money to save for them. It sits in your account, but it is <b>not yours</b>: Mezgeb leaves it out of your net
          position and your savings, and never counts it as income or spending. Use <b>They gave more</b> and <b>Give back</b>.
        </p>
        <Example>
          Your sister gives you 5,000 Br to keep in Awash. Awash shows 5,000 more, but your net position and savings do not change. You give
          her 1,000 back: “4,000 of Sister&apos;s money”.
        </Example>
      </HelpSection>

      <HelpSection id="savings" title="Savings this year">
        <p>
          Your savings are the accounts marked <b>Counts as savings</b>, minus money you keep for others, plus stored goods (if you choose).
          USD is converted with your exchange rate.
        </p>
        <ul>
          <li>
            <b>Since 1 Jan</b>: how much your own savings grew this year (deposits from other people are left out).
          </li>
          <li>
            <b>31 Dec at this pace</b>: where you end the year if you keep saving like this (shown from the second week of January).
          </li>
          <li>
            <b>Needs … a month</b>: what you must save each month, this month included, to reach the target.
          </li>
        </ul>
        <p>
          Set the target and its currency in <Path steps={["⚙ Settings", "Spending and savings", "Target on 31 December"]} />
        </p>
        <Example>
          Target 150,000 Br. On 2 July you have 95,000 Br, and you saved 48,000 since January. At this pace you end the year with about
          143,000 Br: “Behind”, and you need 9,167 Br a month for the 6 months left.
        </Example>
      </HelpSection>

      <HelpSection id="daily" title="Daily spending limit">
        <p>
          <b>Auto</b> (the default): your monthly spending budget from the payday rules that send money to <b>Spending</b> accounts, divided by
          the days of the month. You can type your own amount or turn it off in{" "}
          <Path steps={["⚙ Settings", "Spending and savings", "Daily spending limit"]} />
        </p>
        <ul>
          <li>Only personal spending counts. Tithe, giving, trading, debt payments and money for other people never do.</li>
          <li>Over the limit: Mezgeb shows one of 100 hard warnings about poverty. Read it, and stop for today.</li>
          <li>Under the limit, moving money into savings, or letting a wish go: one of 100 words of praise.</li>
          <li>Home also shows your streak (days in a row under the limit) and how many days this month went over.</li>
        </ul>
        <Example>Taxi 2,500 + Personal 1,500 = 4,000 Br a month. In a 30-day month that is 133.33 Br a day.</Example>
      </HelpSection>

      <HelpSection id="wishlist" title="Wishlist (the 48-hour rule)">
        <p>
          <Path steps={["Plan", "Wishlist"]} /> Every want waits 48 hours. When it is ready, choose <b>Still want it</b> (records the purchase)
          or <b>Let it go</b>. The top card shows how much you kept this month by letting go, and how many hours of work that is.
        </p>
        <Example>Shoes, 1,800 Br = 16 hours of work. After two days you let them go: “Kept by letting go: 1,800 Br”.</Example>
      </HelpSection>

      <HelpSection id="trading" title="Trading">
        <ul>
          <li>
            <b>Capital</b>: trading accounts plus goods not sold yet. <b>Net</b> and <b>Margin</b> are for trips closed this month.
          </li>
          <li>
            A <b>trip</b> goes from one city to another. Add the <b>goods</b> you buy (they are paid from the capital account), the{" "}
            <b>costs on the way</b> (transport, food, lodging), then <b>Record sale</b> for each item. Close the trip when everything is
            sold.
          </li>
          <li>
            <b>Price gaps</b>: log prices you see in each city, and Mezgeb says <b>go</b> (the gap beats your usual costs by your target
            margin), <b>ok</b> (it covers costs) or <b>skip</b>.
          </li>
          <li>The amber warning appears when capital falls below your <b>Trading loss limit</b> (Settings › Income and giving).</li>
        </ul>
        <Example>
          Arba Minch → Addis Ababa: 50 kg coffee at 350 Br = 17,500; transport 1,200, food 400, lodging 600; sold at 430 Br = 21,500. Net
          1,800 Br, margin 9.1 % (1,800 ÷ 19,700).
        </Example>
      </HelpSection>

      <HelpSection id="store" title="Goods in store">
        <p>
          Sometimes you keep money as goods instead of cash. <Path steps={["Trading", "+ Store goods"]} /> records goods you buy and keep. You
          can pay from any account, even savings. They count at what you paid, in your net position and (if you choose) your savings.
        </p>
        <p>
          Later, either sell them where they are (<b>Record sale</b>), or tap <b>Take these goods on a trip</b>: the same goods become a trip with a
          destination.
        </p>
        <Example>You buy 20 kg of coffee in Arba Minch for 7,000 Br from Awash savings to protect your money from price rises. Three months later you take it to Addis Ababa.</Example>
      </HelpSection>

      <HelpSection id="entries" title="Entries">
        <p>
          <Path steps={["Home", "Recent", "See all"]} /> lists every entry by month. Filter by kind, account or category, and tap an entry to
          edit or delete it. Entries made by payday or trips are changed from their own screen.
        </p>
      </HelpSection>

      <HelpSection id="settings" title="Settings">
        <ul>
          <li>
            <b>Income and giving</b>: net salary, work hours (for “hours of work”), payday, tithe, trading loss limit.
          </li>
          <li>
            <b>Spending and savings</b>: daily limit, savings target, whether stored goods count.
          </li>
          <li>
            <b>Appearance</b>: Dark, Light or System (follows your phone).
          </li>
          <li>
            <b>Manage</b>: banks and accounts, categories, payday rules, cities and trade items, exchange rates.
          </li>
          <li>
            <b>Security</b>: authenticators, lock time, hide balances.
          </li>
          <li>
            <b>Your data</b>: export and import backups. <b>Install app</b> appears when your browser can install Mezgeb.
          </li>
          <li>
            <b>Danger zone</b>: delete all your data and start again (your login stays).
          </li>
        </ul>
      </HelpSection>

      <HelpSection id="words" title="Words Mezgeb uses">
        <ul>
          <li>
            <b>Net position</b>: what you own minus what you owe.
          </li>
          <li>
            <b>Hours of work</b>: amount ÷ (net salary ÷ work hours per month). 1,800 Br at 20,000 Br / 176 h ≈ 16 hours.
          </li>
          <li>
            <b>Opening balance</b>: what an account held on the day you started using Mezgeb.
          </li>
          <li>
            <b>Protected</b>: a balance hidden as ••••• until tapped.
          </li>
          <li>
            <b>Remainder rule</b>: the payday rule that takes whatever is left after the others.
          </li>
          <li>
            <b>Archived</b>: hidden from daily use but kept, because entries still point to it.
          </li>
          <li>
            <b>Margin</b>: trip net ÷ (goods bought + costs).
          </li>
        </ul>
      </HelpSection>

      <HelpSection id="safety" title="Safety and your data">
        <ul>
          <li>Signing in always needs your password and the 6-digit code from your authenticator app. Nobody can sign up.</li>
          <li>
            Mezgeb locks itself after a few minutes without use (<b>Lock after inactivity</b> in Security).
          </li>
          <li>
            Add a backup authenticator. Supabase has no recovery codes: if you lose your only phone, you are locked out. In that case, in the
            Supabase dashboard go to Authentication › Users › your user and delete its MFA factors, then sign in and set it up again.
          </li>
          <li>
            Export a backup every month: <Path steps={["⚙ Settings", "Your data", "Export backup"]} /> Keep the file off your phone too.
          </li>
          <li>
            The free database pauses after about a week without use. Open Mezgeb at least once a week; if it pauses, tap <b>Restore project</b>{" "}
            in the Supabase dashboard. Your data is kept.
          </li>
          <li>Your data is never stored on the phone: it is always read live from the database.</li>
        </ul>
      </HelpSection>

      <HelpSection id="faq" title="Common questions">
        <h3 className="mz-help__h3">A balance is wrong.</h3>
        <p>
          Check the account&apos;s opening balance (Accounts › tap the account), then look for a missing or doubled entry in Home › See all,
          filtered by that account.
        </p>
        <h3 className="mz-help__h3">I moved money between my accounts and it shows as spending.</h3>
        <p>Record it as a Transfer, not an Expense. Delete the expense and add a transfer instead.</p>
        <h3 className="mz-help__h3">The daily limit says “no budget yet”.</h3>
        <p>Add a payday rule whose target is a Spending account, or set your own limit in Settings › Spending and savings.</p>
        <h3 className="mz-help__h3">My USD savings are left out.</h3>
        <p>Add an exchange rate: Settings › Manage › Exchange rates (for example USD → ETB 125.5). The newest rate is used.</p>
        <h3 className="mz-help__h3">I want to start again from zero.</h3>
        <p>
          Settings › Danger zone › Delete all my data… Download the backup it offers first, type DELETE ALL, and the setup wizard opens again.
        </p>
      </HelpSection>

      <p className="mz-note" style={{ marginTop: 8 }}>
        Step-by-step guides for adding everything: <HelpLink href="/mezgeb/help/add">How to add things</HelpLink>.
      </p>
    </main>
  );
}
