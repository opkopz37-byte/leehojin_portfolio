import WorkListClient from "./WorkListClient";
import { projects } from "@/lib/projects";
import { extractPlainText } from "@/lib/seoText";

export default function WorkPage() {
  return (
    <>
      <WorkListClient />
      <div className="sr-only">
        <h2>All Work — Full Content (for crawlers and AI readers)</h2>
        {projects.map((p) => {
          const body = extractPlainText(p.body, p.bodyFormat);
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
