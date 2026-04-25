import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const URL_RE =
  /(^|[\s(])((?:https?:\/\/|www\.)[^\s<>"'`)]+)/g;

/**
 * Wrap bare URLs in <a> tags, while skipping anything inside
 * <a>, <code>, or <pre> elements.
 */
function autolinkHtml(html: string): string {
  let out = "";
  let i = 0;
  const depth = { a: 0, code: 0, pre: 0 } as Record<string, number>;
  while (i < html.length) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        out += html.slice(i);
        break;
      }
      const tag = html.slice(i, end + 1);
      const m = tag.match(/^<\s*\/?\s*(\w+)/);
      if (m) {
        const name = m[1].toLowerCase();
        if (name === "a" || name === "code" || name === "pre") {
          const isClose = tag.startsWith("</");
          const selfClose = tag.endsWith("/>");
          if (isClose) depth[name] = Math.max(0, depth[name] - 1);
          else if (!selfClose) depth[name]++;
        }
      }
      out += tag;
      i = end + 1;
      continue;
    }
    const next = html.indexOf("<", i);
    const segment = html.slice(i, next === -1 ? html.length : next);
    if (depth.a === 0 && depth.code === 0 && depth.pre === 0) {
      out += segment.replace(URL_RE, (_match, pre: string, url: string) => {
        const trimmed = url.replace(/[.,;!?]+$/, "");
        const trail = url.slice(trimmed.length);
        const href = trimmed.startsWith("www.") ? `http://${trimmed}` : trimmed;
        return `${pre}<a href="${href}" target="_blank" rel="noopener noreferrer">${trimmed}</a>${trail}`;
      });
    } else {
      out += segment;
    }
    i = next === -1 ? html.length : next;
  }
  return out;
}

export function renderMarkdown(source: string): string {
  const html = marked.parse(source ?? "", { async: false }) as string;
  return autolinkHtml(html);
}
