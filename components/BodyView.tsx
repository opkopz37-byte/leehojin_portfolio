"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownView from "@/components/MarkdownView";

type Props = {
  source: string;
  format?: "markdown" | "html";
  className?: string;
  editorMode?: boolean;
  wysiwyg?: boolean;
  onContentChange?: (html: string) => void;
};

function detectFormat(source: string): "markdown" | "html" {
  const head = source.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  return "markdown";
}

export default function BodyView({
  source,
  format,
  className = "",
  editorMode = false,
  wysiwyg = false,
  onContentChange,
}: Props) {
  const resolved = format ?? detectFormat(source);
  if (resolved === "html") {
    return (
      <HtmlSandbox
        source={source}
        className={className}
        editorMode={editorMode}
        wysiwyg={wysiwyg}
        onContentChange={onContentChange}
      />
    );
  }
  return <MarkdownView source={source} className={className} />;
}

const RESIZE_SCRIPT = `<script>(function(){function r(){try{var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);parent.postMessage({type:'body-height',h:h},'*');}catch(e){}}window.addEventListener('load',r);if(typeof ResizeObserver!=='undefined'){try{new ResizeObserver(r).observe(document.documentElement);}catch(e){}}setInterval(r,400);setTimeout(r,200);setTimeout(r,1200);})();<\/script>`;

const EDITOR_SCRIPT = `<script>(function(){
function pathOf(el){if(!el||el===document.body)return [];var path=[];while(el&&el!==document.body){var p=el.parentElement;if(!p)return null;var idx=Array.prototype.indexOf.call(p.children,el);if(idx<0)return null;path.unshift(idx);el=p;}return el===document.body?path:null;}
function tagPathOf(el){var tags=[];while(el&&el!==document.body){tags.unshift(el.tagName.toLowerCase());el=el.parentElement;}return tags;}
function imgIndex(img){var all=document.querySelectorAll('img');for(var i=0;i<all.length;i++)if(all[i]===img)return i;return -1;}
var hoverEl=null;
function highlight(el){if(hoverEl===el)return;if(hoverEl){hoverEl.style.outline='';hoverEl.style.outlineOffset='';}hoverEl=el;if(el){var color=el.tagName==='IMG'?'#ea580c':'rgba(234,88,12,0.55)';el.style.outline='2px dashed '+color;el.style.outlineOffset='2px';}}
function bindCursors(){if(document.body.dataset.wysiwygActive)return;var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++)imgs[i].style.cursor='pointer';}
function bind(){if(document.body.dataset.editorBound)return;document.body.dataset.editorBound='1';
document.body.addEventListener('mousemove',function(e){if(document.body.dataset.wysiwygActive)return;if(e.target===document.body||e.target===document.documentElement)return highlight(null);highlight(e.target);},true);
document.body.addEventListener('mouseleave',function(){highlight(null);},true);
document.body.addEventListener('click',function(e){if(document.body.dataset.wysiwygActive)return;if(e.target===document.body||e.target===document.documentElement)return;var path=pathOf(e.target);if(!path||path.length===0)return;e.preventDefault();e.stopPropagation();highlight(null);var isImg=e.target.tagName==='IMG';parent.postMessage({type:'editor-element-click',path:path,tagPath:tagPathOf(e.target),isImg:isImg,imgIndex:isImg?imgIndex(e.target):-1,imgSrc:isImg?(e.target.getAttribute('src')||''):''},'*');},true);
bindCursors();}
window.addEventListener('load',bind);if(typeof MutationObserver!=='undefined'){try{new MutationObserver(bindCursors).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}}
setTimeout(bind,300);setTimeout(bind,1500);
})();<\/script>`;

const WYSIWYG_SCRIPT = `<script>(function(){
function enter(){document.body.contentEditable='true';document.body.dataset.wysiwygActive='1';var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++)imgs[i].contentEditable='false';setTimeout(function(){document.body.focus();},50);}
function exit(){document.body.contentEditable='false';delete document.body.dataset.wysiwygActive;parent.postMessage({type:'wysiwyg-html',html:document.documentElement.outerHTML},'*');}
window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='wysiwyg-enter')enter();else if(e.data.type==='wysiwyg-exit')exit();});
})();<\/script>`;

/** Injected last in <head> so it wins over same-specificity post styles. */
const MOBILE_RESET_STYLE = `<style>
*,*::before,*::after{box-sizing:border-box;}
html,body{max-width:100%;overflow-x:hidden;}
img,video{max-width:100%!important;height:auto!important;}
table{display:block!important;max-width:100%!important;overflow-x:auto;-webkit-overflow-scrolling:touch;}
pre{overflow-x:auto;word-break:break-word;}
@media(max-width:640px){
  body{padding-left:max(16px,env(safe-area-inset-left))!important;padding-right:max(16px,env(safe-area-inset-right))!important;}
  img,video{border-radius:6px;}
}
</style>`;

/** Ensure <base href="/"> is the FIRST thing in <head> so relative /images/... paths resolve. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BASE_TAG = `<base href="${BASE_PATH}/">`;

function injectHead(html: string, content: string): string {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, content + "</head>");
  if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, (m) => m + content);
  if (/<html\b[^>]*>/i.test(html)) return html.replace(/<html\b[^>]*>/i, (m) => m + "<head>" + content + "</head>");
  return "<head>" + content + "</head>" + html;
}

function injectScripts(html: string, scripts: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, scripts + "</body>");
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, scripts + "</html>");
  return html + scripts;
}

function buildSrcDoc(source: string, editorMode: boolean): string {
  // 1. Inject <base> first (must be first in <head>)
  let html = injectHead(source, BASE_TAG);
  // 2. Inject mobile-reset style last in <head> (wins over post's same-specificity rules)
  html = injectHead(html, MOBILE_RESET_STYLE);
  // 3. Inject runtime scripts before </body>
  html = injectScripts(html, RESIZE_SCRIPT + (editorMode ? EDITOR_SCRIPT + WYSIWYG_SCRIPT : ""));
  return html;
}

function HtmlSandbox({
  source,
  className,
  editorMode,
  wysiwyg = false,
  onContentChange,
}: {
  source: string;
  className: string;
  editorMode: boolean;
  wysiwyg?: boolean;
  onContentChange?: (html: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(800);
  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => { onContentChangeRef.current = onContentChange; });

  const srcDoc = buildSrcDoc(source, editorMode);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; h?: number; html?: string } | null;
      if (!data) return;
      const frame = iframeRef.current;
      if (!frame || frame.contentWindow !== e.source) return;
      if (data.type === "body-height" && typeof data.h === "number" && data.h > 0) {
        setHeight(data.h);
      }
      if (data.type === "wysiwyg-html" && typeof data.html === "string") {
        onContentChangeRef.current?.(data.html);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const prevWysiwyg = useRef(false);
  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    if (wysiwyg && !prevWysiwyg.current) {
      const send = () => frame.contentWindow?.postMessage({ type: "wysiwyg-enter" }, "*");
      if (frame.contentDocument?.readyState === "complete") send();
      else frame.addEventListener("load", send, { once: true });
    } else if (!wysiwyg && prevWysiwyg.current) {
      frame.contentWindow?.postMessage({ type: "wysiwyg-exit" }, "*");
    }
    prevWysiwyg.current = wysiwyg;
  }, [wysiwyg]);

  return (
    <iframe
      ref={iframeRef}
      title="post-content"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      srcDoc={srcDoc}
      className={`block w-full border-0 ${className}`}
      style={{ height, display: "block" }}
    />
  );
}
