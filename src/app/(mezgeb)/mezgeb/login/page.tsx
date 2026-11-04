import type { Metadata } from "next";
import { LoginScreen } from "@/mezgeb/screens/LoginScreen";

export const metadata: Metadata = { title: "Sign in · Mezgeb" };

export default function LoginPage() {
  return <LoginScreen />;
}
