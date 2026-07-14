"use client";

import Link from "next/link";
import { useLocale } from "@/app/i18n/LocaleProvider";

export default function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="border-top mt-auto py-3 text-center text-muted small">
      <span>{locale.footer.copyright(new Date().getFullYear())}</span>
      <span className="mx-2">·</span>
      <Link href="/privacy-policy" className="text-muted">{locale.footer.privacy}</Link>
    </footer>
  );
}
