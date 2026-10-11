import type { Metadata } from "next";
import { NotFoundView } from "@/components/chrome/NotFoundView";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return <NotFoundView />;
}
