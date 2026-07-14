import JsonLd from "./JsonLd";

export interface Crumb {
  name: string;
  url: string;
}

/** Emits BreadcrumbList structured data. Pass the full trail including Home. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    }} />
  );
}
