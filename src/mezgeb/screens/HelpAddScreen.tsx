// Help › How to add things: one recipe per thing, with the exact path and an example. Static text, no data.
import type { ReactNode } from "react";
import { BackHeader } from "../components/ui";
import { Contents, Example, HelpLink, HelpSection, Path, Tip } from "../components/HelpBits";

type Recipe = { id: string; title: string; path: string[]; steps: ReactNode[]; example: ReactNode; tip?: ReactNode };

const RECIPES: Recipe[] = [
  {
    id: "bank",
    title: "A bank or wallet",
    path: ["Accounts", "+ Add", "New bank or wallet"],
    steps: [
      "Type the full name and a short badge label (up to 6 letters).",
      "Choose the kind: Bank, Mobile wallet, Cash or Other, and a badge colour.",
      "Tap Save. Then add the accounts you have there (next recipe).",
    ],
    example: (
      <>
        Name <b>Bank of Abyssinia</b>, short label <b>BOA</b>, kind <b>Bank</b>, colour <b>Gold</b>.
      </>
    ),
  },
  {
    id: "account",
    title: "An account",
    path: ["Accounts", "+ Add", "New account"],
    steps: [
      "Pick the bank or wallet (or None for cash).",
      "Name it after its job, never with the account number.",
      "Choose the role (Spending, Savings, Emergency…) and the currency.",
      "Opening balance: what it holds today.",
      "Turn on Counts as savings if it should count toward this year's savings, and Protected to hide its balance.",
      "Tap Save.",
    ],
    example: (
      <>
        Bank <b>Telebirr</b>, name <b>Spending</b>, role <b>Spending</b>, currency <b>ETB</b>, opening balance <b>850</b>.
      </>
    ),
    tip: "Start with the real balance of today. Never type balances later: record entries instead, and the balance follows.",
  },
  {
    id: "expense",
    title: "An expense",
    path: ["+ (bottom bar)", "Expense"],
    steps: [
      "Type the amount on the keypad.",
      "Tap a category (or + New to make one).",
      "Check the account under From.",
      "Need or want: if it is a want, consider Wait 48 hours instead?",
      "Tap Save. A warning appears if today goes over your daily limit.",
    ],
    example: (
      <>
        Lunch, <b>180</b> Br, category <b>Eating out</b>, from <b>Telebirr · Spending</b>, Need.
      </>
    ),
  },
  {
    id: "income",
    title: "Income (not salary)",
    path: ["+ (bottom bar)", "Income"],
    steps: ["Type the amount.", "Choose the category (Contract work, Freelance…).", "Choose the account it arrived in, then Save."],
    example: (
      <>
        Website job, <b>5,000</b> Br, category <b>Freelance</b>, into <b>CBE · Salary inbox</b>.
      </>
    ),
    tip: "Your monthly salary is recorded on the Payday screen, not here, so it is split by your rules.",
  },
  {
    id: "transfer",
    title: "A transfer between your accounts",
    path: ["+ (bottom bar)", "Transfer"],
    steps: [
      "Type the amount.",
      "From: where the money leaves. Move to: where it arrives (same currency).",
      "Optionally tag a goal (For goal), then Save.",
    ],
    example: (
      <>
        <b>1,000</b> Br from <b>CBE · Salary inbox</b> to <b>Telebirr · Spending</b>. This is not spending.
      </>
    ),
    tip: "Moving money into a savings account shows a word of praise.",
  },
  {
    id: "category",
    title: "A category",
    path: ["⚙ Settings", "Manage", "Categories", "+ Add category"],
    steps: [
      "Name it and choose Expense or Income.",
      "Choose the group: Personal, Giving, Trading, Debt, Work or Other. Only Personal counts toward the daily limit.",
      "For expenses, turn on Usually a need when it is a need (wants are offered the 48-hour wait). Save.",
    ],
    example: (
      <>
        <b>School fees</b>, Expense, group <b>Personal</b>, need. You can also add one while adding an expense: tap <b>+ New</b> next to
        the categories.
      </>
    ),
  },
  {
    id: "payday",
    title: "Your salary (payday)",
    path: ["Plan", "Payday", "Record this month's payday"],
    steps: [
      "Enter the salary that arrived and the account it arrived in.",
      "Check the split. It must add up exactly; adjust a line if needed.",
      "Tap Record payday.",
      "Make each transfer in your bank or wallet app, then tap the tick next to that line. Or tap Mark remaining … as moved when all are done.",
    ],
    example: (
      <>
        Salary <b>20,000</b> Br into <b>CBE · Salary inbox</b>. Tithe 2,000 → Telebirr · Tithe ✓, Friend loan 8,000 → Dashen · Debt fund ✓…
      </>
    ),
  },
  {
    id: "rule",
    title: "A payday rule",
    path: ["⚙ Settings", "Manage", "Payday rules", "+ Add rule"],
    steps: [
      "Name it and choose the kind: Percent (of the salary), Fixed (an amount) or Remainder (what is left; only one rule can take it).",
      "Choose the target account, and optionally the goal or debt it feeds.",
      "Save. The bar at the top must say 0 Br left to assign.",
    ],
    example: (
      <>
        <b>Phone and internet</b>, Fixed <b>600</b> Br → <b>Telebirr · Spending</b>. This also raises your automatic daily limit.
      </>
    ),
  },
  {
    id: "debt",
    title: "A debt you owe",
    path: ["Plan", "+ Add person…", "Kind: I owe"],
    steps: [
      "Person, currency and the amount you borrowed.",
      "Pay off by: the target date. Priority 1 is paid first.",
      "Save. Each time you pay: Plan › the debt › Record a payment.",
    ],
    example: (
      <>
        <b>Friend loan</b>, <b>60,000</b> Br, pay off by <b>31 January</b>, priority 1. Payment of <b>8,000</b> from Dashen · Debt fund.
      </>
    ),
  },
  {
    id: "fix",
    title: "Fix a wrong or negative balance",
    path: ["Accounts", "tap the account", "Real balance now"],
    steps: [
      "Open your bank or wallet app and read the real balance.",
      "Type it in Real balance now. The hint shows the new opening balance.",
      "Save. The account now shows the real amount, and every entry stays.",
    ],
    example: (
      <>
        Trading account shows <b>−37,745</b> Br, the bank app shows <b>34,755</b> Br: type 34,755 → the opening balance becomes 107,255 and
        the account shows 34,755.
      </>
    ),
  },
  {
    id: "lend",
    title: "Credit you give (a loan to someone)",
    path: ["Plan", "+ Add person…", "Kind: Credit I gave"],
    steps: [
      "Person and currency.",
      "Lending now: the amount, the date, and Usually from: the account it leaves.",
      "Pay back by (optional). Save.",
      "When money comes back: Plan › the person › Money received. Another loan: Lend more.",
    ],
    example: (
      <>
        Lend <b>Dawit</b> <b>3,000</b> Br from <b>CBE · Salary inbox</b>, back by <b>30 December</b>. He returns 1,000: Money received
        1,000 → “2,000 owed to you”.
      </>
    ),
    tip: "Lending is not spending: it never touches your daily limit. Lend from the trading account (Usually from) and the loan still counts in Trading › Capital.",
  },
  {
    id: "keep",
    title: "Money someone gives you to keep",
    path: ["Plan", "+ Add person…", "Kind: Money I keep for someone"],
    steps: [
      "Person and currency.",
      "Given to me now: the amount and the date, and Kept in: the account where it sits.",
      "Give back by (optional). Save.",
      "More money from them: They gave more. Returning money: Give back.",
    ],
    example: (
      <>
        Your sister gives <b>5,000</b> Br, kept in <b>Awash · Emergency and savings</b>. Your net position and savings stay the same, because
        it is her money.
      </>
    ),
  },
  {
    id: "goal",
    title: "A goal, and money into it",
    path: ["Plan", "+ Add goal"],
    steps: [
      "Name, kind (Emergency fund, Savings, USD savings, Other) and a target (optional).",
      "Kept in: the account that holds it. Save.",
      "To add money: Plan › the goal › Add money, choose where it comes from.",
    ],
    example: (
      <>
        <b>Emergency fund</b>, target <b>30,000</b> Br, kept in <b>Awash</b>. Add money <b>2,000</b> from CBE · Salary inbox.
      </>
    ),
  },
  {
    id: "year",
    title: "A savings target for this year",
    path: ["⚙ Settings", "Spending and savings", "Savings this year"],
    steps: [
      "Target on 31 December, and the currency (ETB or USD; USD needs an exchange rate).",
      "Choose whether stored goods count as savings. Save.",
      "Check which accounts count: Accounts › tap an account › Counts as savings.",
    ],
    example: (
      <>
        Target <b>150,000</b> ETB, stored goods count. Plan then shows the projection for 31 December and what each month needs.
      </>
    ),
  },
  {
    id: "limit",
    title: "Your own daily spending limit",
    path: ["⚙ Settings", "Spending and savings", "Daily spending limit"],
    steps: ["Auto: from your payday budget (recommended).", "My own: type an amount per day.", "Off: no warnings. Save."],
    example: (
      <>
        My own: <b>150</b> Br a day.
      </>
    ),
  },
  {
    id: "wish",
    title: "A wish (the 48-hour rule)",
    path: ["Plan", "Wishlist", "New wish"],
    steps: [
      "Type what you want and the price, then Wait.",
      "After 48 hours it moves to Ready to decide.",
      "Still want it records the purchase (choose the account). Let it go keeps the money.",
    ],
    example: (
      <>
        <b>Headphones</b>, <b>2,400</b> Br. Two days later: Let it go → “Kept by letting go: 2,400 Br”.
      </>
    ),
  },
  {
    id: "store",
    title: "Goods you buy and keep (store of value)",
    path: ["Trading", "+ Store goods"],
    steps: [
      "Name it, choose the city where the goods are kept and the account that pays. Store goods.",
      "In the holding: + Add goods for each item: quantity and price per unit.",
      "Sell where they are: Record sale on each item, then Close (all sold).",
      "Or take them away: Take these goods on a trip, then choose the destination.",
    ],
    example: (
      <>
        <b>Coffee in store</b>, kept in <b>Arba Minch</b>, paid from <b>Awash</b>: 20 kg at 350 Br = 7,000 Br.
      </>
    ),
    tip: "Items (coffee, honey…) and cities must exist first: Settings › Manage › Cities and trade items. Goods bought before you used Mezgeb: see the next guide.",
  },
  {
    id: "before",
    title: "Goods you bought before using Mezgeb",
    path: ["Accounts", "+ Add", "New account"],
    steps: [
      "Make a cash account: Bank or wallet None, name Trading cash, role Trading capital, opening balance = what you paid for the goods.",
      "Trading › + Store goods, Paid from: Trading cash. Then + Add goods with the real date you bought them.",
      "Trading cash goes back to 0, your banks do not change, and the goods count in Trading › Capital.",
      "When you sell, the money arrives in Trading cash. Move it to the bank with a Transfer.",
    ],
    example: (
      <>
        20 kg coffee bought last month for <b>7,000</b> Br cash: Trading cash opening 7,000 → store → 0, Capital +7,000 in goods.
      </>
    ),
  },
  {
    id: "trip",
    title: "A trading trip",
    path: ["Trading", "+ New trip"],
    steps: [
      "Name, From and To cities, the trading capital account and the start date. Start trip.",
      "+ Add goods: each item, quantity and price per unit (paid from the capital account).",
      "+ Add cost: transport, food, lodging, phone, losses.",
      "Record sale on each item at the destination.",
      "Close trip when everything is sold. Net and margin are then counted for the month.",
    ],
    example: (
      <>
        <b>Trip 4</b>, Arba Minch → Addis Ababa: 50 kg coffee at 350, transport 1,200; sold at 430 → net 1,800 Br.
      </>
    ),
  },
  {
    id: "city",
    title: "A city, a trade item, a price",
    path: ["⚙ Settings", "Manage", "Cities and trade items"],
    steps: [
      "+ Add city (Hawassa…), + Add item (name, unit, target margin %).",
      "Log prices: Trading › Price gaps › Log a price: item, city, price per unit.",
      "Choose Buy in / Sell in cities above the table to see the verdict.",
    ],
    example: (
      <>
        Item <b>Honey</b>, unit <b>kg</b>, target <b>10 %</b>. Price 420 Br/kg in Hawassa and 520 Br/kg in Addis Ababa: the table shows a 23.8 % gap and whether it beats your usual trip costs (go, ok or skip).
      </>
    ),
  },
  {
    id: "rate",
    title: "An exchange rate",
    path: ["⚙ Settings", "Manage", "Exchange rates"],
    steps: ["From: USD. Rate in ETB: today's rate. Save.", "The newest rate is used for USD accounts and USD savings targets."],
    example: (
      <>
        <b>USD → 125.5 ETB</b>.
      </>
    ),
  },
  {
    id: "authenticator",
    title: "A backup authenticator",
    path: ["⚙ Settings", "Security", "Add backup authenticator"],
    steps: ["Scan the QR code with a second phone or a password manager (or type the key).", "Enter the 6-digit code it shows."],
    example: <>An old phone with Google Authenticator, kept at home.</>,
  },
  {
    id: "backup",
    title: "A backup",
    path: ["⚙ Settings", "Your data", "Export backup"],
    steps: ["A .json file downloads. Keep it somewhere safe, not only on the phone.", "To restore: Import backup, check what changes, confirm."],
    example: <>mezgeb-backup-2026-11-30.json, saved in your Google Drive.</>,
  },
];

export function HelpAddScreen() {
  return (
    <main className="mz-page mz-page--full mz-help">
      <BackHeader title="How to add things" subtitle="Step by step, with examples" href="/mezgeb/help" />
      <p>
        Each guide starts with where to tap. <b>⚙ Settings</b> is the gear at the top of Home; <b>+</b> is the big button in the bottom bar.
        Back to the <HelpLink href="/mezgeb/help">overview</HelpLink>.
      </p>
      <Contents items={RECIPES.map((r) => ({ id: r.id, title: r.title }))} />
      {RECIPES.map((r) => (
        <HelpSection key={r.id} id={r.id} title={r.title}>
          <div className="mz-help__recipe">
            <Path steps={r.path} />
            <ol>
              {r.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <Example>{r.example}</Example>
            {r.tip && <Tip>{r.tip}</Tip>}
          </div>
        </HelpSection>
      ))}
    </main>
  );
}
