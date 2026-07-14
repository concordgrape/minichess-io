import JsonLd from "./JsonLd";
import Breadcrumbs from "./Breadcrumbs";
import type { HowToPlayStep } from "./HowToPlay";

interface GameSeoProps {
  name: string;
  description: string;
  url: string;
  steps?: HowToPlayStep[];
}

export default function GameSeo({ name, description, url, steps }: GameSeoProps) {
  return (
    <>
      <Breadcrumbs items={[
        { name: "Home", url: "https://dailycheckmate.com" },
        { name, url },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name,
        description,
        url,
        gamePlatform: "Web Browser",
        applicationCategory: "Game",
        genre: "Puzzle",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Chess Puzzles", url: "https://dailycheckmate.com" },
      }} />
      {steps && steps.length > 0 && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `How to play ${name}`,
          description,
          step: steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.heading,
            text: s.body,
          })),
        }} />
      )}
    </>
  );
}
