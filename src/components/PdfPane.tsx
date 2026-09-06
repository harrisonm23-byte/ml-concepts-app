import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import HtmlView, { HtmlViewHandle } from './HtmlView';
import { PDF_DATA } from '../lectures/pdfData';
import { C } from '../theme';

// Renders an embedded lecture PDF page by page with pdf.js (loaded from cdnjs), inside HtmlView.
// The PDF travels as base64 inside the document, so the published single-file build stays self-contained.
// After rendering it indexes the text layer so goTo(heading) can scroll to a section such as "II. How Text Becomes Math".
function pdfHtml(b64: string, bg: string, fg: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>html,body{margin:0;background:' + bg + ';color:' + fg + ';font:13px Georgia,serif}' +
    '#pages{padding:8px 0 40px}canvas{display:block;margin:0 auto 12px;box-shadow:0 1px 4px rgba(0,0,0,.18);background:#fff;max-width:100%}' +
    '#msg{padding:24px;text-align:center;font-style:italic}</style>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script></head><body>' +
    '<div id="msg">Loading the essay…</div><div id="pages"></div><script>' +
    'var B64="' + b64 + '";var lines=[];var ready=false;var pending=null;' +
    'function send(m){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));else if(window.parent!==window)window.parent.postMessage(m,"*");}' +
    'function norm(s){return s.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\\s+/g," ").trim();}' +
    // goTo: prefer a short line containing the heading words; else a short line starting with the same roman numeral.
    'function goTo(q){if(!ready){pending=q;return;}var m=/^([ivx]+) (.*)$/.exec(norm(q));if(!m)return;var num=m[1],rest=m[2];var best=null;' +
    // 1) a heading line: starts with a roman numeral and contains the words; 2) any short line containing the words; 3) the numeral alone.
    'for(var i=0;i<lines.length;i++){var t=lines[i].text;if(/^[ivx]+ /.test(t)&&t.indexOf(rest)>=0&&t.length<rest.length+60){best=lines[i];break;}}' +
    'if(!best){for(var i2=0;i2<lines.length;i2++){var t2=lines[i2].text;if(t2.indexOf(rest)>=0&&t2.length<rest.length+30){best=lines[i2];break;}}}' +
    'if(!best){for(var j=0;j<lines.length;j++){if(lines[j].text.indexOf(num+" ")===0&&lines[j].text.length<90){best=lines[j];break;}}}' +
    'if(best)window.scrollTo({top:Math.max(0,best.top-10),behavior:"smooth"});}' +
    'window.__msg=function(m){if(m&&m.goTo)goTo(m.goTo);};window.addEventListener("message",function(e){window.__msg(e.data);});' +
    'function toBytes(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}' +
    'function start(){if(!window.pdfjsLib){document.getElementById("msg").textContent="Could not load the PDF renderer.";return;}' +
    'pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";' +
    'pdfjsLib.getDocument({data:toBytes(B64)}).promise.then(function(doc){document.getElementById("msg").remove();var holder=document.getElementById("pages");var W=Math.min(holder.clientWidth-16,900);var dpr=window.devicePixelRatio||1;' +
    'function render(n){if(n>doc.numPages){ready=true;send({ready:true});if(pending){goTo(pending);pending=null;}return;}doc.getPage(n).then(function(page){var v0=page.getViewport({scale:1});var scale=W/v0.width;var vp=page.getViewport({scale:scale});var c=document.createElement("canvas");c.width=Math.floor(vp.width*dpr);c.height=Math.floor(vp.height*dpr);c.style.width=Math.floor(vp.width)+"px";c.style.height=Math.floor(vp.height)+"px";holder.appendChild(c);var ctx=c.getContext("2d");ctx.scale(dpr,dpr);' +
    'page.render({canvasContext:ctx,viewport:vp}).promise.then(function(){return page.getTextContent();}).then(function(tc){var rows={};tc.items.forEach(function(it){if(!it.str||!it.str.trim())return;var y=Math.round(it.transform[5]);var key=Math.round(y/3)*3;(rows[key]=rows[key]||{y:y,parts:[]}).parts.push(it);});' +
    'Object.keys(rows).map(Number).sort(function(a,b){return b-a;}).forEach(function(k){var row=rows[k];row.parts.sort(function(a,b){return a.transform[4]-b.transform[4];});var text=norm(row.parts.map(function(p){return p.str;}).join(" "));var h=row.parts[0].height||12;lines.push({text:text,top:c.offsetTop+(vp.height-(row.y+h)*scale)});});render(n+1);});});}' +
    'render(1);}).catch(function(e){document.getElementById("msg").textContent="Could not open the PDF: "+e.message;});}' +
    'if(window.pdfjsLib)start();else window.addEventListener("load",start);' +
    '</script></body></html>'
  );
}

export type PdfPaneHandle = { goTo: (heading: string) => void };

const PdfPane = forwardRef<PdfPaneHandle, { id: string; height: number; onReady?: () => void }>(function PdfPane({ id, height, onReady }, ref) {
  const view = useRef<HtmlViewHandle>(null);
  const html = useMemo(() => pdfHtml(PDF_DATA[id] ?? '', C.card2, C.text), [id, C.card2]);
  useImperativeHandle(ref, () => ({ goTo: (heading) => view.current?.post({ goTo: heading }) }));
  const onMessage = useCallback((m: any) => { if (m && m.ready) onReady?.(); }, [onReady]);
  return <HtmlView ref={view} key={id + C.card2} html={html} height={height} scroll onMessage={onMessage} />;
});
export default PdfPane;
