import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const URL_RE =
  /(^|[\s(])((?:https?:\/\/|www\.)[^\s<>"'`)]+)/g;

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

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

const RESPONSIVE = "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1.5rem 0;border-radius:8px;";
const IFRAME_STYLE = "position:absolute;top:0;left:0;width:100%;height:100%;border:0;";

function embedVideoUrls(source: string): string {
  return source.replace(/^[ \t]*(https?:\/\/[^\s]+)[ \t]*$/gm, (line, url: string) => {
    const yt = youtubeId(url);
    if (yt) {
      return `<div style="${RESPONSIVE}"><iframe style="${IFRAME_STYLE}" src="https://www.youtube.com/embed/${yt}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
    }
    const vm = vimeoId(url);
    if (vm) {
      return `<div style="${RESPONSIVE}"><iframe style="${IFRAME_STYLE}" src="https://player.vimeo.com/video/${vm}" allowfullscreen></iframe></div>`;
    }
    return line;
  });
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const EMBED_RESIZE_SCRIPT = `<script>(function(){function r(){try{parent.postMessage({type:'embed-height',h:Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0)},'*');}catch(e){}}window.addEventListener('load',r);if(typeof ResizeObserver!=='undefined'){new ResizeObserver(r).observe(document.documentElement);}setTimeout(r,200);setTimeout(r,1000);})();<\/script>`;

function injectResizeScript(html: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, EMBED_RESIZE_SCRIPT + "</body>");
  return html + EMBED_RESIZE_SCRIPT;
}

const EMBED_IFRAME_STYLE =
  "width:100%;border:0;display:block;min-height:240px;border-radius:8px;margin:1.5rem 0;background:#fff;";

function buildEmbedIframe(code: string): string {
  const html = injectResizeScript(code);
  return `<iframe data-html-embed="1" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" srcdoc="${escapeHtmlAttr(
    html,
  )}" style="${EMBED_IFRAME_STYLE}"></iframe>`;
}

const EMBED_FENCE_RE = /^```html-embed\s*\n([\s\S]*?)```\s*$/gm;

function processHtmlEmbeds(source: string): string {
  return source.replace(EMBED_FENCE_RE, (_match, code: string) =>
    "\n\n" + buildEmbedIframe(code) + "\n\n",
  );
}

export function renderMarkdown(source: string): string {
  const withEmbeds = processHtmlEmbeds(source ?? "");
  const preprocessed = embedVideoUrls(withEmbeds);
  const html = marked.parse(preprocessed, { async: false }) as string;
  return autolinkHtml(html);
}
