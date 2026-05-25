function detectHtmlBody(source: string): boolean {
  const head = (source ?? "").trimStart().slice(0, 200).toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** Extract readable plain text from a post body for SEO/AI crawlers.
 *  Block-level tags become paragraph breaks. Markdown returned trimmed. */
export function extractPlainText(
  source: string,
  format?: "markdown" | "html",
): string {
  if (!source) return "";
  const isHtml =
    format === "html" || (format === undefined && detectHtmlBody(source));
  if (!isHtml) return source.trim();

  let html = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) html = bodyMatch[1];

  html = html.replace(
    /<\/(p|div|section|article|li|h[1-6]|tr|blockquote|figcaption|pre|td|th)>/gi,
    "\n\n",
  );
  html = html.replace(/<br\b[^>]*>/gi, "\n");
  html = html.replace(/<[^>]+>/g, "");
  html = decodeEntities(html);

  return html
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
