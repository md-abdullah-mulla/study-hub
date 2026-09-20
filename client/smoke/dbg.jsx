import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
const API='http://127.0.0.1:4000';
const dom=new JSDOM('<!doctype html><body><div id="root"></div></body></html>',{url:'http://localhost:5173/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.navigator=dom.window.navigator;
globalThis.HTMLElement=dom.window.HTMLElement;globalThis.Node=dom.window.Node;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.scrollTo=()=>{};
Object.defineProperty(dom.window.Document.prototype,'oninput',{value:null,writable:true,configurable:true});
dom.window.Element.prototype.attachEvent=()=>{};dom.window.Element.prototype.detachEvent=()=>{};
globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
const realFetch=globalThis.fetch;const log=[];
globalThis.fetch=(u,o)=>{const url=typeof u==='string'&&u.startsWith('/')?API+u:u;if(o?.method&&o.method!=='GET')log.push(o.method+' '+url+' '+String(o.body).slice(0,80));return realFetch(url,o).then(r=>{if(!r.ok)log.push('  <-- '+r.status);return r;});};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const type=async(el,v)=>{
  const p=el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype;
  await act(async()=>{Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new dom.window.KeyboardEvent('keydown',{bubbles:true,key:'a'}));await wait(120);});
  await act(async()=>{try{el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));}catch(e){}await wait(120);});
};
const click=async(el,s=900)=>{await act(async()=>{el.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));await wait(s);});};

// ---------- NOTE FLOW ----------
let root=ReactDOMClient.createRoot(document.getElementById('root'));
await act(async()=>{root.render(<MemoryRouter initialEntries={['/subjects/4/chapters/7']}><App/></MemoryRouter>);});
await act(async()=>{await wait(1600);});
await click(document.querySelectorAll('button[aria-label="বিস্তারিত"]')[0],800);
const box=document.querySelector('textarea[id^="note-"]');
await type(box,'QA note test 123');
const addBtn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('নোট যোগ করুন'));
console.log('NOTE | box value:',JSON.stringify(box.value),'| addBtn disabled:',addBtn?.disabled);
await click(addBtn,1400);
console.log('NOTE | page has text:',document.body.textContent.includes('QA note test 123'));
console.log('NOTE | requests:',JSON.stringify(log));
console.log('NOTE | toasts:',[...document.querySelectorAll('div')].map(d=>d.textContent).filter(t=>t.includes('save')||t.includes('যায়নি')).slice(0,3));

// ---------- IMPORT FLOW ----------
await root.unmount();log.length=0;
root=ReactDOMClient.createRoot(document.getElementById('root'));
await act(async()=>{root.render(<MemoryRouter initialEntries={['/import']}><App/></MemoryRouter>);});
await act(async()=>{await wait(1400);});
const tbox=document.querySelector('textarea');
await type(tbox,'Subject: QA Test Subject\nChapter: Chapter 1\nTopics:\n- Alpha\n- Beta\n- Gamma');
const parseBtn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Structure তৈরি করুন'));
console.log('IMPORT | textarea value len:',tbox.value.length,'| parseBtn disabled:',parseBtn?.disabled);
await click(parseBtn,1800);
const page=document.body.textContent.replace(/\s+/g,' ');
console.log('IMPORT | preview present:',page.includes('Preview'),'| has Alpha:',page.includes('Alpha'));
console.log('IMPORT | requests:',JSON.stringify(log));
console.log('IMPORT | snippet:',page.slice(page.indexOf('Import Chapter'),page.indexOf('Import Chapter')+300));
process.exit(0);
