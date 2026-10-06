import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), "app/lib/freestar", file), "utf8");

const PRECONNECT = [
  "https://a.pub.network/",
  "https://d.pub.network/",
  "https://c.amazon-adsystem.com",
  "https://s.amazon-adsystem.com",
  "https://btloader.com/",
  "https://api.btloader.com/",
];

// Render once per page that runs ads. Order matters: bootstrap defines
// freestar.queue before pubfig loads.
export default function FreestarHead() {
  return (
    <>
      {PRECONNECT.map((href) => (
        <link key={href} rel="preconnect" href={href} crossOrigin="anonymous" />
      ))}
      <link rel="stylesheet" href="https://a.pub.network/chesspuzzles-online/cls.css" precedence="default" />
      {/* Bootstrap */}
      <Script id="f65548e4d" data-cfasync="false" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: read("bootstrap.js") }} />
      <Script src="https://a.pub.network/chesspuzzles-online/pubfig.min.js" data-cfasync="false" strategy="afterInteractive" />
      {/* AdShield: Adblock recovery tool to monetize blocked traffic */}
      <Script id="bdlrzq" data-cfasync="false" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: read("adshield.js") }} />
      {/* Freestar Recovered */}
      <Script id="c81db7742" data-cfasync="false" strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: read("recovered.js") }} />
    </>
  );
}
