import React, { useMemo } from 'react';
import HtmlView from './HtmlView';
import { PDF_DATA } from '../lectures/pdfData';
import { C } from '../theme';

// Renders an embedded lecture PDF page by page with pdf.js (loaded from cdnjs), inside HtmlView.
// The PDF travels as base64 inside the document, so the published single-file build stays self-contained.
function pdfHtml(b64: string, bg: string, fg: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>html,body{margin:0;background:' + bg + ';color:' + fg + ';font:13px Georgia,serif}' +
    '#pages{padding:8px 0 40px}canvas{display:block;margin:0 auto 12px;box-shadow:0 1px 4px rgba(0,0,0,.18);background:#fff;max-width:100%}' +
    '#msg{padding:24px;text-align:center;font-style:italic}</style>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script></head><body>' +
    '<div id="msg">Loading the essay…</div><div id="pages"></div><script>' +
    'var B64="' + b64 + '";' +
    'function toBytes(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}' +
    'function start(){if(!window.pdfjsLib){document.getElementById("msg").textContent="Could not load the PDF renderer.";return;}' +
    'pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";' +
    'pdfjsLib.getDocument({data:toBytes(B64)}).promise.then(function(doc){document.getElementById("msg").remove();var holder=document.getElementById("pages");var W=Math.min(holder.clientWidth-16,900);var dpr=window.devicePixelRatio||1;' +
    'function render(n){if(n>doc.numPages)return;doc.getPage(n).then(function(page){var v0=page.getViewport({scale:1});var scale=W/v0.width;var vp=page.getViewport({scale:scale});var c=document.createElement("canvas");c.width=Math.floor(vp.width*dpr);c.height=Math.floor(vp.height*dpr);c.style.width=Math.floor(vp.width)+"px";c.style.height=Math.floor(vp.height)+"px";holder.appendChild(c);var ctx=c.getContext("2d");ctx.scale(dpr,dpr);page.render({canvasContext:ctx,viewport:vp}).promise.then(function(){render(n+1);});});}' +
    'render(1);}).catch(function(e){document.getElementById("msg").textContent="Could not open the PDF: "+e.message;});}' +
    'if(window.pdfjsLib)start();else window.addEventListener("load",start);' +
    '</script></body></html>'
  );
}

export default function PdfPane({ id, height }: { id: string; height: number }) {
  const html = useMemo(() => pdfHtml(PDF_DATA[id] ?? '', C.card2, C.text), [id, C.card2]);
  return <HtmlView key={id + C.card2} html={html} height={height} scroll />;
}
