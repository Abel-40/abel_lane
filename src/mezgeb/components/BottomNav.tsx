"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountsIcon, HomeIcon, PlanIcon, PlusIcon, TradingIcon } from "./Icons";

const ITEMS = [
  { href: "/mezgeb", label: "Home", Icon: HomeIcon, match: (p: string) => p === "/mezgeb" || p.startsWith("/mezgeb/transactions") },
  { href: "/mezgeb/accounts", label: "Accounts", Icon: AccountsIcon, match: (p: string) => p.startsWith("/mezgeb/accounts") },
  { href: "/mezgeb/trading", label: "Trading", Icon: TradingIcon, match: (p: string) => p.startsWith("/mezgeb/trading") },
  { href: "/mezgeb/plan", label: "Plan", Icon: PlanIcon, match: (p: string) => p.startsWith("/mezgeb/plan") },
];

export function BottomNav() {
  const path = (usePathname() ?? "").replace(/\/$/, "");
  const [home, accounts, trading, plan] = ITEMS;
  const item = (i: (typeof ITEMS)[number]) => (
    <Link key={i.href} href={i.href} aria-current={i.match(path) ? "page" : undefined}>
      <i.Icon />
      {i.label}
    </Link>
  );
  return (
    <nav aria-label="Main" className="mz-nav">
      {item(home)}
      {item(accounts)}
      <Link href="/mezgeb/add" aria-label="Add entry" className="mz-nav__add">
        <PlusIcon />
      </Link>
      {item(trading)}
      {item(plan)}
    </nav>
  );
}
