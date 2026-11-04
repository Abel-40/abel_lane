"use client";

import { useRouter } from "next/navigation";
import { EntryEditor } from "@/mezgeb/screens/EntryEditor";

export default function AddPage() {
  const router = useRouter();
  return (
    <EntryEditor
      onClose={() => router.push("/mezgeb")}
      onSaved={(kind) => router.push(kind === "wish" ? "/mezgeb/wishlist" : "/mezgeb")}
    />
  );
}
