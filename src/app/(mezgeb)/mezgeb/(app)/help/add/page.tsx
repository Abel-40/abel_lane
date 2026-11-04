import type { Metadata } from "next";
import { HelpAddScreen } from "@/mezgeb/screens/HelpAddScreen";

export const metadata: Metadata = { title: "How to add things · Mezgeb" };

export default function HelpAddPage() {
  return <HelpAddScreen />;
}
