import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initNavigation} from '../public/navigation.mjs';
import {topics,resolveTopic} from '../public/topics.mjs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
class Element extends EventTarget {
 constructor(attrs={}){super();this.attrs={...attrs};this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));this.hidden=false;this.textContent='';this.value='';this.children=[];}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
 set href(v){this.attrs.href=v;}get href(){return this.attrs.href;}get hash(){return this.attrs.href?.slice(this.attrs.href.indexOf('#'));}
 replaceChildren(...nodes){this.children=nodes;}append(node){this.children.push(node);}focus(){this.focused=true;}click(){this.dispatchEvent(new Event('click'));}
}
function setup({hash='',saved='',mobile=false}={}){
 const ids=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 const links=[...html.matchAll(/<a [^>]*data-topic="([^"]+)"[^>]*>/g)].map(m=>new Element({'data-topic':m[1],href:'#'+m[1]}));
 const cards=[...html.matchAll(/data-topics="([^"]+)"/g)].map(m=>new Element({'data-topics':m[1]}));
 const origin=new Element(),details=new Element(),document=new EventTarget(),window=new EventTarget(),media=new EventTarget(),storage=new Map(saved?[['flight-controls-topic',saved]]:[]);
 Object.assign(document,{body:{dataset:{}},getElementById:id=>ids.get(id),querySelectorAll:s=>s==='[data-topic]'?links:cards,querySelector:s=>s==='.pole-details'?details:origin,createTextNode:text=>({textContent:text}),createElement:()=>new Element()});
 Object.assign(media,{matches:mobile});Object.assign(window,{location:{hash},matchMedia:()=>media,scrollTo:()=>{window.scrolled=true;}});
 Object.assign(globalThis,{document,window,history:{replaceState:(_,__,value)=>window.location.hash=value},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 const visited=[];initNavigation(t=>visited.push(t.id));
 const go=id=>{window.location.hash='#'+id;window.dispatchEvent(new Event('hashchange'));};
 return {ids,links,cards,origin,details,document,window,media,storage,visited,go};
}
test('topic HTML has unique IDs and a complete sidebar',()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const topic of topics){assert.ok(html.includes(`data-topic="${topic.id}"`));}assert.ok(html.includes('aria-controls="topic-sidebar"'));});
test('initial topic is accessible and linked workspace is focused by navigation',()=>{const s=setup();assert.equal(s.document.body.dataset.playground,'overshoot-damping');assert.equal(s.ids.get('design').hidden,false);assert.equal(s.ids.get('transfer').hidden,true);assert.equal(s.links.filter(n=>n.getAttribute('aria-current')==='page').length,1);s.go('settling-poles');assert.equal(s.visited.at(-1),'settling-poles');assert.equal(s.ids.get('playground-heading').focused,true);assert.ok(s.window.scrolled);});
test('frequency and type topics switch content and relevant references without resetting inputs',()=>{const s=setup();s.ids.get('numerator').value='1, 7';s.go('frequency-response');assert.equal(s.ids.get('design').hidden,true);assert.equal(s.ids.get('transfer').hidden,false);assert.equal(s.cards.filter(c=>!c.hidden).length,2);assert.equal(s.origin.hidden,true);s.go('system-type');assert.equal(s.origin.hidden,false);assert.equal(s.details.open,true);assert.equal(s.cards.filter(c=>!c.hidden).length,1);assert.equal(s.ids.get('numerator').value,'1, 7');s.go('overshoot-damping');assert.equal(s.origin.hidden,true);assert.equal(s.cards.filter(c=>!c.hidden).length,3);});
test('direct links override remembered topic; reload restores topic when hash absent',()=>{assert.equal(setup({saved:'system-type'}).visited[0],'system-type');assert.equal(setup({hash:'#settling-poles',saved:'system-type'}).visited[0],'settling-poles');assert.equal(resolveTopic('#does-not-exist','frequency-response').id,'frequency-response');assert.equal(resolveTopic('#transfer').id,'frequency-response');assert.equal(resolveTopic('#design').id,'overshoot-damping');});
test('mobile menu toggles, closes with Escape and on selection, and responds to resizing',()=>{const s=setup({mobile:true}),sidebar=s.ids.get('topic-sidebar'),toggle=s.ids.get('menu-toggle');assert.ok(sidebar.hidden);toggle.click();assert.equal(sidebar.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');const event=new Event('keydown');event.key='Escape';s.document.dispatchEvent(event);assert.ok(sidebar.hidden);assert.ok(toggle.focused);toggle.click();s.go('frequency-response');assert.ok(sidebar.hidden);s.media.matches=false;s.media.dispatchEvent(new Event('change'));assert.equal(sidebar.hidden,false);s.media.matches=true;s.media.dispatchEvent(new Event('change'));assert.ok(sidebar.hidden);});
test('adjacent topic links stop at the first and last topic',()=>{const s=setup();assert.ok(s.ids.get('previous-topic').hidden);assert.equal(s.ids.get('next-topic').href,'#settling-poles');s.go('system-type');assert.ok(s.ids.get('next-topic').hidden);assert.equal(s.ids.get('previous-topic').href,'#frequency-response');});
