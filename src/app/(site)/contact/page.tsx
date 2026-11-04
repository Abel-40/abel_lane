import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ContactView } from "@/components/contact/ContactView";
import "@/styles/contact.css";

export const metadata: Metadata = pageMeta({
  path: "/contact",
  title: "Contact",
  description:
    "Hiring for a backend or AI role, or need a FastAPI service built? Contact Abel Addis. Open to remote backend, AI systems and freelance work.",
});

export default function ContactPage() {
  return <ContactView />;
}
