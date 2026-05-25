import WorkListClient from "./WorkListClient";
import { projects } from "@/lib/projects";
import { extractPlainText } from "@/lib/seoText";

export default function WorkPage() {
  const enriched = projects.map((p) => ({
    project: p,
    body: extractPlainText(p.body, p.bodyFormat),
  }));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All Work",
    numberOfItems: enriched.length,
    itemListElement: enriched.map(({ project: p, body }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/work/${p.slug}/`,
      item: {
        "@type": "Article",
        headline: p.title,
        description: p.summary || undefined,
        ...(p.startDate && { datePublished: p.startDate }),
        ...(p.endDate && { dateModified: p.endDate }),
        ...(p.tags?.length && { keywords: p.tags.join(", ") }),
        ...(p.role && { author: { "@type": "Person", jobTitle: p.role } }),
        ...(body && { articleBody: body }),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <WorkListClient />
      <div className="sr-only">
        <h2>All Work — Full Content (for crawlers and AI readers)</h2>
        {enriched.map(({ project: p, body }) => {
          const paragraphs = body ? body.split("\n\n") : [];
          const meta: string[] = [];
          if (p.category) {
            meta.push(
              p.subCategory
                ? `${p.category} / ${p.subCategory}`
                : p.category,
            );
          }
          if (p.role) meta.push(`Role: ${p.role}`);
          if (p.company) meta.push(`Company: ${p.company}`);
          if (p.startDate || p.endDate) {
            meta.push(
              `Date: ${p.startDate ?? ""}${
                p.startDate && p.endDate ? " — " : ""
              }${p.endDate ?? ""}`,
            );
          }
          if (p.tags?.length) meta.push(`Tags: ${p.tags.join(", ")}`);
          return (
            <article key={p.slug}>
              <h3>{p.title}</h3>
              <p>
                <a href={`/work/${p.slug}/`}>/work/{p.slug}/</a>
              </p>
              {meta.length > 0 && <p>{meta.join(" · ")}</p>}
              {p.summary && (
                <p>
                  <strong>Summary:</strong> {p.summary}
                </p>
              )}
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>
          );
        })}
      </div>
    </>
  );
}
