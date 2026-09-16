import Link from "next/link";
import JsonLd from "./JsonLd";

export interface Crumb {
  name: string;
  url: string;
}

/**
 * Emits BreadcrumbList structured data and, by default, a matching visible
 * breadcrumb trail (Google prefers the markup to reflect a visible element).
 * Pass `schemaOnly` where the trail would be redundant or badly placed
 * (e.g. game pages that emit this from the bottom via GameSeo).
 */
export default function Breadcrumbs({ items, schemaOnly = false }: { items: Crumb[]; schemaOnly?: boolean }) {
  const toPath = (url: string) => url.replace(/^https?:\/\/[^/]+/, "") || "/";
  return (
    <>
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
      {!schemaOnly && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="list-unstyled d-flex flex-wrap align-items-center gap-1 mb-0 small text-muted">
            {items.map((item, i) => {
              const last = i === items.length - 1;
              return (
                <li key={item.url} className="d-flex align-items-center gap-1">
                  {last ? (
                    <span aria-current="page">{item.name}</span>
                  ) : (
                    <>
                      <Link href={toPath(item.url)} className="text-muted text-decoration-none">{item.name}</Link>
                      <span aria-hidden="true" className="text-secondary">/</span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </>
  );
}
