"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownView from "@/components/MarkdownView";

type Props = {
  source: string;
  format?: "markdown" | "html";
  className?: string;
  editorMode?: boolean;
};

/** Posts authored before bodyFormat existed may contain a full HTML document.
 *  Detect that and render in the sandbox so it doesn't blow up the page DOM. */
function detectFormat(source: string): "markdown" | "html" {
  const head = source.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  return "markdown";
}

export default function BodyView({ source, format, className = "", editorMode = false }: Props) {
  const resolved = format ?? detectFormat(source);
  if (resolved === "html") {
    return <HtmlSandbox source={source} className={className} editorMode={editorMode} />;
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
function bindCursors(){var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++)imgs[i].style.cursor='pointer';}
function bind(){if(document.body.dataset.editorBound)return;document.body.dataset.editorBound='1';
document.body.addEventListener('mousemove',function(e){if(e.target===document.body||e.target===document.documentElement)return highlight(null);highlight(e.target);},true);
document.body.addEventListener('mouseleave',function(){highlight(null);},true);
document.body.addEventListener('click',function(e){if(e.target===document.body||e.target===document.documentElement)return;var path=pathOf(e.target);if(!path||path.length===0)return;e.preventDefault();e.stopPropagation();highlight(null);var isImg=e.target.tagName==='IMG';parent.postMessage({type:'editor-element-click',path:path,tagPath:tagPathOf(e.target),isImg:isImg,imgIndex:isImg?imgIndex(e.target):-1,imgSrc:isImg?(e.target.getAttribute('src')||''):''},'*');},true);
bindCursors();}
window.addEventListener('load',bind);if(typeof MutationObserver!=='undefined'){try{new MutationObserver(bindCursors).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}}
setTimeout(bind,300);setTimeout(bind,1500);
})();<\/script>`;

function injectScripts(html: string, scripts: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, scripts + "</body>");
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, scripts + "</html>");
  return html + scripts;
}

function HtmlSandbox({ source, className, editorMode }: { source: string; className: string; editorMode: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(800);
  const srcDoc = injectScripts(source, RESIZE_SCRIPT + (editorMode ? EDITOR_SCRIPT : ""));

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; h?: number } | null;
      if (!data || data.type !== "body-height" || typeof data.h !== "number") return;
      const frame = iframeRef.current;
      if (!frame) return;
      if (frame.contentWindow === e.source && data.h > 0) {
        setHeight(data.h);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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
