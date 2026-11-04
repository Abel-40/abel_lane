import { AppShell } from "@/mezgeb/components/AppShell";

export default function MezgebAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
