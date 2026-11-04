import type { Metadata } from "next";
import { HelpScreen } from "@/mezgeb/screens/HelpScreen";

export const metadata: Metadata = { title: "Help · Mezgeb" };

export default function HelpPage() {
  return <HelpScreen />;
}
