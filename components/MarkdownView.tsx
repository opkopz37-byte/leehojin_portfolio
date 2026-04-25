import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownView({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  const html = renderMarkdown(source);
  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
