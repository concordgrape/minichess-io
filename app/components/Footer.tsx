"use client";

import { useLocale } from "@/app/i18n/LocaleProvider";

export default function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="border-top mt-auto py-3 text-center text-muted small">
      <span>{locale.footer.copyright(new Date().getFullYear())}</span>
    </footer>
  );
}
