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
  onIframeReady?: (iframe: HTMLIFrameElement | null) => void;
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
  onIframeReady,
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
        onIframeReady={onIframeReady}
      />
    );
  }
  return <MarkdownView source={source} className={className} />;
}

const RESIZE_SCRIPT = `<script data-injected="1">(function(){function r(){try{var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);parent.postMessage({type:'body-height',h:h},'*');}catch(e){}}window.addEventListener('load',r);if(typeof ResizeObserver!=='undefined'){try{new ResizeObserver(r).observe(document.documentElement);}catch(e){}}setInterval(r,400);setTimeout(r,200);setTimeout(r,1200);})();<\/script>`;

const EDITOR_SCRIPT = `<script data-injected="1">(function(){
function pathOf(el){if(!el||el===document.body)return [];var path=[];while(el&&el!==document.body){var p=el.parentElement;if(!p)return null;var idx=Array.prototype.indexOf.call(p.children,el);if(idx<0)return null;path.unshift(idx);el=p;}return el===document.body?path:null;}
function tagPathOf(el){var tags=[];while(el&&el!==document.body){tags.unshift(el.tagName.toLowerCase());el=el.parentElement;}return tags;}
function imgIndex(img){var all=document.querySelectorAll('img');for(var i=0;i<all.length;i++)if(all[i]===img)return i;return -1;}
function findTable(el){while(el&&el!==document.body){if(el.tagName==='TABLE')return el;el=el.parentElement;}return null;}
function findCell(el){while(el&&el!==document.body){if(el.tagName==='TD'||el.tagName==='TH')return el;el=el.parentElement;}return null;}
function cellPos(cell,table){if(!cell||!table)return [-1,-1];var row=cell.parentElement;if(!row||row.tagName!=='TR')return [-1,-1];var colIdx=Array.prototype.indexOf.call(row.children,cell);var rows=table.querySelectorAll('tr');var rowIdx=Array.prototype.indexOf.call(rows,row);return [rowIdx,colIdx];}
function isInjected(el){return !!(el&&el.dataset&&el.dataset.injected==='1');}
function findDraggable(el){while(el&&el!==document.body){if(el.tagName==='IMG'||el.tagName==='VIDEO'||el.tagName==='TABLE')return el;el=el.parentElement;}return null;}
function elementAtPath(p){if(!p||!p.length)return null;var el=document.body;for(var i=0;i<p.length;i++){if(!el||!el.children||!el.children[p[i]])return null;el=el.children[p[i]];}return el;}
var TD_STYLE='border:1px solid #ddd;padding:8px 12px;';
var TH_STYLE='border:1px solid #ddd;padding:8px 12px;background:rgba(127,127,127,0.12);text-align:left;';
function tInsRow(t,idx,pos){var rs=t.querySelectorAll('tr');if(idx<0||idx>=rs.length)return false;var ref=rs[idx];var cc=ref.children.length||1;var nr=document.createElement('tr');for(var i=0;i<cc;i++){var td=document.createElement('td');td.setAttribute('style',TD_STYLE);td.textContent='셀';nr.appendChild(td);}var par=ref.parentNode;if(!par)return false;if(pos==='before')par.insertBefore(nr,ref);else par.insertBefore(nr,ref.nextSibling);return true;}
function tDelRow(t,idx){var rs=t.querySelectorAll('tr');if(idx<0||idx>=rs.length||rs.length<=1)return false;var r=rs[idx];r.parentNode&&r.parentNode.removeChild(r);return true;}
function tInsCol(t,idx,pos){var rs=t.querySelectorAll('tr');if(rs.length===0)return false;var any=false;for(var i=0;i<rs.length;i++){var r=rs[i];if(idx<0||idx>=r.children.length)continue;var ref=r.children[idx];var ih=ref.tagName==='TH';var nc=document.createElement(ih?'th':'td');nc.setAttribute('style',ih?TH_STYLE:TD_STYLE);nc.textContent=ih?'제목':'셀';if(pos==='before')r.insertBefore(nc,ref);else r.insertBefore(nc,ref.nextSibling);any=true;}return any;}
function tDelCol(t,idx){var rs=t.querySelectorAll('tr');var maxCols=0;for(var i=0;i<rs.length;i++){if(rs[i].children.length>maxCols)maxCols=rs[i].children.length;}if(maxCols<=1)return false;var any=false;for(var j=0;j<rs.length;j++){var r=rs[j];if(idx>=0&&idx<r.children.length){r.children[idx].remove();any=true;}}return any;}
function tAppendCol(t){var rs=t.querySelectorAll('tr');if(rs.length===0)return false;var any=false;for(var i=0;i<rs.length;i++){var r=rs[i];if(r.children.length===0){var td=document.createElement('td');td.setAttribute('style',TD_STYLE);td.textContent='셀';r.appendChild(td);}else{var lc=r.children[r.children.length-1];var ih=lc.tagName==='TH';var nc=document.createElement(ih?'th':'td');nc.setAttribute('style',ih?TH_STYLE:TD_STYLE);nc.textContent=ih?'제목':'셀';r.appendChild(nc);}any=true;}return any;}
function sendCleanedHtml(){var c=document.documentElement.cloneNode(true);var ij=c.querySelectorAll('[data-injected="1"]');for(var i=0;i<ij.length;i++)ij[i].remove();var be=c.querySelector('body');if(be){be.removeAttribute('contenteditable');be.removeAttribute('data-wysiwyg-active');be.removeAttribute('data-editor-bound');}var imgs=c.querySelectorAll('img');for(var k=0;k<imgs.length;k++){imgs[k].removeAttribute('contenteditable');imgs[k].style.cursor='';imgs[k].style.outline='';imgs[k].style.outlineOffset='';imgs[k].style.opacity='';}var cells=c.querySelectorAll('td,th');for(var m=0;m<cells.length;m++){cells[m].style.outline='';cells[m].style.outlineOffset='';cells[m].style.background='';}parent.postMessage({type:'editor-html-update',html:c.outerHTML},'*');}
var hoverEl=null;
function highlight(el){if(hoverEl===el)return;if(hoverEl){hoverEl.style.outline='';hoverEl.style.outlineOffset='';}hoverEl=el;if(el&&!isInjected(el)){var color=el.tagName==='IMG'?'#ea580c':'rgba(234,88,12,0.55)';el.style.outline='2px dashed '+color;el.style.outlineOffset='2px';}}
function bindCursors(){if(document.body.dataset.wysiwygActive)return;var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++)imgs[i].style.cursor='pointer';}
var dropLine=null,dragHandle=null,dragSrc=null,hoverDrag=null,dropTarget=null,dropBefore=true,dropMode='before',hilCell=null,lastDragY=-1,scrollTimer=null;
var cellSelStart=null,cellSelEnd=null,selectedCells=[],mouseDownPos=null,cellSelMoved=false,suppressNextClick=false,mergeBtn=null;
function clearCellHi(){if(hilCell){hilCell.style.outline='';hilCell.style.outlineOffset='';hilCell=null;}}
function clearAllCellSelHi(){for(var i=0;i<selectedCells.length;i++){var sc=selectedCells[i];sc.style.background='';sc.style.outline='';sc.style.outlineOffset='';}selectedCells=[];}
function ensureMergeBtn(){if(mergeBtn&&mergeBtn.parentNode)return;mergeBtn=document.createElement('button');mergeBtn.setAttribute('data-injected','1');mergeBtn.type='button';mergeBtn.textContent='🔗 셀 병합';mergeBtn.style.cssText='position:absolute;display:none;background:#ea580c;color:#fff;border:2px solid #fff;border-radius:6px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;z-index:99998;box-shadow:0 3px 10px rgba(0,0,0,0.4);font-family:sans-serif;';mergeBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();mergeSelectedCells();});document.body.appendChild(mergeBtn);}
function showMergeBtn(){if(!cellSelEnd)return;ensureMergeBtn();var rect=cellSelEnd.getBoundingClientRect();mergeBtn.style.display='block';mergeBtn.style.top=(rect.bottom+window.scrollY+6)+'px';mergeBtn.style.left=(rect.right+window.scrollX-110)+'px';}
function hideMergeBtn(){if(mergeBtn)mergeBtn.style.display='none';}
function clearCellSel(){clearAllCellSelHi();cellSelStart=null;cellSelEnd=null;cellSelMoved=false;hideMergeBtn();}
function updateCellSel(){clearAllCellSelHi();if(!cellSelStart||!cellSelEnd)return;var tab=findTable(cellSelStart);if(!tab||findTable(cellSelEnd)!==tab)return;var sp=cellPos(cellSelStart,tab);var ep=cellPos(cellSelEnd,tab);if(sp[0]<0||ep[0]<0)return;var r1=Math.min(sp[0],ep[0]),r2=Math.max(sp[0],ep[0]),c1=Math.min(sp[1],ep[1]),c2=Math.max(sp[1],ep[1]);var rs=tab.querySelectorAll('tr');for(var r=r1;r<=r2&&r<rs.length;r++){var cs=rs[r].children;for(var c=c1;c<=c2&&c<cs.length;c++){var cell=cs[c];cell.style.background='rgba(234,88,12,0.18)';cell.style.outline='2px solid #ea580c';cell.style.outlineOffset='-2px';selectedCells.push(cell);}}}
function mergeSelectedCells(){if(!cellSelStart||!cellSelEnd)return;var tab=findTable(cellSelStart);if(!tab)return;var sp=cellPos(cellSelStart,tab);var ep=cellPos(cellSelEnd,tab);if(sp[0]<0||ep[0]<0)return;var r1=Math.min(sp[0],ep[0]),r2=Math.max(sp[0],ep[0]),c1=Math.min(sp[1],ep[1]),c2=Math.max(sp[1],ep[1]);if(r1===r2&&c1===c2)return;var rs=tab.querySelectorAll('tr');var topLeft=rs[r1].children[c1];if(!topLeft)return;var toRemove=[];var combined=[];var seedTxt=topLeft.textContent&&topLeft.textContent.trim();if(seedTxt)combined.push(seedTxt);for(var r=r1;r<=r2&&r<rs.length;r++){var rc=rs[r].children;for(var c=c1;c<=c2&&c<rc.length;c++){if(r===r1&&c===c1)continue;var cell=rc[c];var t=cell.textContent&&cell.textContent.trim();if(t)combined.push(t);toRemove.push(cell);}}topLeft.setAttribute('colspan',String(c2-c1+1));topLeft.setAttribute('rowspan',String(r2-r1+1));topLeft.textContent=combined.join(' ')||'셀';for(var i=0;i<toRemove.length;i++)toRemove[i].remove();clearCellSel();sendCleanedHtml();}
function startAutoScroll(){if(scrollTimer)return;scrollTimer=setInterval(function(){if(!dragSrc||lastDragY<0)return;var fr;try{fr=window.frameElement;}catch(_){}if(!fr)return;var rect=fr.getBoundingClientRect();var py=rect.top+lastDragY;var ph=0;try{ph=window.parent.innerHeight;}catch(_){}if(!ph)return;var th=100;if(py<th){var amt=Math.max(2,Math.min(20,(th-py)/3));try{window.parent.scrollBy(0,-amt);}catch(_){}}else if(py>ph-th){var amt=Math.max(2,Math.min(20,(py-(ph-th))/3));try{window.parent.scrollBy(0,amt);}catch(_){}}},16);}
function stopAutoScroll(){if(scrollTimer){clearInterval(scrollTimer);scrollTimer=null;}lastDragY=-1;}
function ensureDragHandle(){if(dragHandle&&dragHandle.parentNode)return;dragHandle=document.createElement('div');dragHandle.setAttribute('data-injected','1');dragHandle.draggable=true;dragHandle.title='끌어서 위치 이동';dragHandle.textContent='⋮⋮';dragHandle.style.cssText='position:absolute;width:34px;height:34px;background:#ea580c;color:#fff;border-radius:8px;display:none;cursor:grab;z-index:99998;align-items:center;justify-content:center;font-size:16px;font-weight:700;font-family:sans-serif;letter-spacing:-3px;user-select:none;box-shadow:0 3px 10px rgba(0,0,0,0.5);border:2px solid #fff;';document.body.appendChild(dragHandle);}
function ensureDropLine(){if(dropLine&&dropLine.parentNode)return;dropLine=document.createElement('div');dropLine.setAttribute('data-injected','1');dropLine.style.cssText='position:absolute;height:3px;background:#ea580c;pointer-events:none;display:none;z-index:99999;border-radius:2px;box-shadow:0 0 6px rgba(234,88,12,0.5);';document.body.appendChild(dropLine);}
function showHandleOn(el){ensureDragHandle();if(!el){dragHandle.style.display='none';hoverDrag=null;return;}hoverDrag=el;var rect=el.getBoundingClientRect();dragHandle.style.display='flex';var top=rect.top+window.scrollY-12;var left=rect.left+window.scrollX-12;if(left<2)left=rect.left+window.scrollX+4;if(top<2)top=rect.top+window.scrollY+4;dragHandle.style.top=top+'px';dragHandle.style.left=left+'px';}
function clearDropLine(){if(dropLine)dropLine.style.display='none';dropTarget=null;}
function bind(){if(document.body.dataset.editorBound)return;document.body.dataset.editorBound='1';ensureDragHandle();
document.body.addEventListener('mousedown',function(e){if(document.body.dataset.wysiwygActive)return;if(isInjected(e.target))return;clearCellSel();var cell=findCell(e.target);if(!cell)return;cellSelStart=cell;cellSelEnd=cell;mouseDownPos={x:e.clientX,y:e.clientY};cellSelMoved=false;},true);
document.body.addEventListener('mouseup',function(){if(!cellSelStart||!mouseDownPos)return;mouseDownPos=null;if(cellSelMoved){suppressNextClick=true;var tab=findTable(cellSelStart);var sp=cellPos(cellSelStart,tab);var ep=cellPos(cellSelEnd,tab);if(sp&&ep&&(sp[0]!==ep[0]||sp[1]!==ep[1]))showMergeBtn();else clearCellSel();}else{clearCellSel();}},true);
document.body.addEventListener('mousemove',function(e){if(document.body.dataset.wysiwygActive)return;if(dragSrc)return;var t=e.target;if(mouseDownPos&&cellSelStart){var dx=e.clientX-mouseDownPos.x;var dy=e.clientY-mouseDownPos.y;if(dx*dx+dy*dy>=16){cellSelMoved=true;var c2=findCell(t);if(c2&&findTable(c2)===findTable(cellSelStart)&&c2!==cellSelEnd){cellSelEnd=c2;updateCellSel();}return;}}if(t===dragHandle||isInjected(t))return;if(t===document.body||t===document.documentElement){highlight(null);}else{highlight(t);}var d=findDraggable(t);if(d){showHandleOn(d);return;}if(hoverDrag){var rc=hoverDrag.getBoundingClientRect();var pad=80;if(e.clientX<rc.left-pad||e.clientX>rc.right+pad||e.clientY<rc.top-pad||e.clientY>rc.bottom+pad)showHandleOn(null);}},true);
document.body.addEventListener('mouseleave',function(){highlight(null);},true);
document.body.addEventListener('click',function(e){var t=e.target;if(suppressNextClick&&!isInjected(t)){suppressNextClick=false;e.preventDefault();e.stopPropagation();return;}if(document.body.dataset.wysiwygActive)return;if(t===document.body||t===document.documentElement)return;if(isInjected(t))return;var path=pathOf(t);if(!path||path.length===0)return;e.preventDefault();e.stopPropagation();highlight(null);var isImg=t.tagName==='IMG';var isVideo=t.tagName==='VIDEO';var table=findTable(t);var tablePath=table?pathOf(table):null;var cell=findCell(t);var cp=cellPos(cell,table);parent.postMessage({type:'editor-element-click',path:path,tagPath:tagPathOf(t),isImg:isImg,isVideo:isVideo,imgIndex:isImg?imgIndex(t):-1,imgSrc:isImg?(t.getAttribute('src')||''):'',inTable:!!table,tablePath:tablePath,cellRowIdx:cp[0],cellColIdx:cp[1]},'*');},true);
document.addEventListener('dragstart',function(e){if(document.body.dataset.wysiwygActive)return;if(e.target!==dragHandle||!hoverDrag)return;dragSrc=hoverDrag;dragHandle.style.cursor='grabbing';hoverDrag.style.opacity='0.4';try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','move');}catch(_){}highlight(null);ensureDropLine();startAutoScroll();},true);
document.addEventListener('dragover',function(e){if(!dragSrc)return;lastDragY=e.clientY;var t=e.target;if(!t||t===document.documentElement||t===document.body||isInjected(t)){clearDropLine();clearCellHi();e.preventDefault();return;}if(t===dragSrc||(dragSrc.contains&&dragSrc.contains(t))){clearDropLine();clearCellHi();e.preventDefault();return;}e.preventDefault();e.dataTransfer.dropEffect='move';var cell=findCell(t);if(cell&&(dragSrc.tagName==='IMG'||dragSrc.tagName==='VIDEO')){if(hilCell!==cell){clearCellHi();hilCell=cell;cell.style.outline='3px solid #ea580c';cell.style.outlineOffset='-3px';}if(dropLine)dropLine.style.display='none';dropTarget=cell;dropMode='inside-cell';return;}clearCellHi();var rect=t.getBoundingClientRect();if(rect.width===0&&rect.height===0){clearDropLine();return;}var midY=rect.top+rect.height/2;var before=e.clientY<midY;ensureDropLine();var lineY=before?rect.top:rect.bottom;dropLine.style.top=(lineY+window.scrollY-1)+'px';dropLine.style.left=(rect.left+window.scrollX)+'px';dropLine.style.width=rect.width+'px';dropLine.style.display='block';dropTarget=t;dropBefore=before;dropMode=before?'before':'after';},true);
document.addEventListener('drop',function(e){stopAutoScroll();if(!dragSrc)return;e.preventDefault();var t=dropTarget;var mode=dropMode;clearDropLine();clearCellHi();if(!t||t===dragSrc||(dragSrc.contains&&dragSrc.contains(t)))return;if(mode==='inside-cell')t.appendChild(dragSrc);else if(mode==='before')t.parentNode&&t.parentNode.insertBefore(dragSrc,t);else t.parentNode&&t.parentNode.insertBefore(dragSrc,t.nextSibling);sendCleanedHtml();},true);
window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='delete-element'){var el=elementAtPath(e.data.elementPath);if(el&&el.parentNode){el.parentNode.removeChild(el);sendCleanedHtml();}return;}if(e.data.type!=='table-op')return;var t=elementAtPath(e.data.tablePath);if(!t||t.tagName!=='TABLE')return;var op=e.data.op;var ri=typeof e.data.cellRowIdx==='number'?e.data.cellRowIdx:-1;var ci=typeof e.data.cellColIdx==='number'?e.data.cellColIdx:-1;var pos=e.data.position;var ok=false;if(op==='insertRow'){var rs=t.querySelectorAll('tr');if(rs.length>0){var idx=ri>=0?ri:(pos==='before'?0:rs.length-1);ok=tInsRow(t,idx,pos);}}else if(op==='deleteRow'){var rs2=t.querySelectorAll('tr');if(rs2.length>0){var idx2=ri>=0?ri:rs2.length-1;ok=tDelRow(t,idx2);}}else if(op==='insertCol'){if(ci>=0)ok=tInsCol(t,ci,pos);else if(pos==='after')ok=tAppendCol(t);else ok=tInsCol(t,0,'before');}else if(op==='deleteCol'){if(ci>=0)ok=tDelCol(t,ci);else{var maxCols=0;t.querySelectorAll('tr').forEach(function(r){if(r.children.length>maxCols)maxCols=r.children.length;});if(maxCols>0)ok=tDelCol(t,maxCols-1);}}else if(op==='deleteTable'){if(t.parentNode){t.parentNode.removeChild(t);ok=true;}}if(ok)sendCleanedHtml();});
document.addEventListener('dragend',function(){stopAutoScroll();if(dragSrc)dragSrc.style.opacity='';if(dragHandle){dragHandle.style.cursor='grab';dragHandle.style.display='none';}dragSrc=null;hoverDrag=null;clearDropLine();clearCellHi();},true);
document.addEventListener('wheel',function(e){if(!dragSrc)return;try{window.parent.scrollBy(0,e.deltaY);}catch(_){}e.preventDefault();},{capture:true,passive:false});
bindCursors();}
window.addEventListener('load',bind);if(typeof MutationObserver!=='undefined'){try{new MutationObserver(bindCursors).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}}
setTimeout(bind,300);setTimeout(bind,1500);
})();<\/script>`;

const WYSIWYG_SCRIPT = `<script data-injected="1">(function(){
function enter(){document.body.contentEditable='true';document.body.dataset.wysiwygActive='1';var imgs=document.querySelectorAll('img');for(var i=0;i<imgs.length;i++)imgs[i].contentEditable='false';setTimeout(function(){document.body.focus();},50);}
function exit(){document.body.removeAttribute('contenteditable');delete document.body.dataset.wysiwygActive;var c=document.documentElement.cloneNode(true);var ij=c.querySelectorAll('[data-injected="1"]');for(var i=0;i<ij.length;i++)ij[i].remove();var be=c.querySelector('body');if(be){be.removeAttribute('contenteditable');be.removeAttribute('data-wysiwyg-active');be.removeAttribute('data-editor-bound');}var imgs=c.querySelectorAll('img');for(var k=0;k<imgs.length;k++)imgs[k].removeAttribute('contenteditable');parent.postMessage({type:'wysiwyg-html',html:c.outerHTML},'*');}
window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='wysiwyg-enter')enter();else if(e.data.type==='wysiwyg-exit')exit();});
})();<\/script>`;

/** Injected last in <head> so it wins over same-specificity post styles. */
const MOBILE_RESET_STYLE = `<style data-injected="1">
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
const BASE_TAG = `<base href="${BASE_PATH}/" data-injected="1">`;

/** Strip parent-injected runtime that may have leaked into a saved body via past
 *  wysiwyg cycles. Without this, a stale EDITOR_SCRIPT inside the body sets the
 *  `editorBound` flag before our fresh script runs, suppressing handle/click/drag. */
function stripInjectedRuntime(html: string): string {
  if (!html) return html;
  let out = html;
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => {
    if (
      /parent\.postMessage\s*\(\s*\{[^}]*type\s*:\s*['"](?:body-height|editor-element-click|wysiwyg-html|editor-image-move|editor-html-update|table-op)['"]/.test(
        m,
      )
    ) {
      return "";
    }
    if (/wysiwyg-enter|wysiwyg-exit/.test(m)) return "";
    return m;
  });
  out = out.replace(/<base\s+href="[^"]*"(?:\s+data-injected="1")?\s*\/?>\s*/gi, "");
  out = out.replace(
    /<style(?:\s+data-injected="1")?>\s*\*,\*::before,\*::after\s*\{\s*box-sizing:border-box;\s*\}[\s\S]*?<\/style>\s*/gi,
    "",
  );
  // Strip runtime attributes baked onto <body> (editorBound flag prevents fresh
  // EDITOR_SCRIPT from registering its handlers; contenteditable / wysiwygActive
  // are residue from a wysiwyg cycle).
  out = out.replace(/<body\b([^>]*)>/i, (_, attrs: string) => {
    const cleaned = attrs
      .replace(/\s+data-editor-bound\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\s+data-wysiwyg-active\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\s+contenteditable\s*=\s*["'][^"']*["']/gi, "");
    return `<body${cleaned}>`;
  });
  // Strip residual contenteditable from <img>.
  out = out.replace(
    /<img\b([^>]*?)\s+contenteditable\s*=\s*["'][^"']*["']/gi,
    "<img$1",
  );
  return out;
}

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
  // 0. Strip any stale runtime that may have been persisted into the body
  let html = stripInjectedRuntime(source);
  // 1. Inject <base> first (must be first in <head>)
  html = injectHead(html, BASE_TAG);
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
  onIframeReady,
}: {
  source: string;
  className: string;
  editorMode: boolean;
  wysiwyg?: boolean;
  onContentChange?: (html: string) => void;
  onIframeReady?: (iframe: HTMLIFrameElement | null) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onIframeReadyRef = useRef(onIframeReady);
  useEffect(() => { onIframeReadyRef.current = onIframeReady; });
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
      ref={(el) => {
        iframeRef.current = el;
        onIframeReadyRef.current?.(el);
      }}
      title="post-content"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      srcDoc={srcDoc}
      className={`block w-full border-0 ${className}`}
      style={{ height, display: "block" }}
    />
  );
}
