"use client";

import Link from "next/link";
import { useLocale } from "@/app/i18n/LocaleProvider";

export default function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="border-top mt-auto py-3 text-center link-body-emphasis link-opacity-75 small">
      <span>{locale.footer.copyright(new Date().getFullYear())}</span>
      <span className="mx-2">·</span>
      <Link href="/privacy-policy" className="link-body-emphasis link-opacity-75 link-opacity-100-hover">{locale.footer.privacy}</Link>
      {/* Freestar/Sourcepoint resurfacing link; the CMP shows it only where required. */}
      <button id="pmLink" className="d-block mx-auto link-body-emphasis link-opacity-75 link-opacity-100-hover text-decoration-underline border-0 bg-transparent p-0">Privacy Manager</button>
    </footer>
  );
}
