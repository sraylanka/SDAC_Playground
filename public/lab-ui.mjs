export const palette={teal:'#6de5ca',lime:'#cfeb8c',amber:'#efcd93',red:'#ffa394',muted:'#91a5b3',blue:'#88b8ee'};
export const escapeHtml=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmt=(v,n=3)=>v===null||v===undefined?'—':v===Infinity?'∞':v===-Infinity?'−∞':!Number.isFinite(v)?'—':v!==0&&(Math.abs(v)<.001||Math.abs(v)>1e5)?v.toExponential(2):String(Number(v.toFixed(n)));
export const number=(key,label,value,min,max,step=.1,help='')=>({key,label,value,min,max,step,help,type:'number'});
export const slider=(key,label,value,min,max,step=.1,help='')=>({...number(key,label,value,min,max,step,help),slider:true});
export const select=(key,label,value,options,help='')=>({key,label,value,options,help,type:'select'});
export const text=(key,label,value,help='')=>({key,label,value,help,type:'text'});
export const metric=(label,value,note='',status='')=>`<div><span>${escapeHtml(label)}</span><strong class="${escapeHtml(status)}">${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`;
export const table=(headers,rows)=>`<div class="lab-table"><table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const logTicks=(min,max)=>Array.from({length:Math.floor(Math.log10(max))-Math.ceil(Math.log10(min))+1},(_,i)=>10**(Math.ceil(Math.log10(min))+i));
export const frequencyGrid=(min=.01,max=1000,count=700)=>Array.from({length:count},(_,i)=>min*(max/min)**(i/(count-1)));
export function linePlot(chart,{title,series,points=[],lines=[],xmin,xmax,ymin,ymax,xLabel='Time (s)',yLabel='',logX=false,height=280,xticks}){
 const all=series.flatMap(s=>s.data).concat(points.map(p=>[p.x,p.y])).filter(p=>p.every(Number.isFinite));
 if(!all.length)return '<p class="stale-note">No finite values in this view.</p>';
 const extent=i=>{let a=Infinity,b=-Infinity;for(const p of all){a=Math.min(a,p[i]);b=Math.max(b,p[i]);}return [a,b];},[a,b]=extent(0),[c,d]=extent(1),pad=Math.max(.1,(d-c)*.12);
 return chart({width:typeof window!=='undefined'?Math.min(760,Math.max(420,window.innerWidth-80||760)):760,title,series,points,lines,xmin:xmin??a,xmax:xmax??(b===a?a+1:b),ymin:ymin??(c-pad),ymax:ymax??(d+pad),xLabel,yLabel,logX,height,xticks:xticks??(logX?logTicks(xmin??a,xmax??b):undefined)});
}
export function plotCard(title,subtitle,body,legend=''){
 return `<article class="panel chart-panel"><div class="chart-head"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div></div><div class="plot">${body}</div>${legend?`<div class="chart-footer"><span>${escapeHtml(legend)}</span></div>`:''}</article>`;
}
export function bodePlots(chart,curves,{marks=[],phaseMarks=[],title='Frequency response',subtitle='Magnitude and unwrapped phase',min=.01,max=1000}={}){
 const series=curves.map(c=>({data:c.data.map(p=>[p.w,p.db]),color:c.color,dashed:c.dashed})),ph=curves.map(c=>({data:c.data.map(p=>[p.w,p.ph]),color:c.color,dashed:c.dashed}));
 return plotCard(title,subtitle,linePlot(chart,{title:title+' magnitude',series,xmin:min,xmax:max,logX:true,xLabel:'ω (rad/s)',yLabel:'Magnitude (dB)',lines:[{axis:'y',value:0},...marks],height:240})+linePlot(chart,{title:title+' phase',series:ph,xmin:min,xmax:max,logX:true,xLabel:'ω (rad/s)',yLabel:'Phase (°)',lines:[{axis:'y',value:-180},...phaseMarks],height:230}),curves.map(c=>c.label).join(' · '));
}
export function mountLab(container,topic,config,chart){
 let saved;try{saved=JSON.parse(localStorage.getItem('flight-lab-'+topic.id));}catch{}
 const defaults=Object.fromEntries(config.fields.map(f=>[f.key,f.value]));let values={...defaults};
 if(saved&&typeof saved==='object')for(const f of config.fields)if(typeof saved[f.key]===typeof f.value)values[f.key]=saved[f.key];
 const prefix=topic.id+'-',buttons=config.actions||[];
 container.innerHTML=`<div class="section-label"><span>${escapeHtml(topic.title.toUpperCase())} LAB</span><span class="muted">${escapeHtml(config.source)}</span></div><p class="lab-question">${escapeHtml(config.question)}</p><div class="workspace lab-workspace"><aside class="panel settings lab-settings"><div class="panel-heading"><h2>${escapeHtml(config.settingsTitle||'Explore the model')}</h2><span class="tag">LIVE</span></div><form novalidate>${config.fields.map(f=>{
  const id=prefix+f.key,v=values[f.key];return `<div class="lab-field" data-field="${escapeHtml(f.key)}"><label class="field-label" for="${id}">${escapeHtml(f.label)}</label>${f.type==='select'?`<select id="${id}" name="${f.key}">${f.options.map(([key,label])=>`<option value="${escapeHtml(key)}" ${key===v?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select>`:`<input id="${id}" name="${f.key}" type="${f.type}" value="${escapeHtml(v)}" ${f.type==='number'?`min="${f.min}" max="${f.max}" step="${f.step}"`:'maxlength="200" autocomplete="off" spellcheck="false"'}>`}${f.slider?`<input class="slider" type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${escapeHtml(v)}" data-slider="${f.key}" aria-label="${escapeHtml(f.label)} slider">`:''}${f.help?`<p class="hint">${escapeHtml(f.help)}</p>`:''}</div>`;
 }).join('')}<p class="error" data-error role="alert" hidden></p><div class="lab-actions">${buttons.map(b=>`<button type="button" class="primary" data-action="${b.key}">${escapeHtml(b.label)}</button>`).join('')}<button type="button" class="text-button" data-action="reset">Reset this lab</button></div></form></aside><div class="system-results lab-results"><div class="system-metrics" data-metrics aria-live="polite"></div><p class="insight" data-insight aria-live="polite"></p><div class="lab-visuals" data-visuals></div><div data-extra></div></div></div><div class="lab-guide"><span class="eyebrow">THIS TOPIC / FIELD GUIDE</span><h2>${escapeHtml(config.guideTitle||'Keep the meaning with the math.')}</h2>${config.guide}</div>`;
 const form=container.querySelector('form'),error=container.querySelector('[data-error]'),outputs={};for(const name of ['metrics','insight','visuals','extra'])outputs[name]=container.querySelector('[data-'+name+']');
 let timer,disposed=false;
 function collect(){
  for(const f of config.fields){const input=form.elements.namedItem(f.key);let v=input.value;if(f.type==='number'){if(v===''||!Number.isFinite(Number(v))||Number(v)<f.min||Number(v)>f.max)throw Error(`${f.label}: enter a value from ${f.min} to ${f.max}.`);v=Number(v);}else if(f.type==='select'&&!f.options.some(o=>o[0]===v))throw Error('Choose a valid '+f.label.toLowerCase()+'.');values[f.key]=v;}
  return values;
 }
 const api={chart,container,outputs,get values(){return values;},set(patch){for(const [k,v] of Object.entries(patch)){const input=form.elements.namedItem(k);if(input)input.value=v;}render();},render};
 function render(){
  if(disposed)return;
  try{collect();config.validate?.(values);for(const f of config.fields){const wrapper=form.querySelector(`[data-field="${f.key}"]`);wrapper.hidden=!!f.when&&!f.when(values);const range=wrapper.querySelector('[data-slider]');if(range)range.value=values[f.key];}
   const result=config.render(values,api);for(const name of Object.keys(outputs))outputs[name].innerHTML=result[name]||'';error.hidden=true;try{localStorage.setItem('flight-lab-'+topic.id,JSON.stringify(values));}catch{}config.afterRender?.(values,api);
  }catch(e){error.textContent=e.message;error.hidden=false;for(const output of Object.values(outputs))output.replaceChildren();}
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',e=>{if(e.target.dataset.slider)form.elements.namedItem(e.target.dataset.slider).value=e.target.value;clearTimeout(timer);render();});form.addEventListener('change',()=>{clearTimeout(timer);render();});
 container.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);if(b.dataset.action==='reset'){config.reset?.();api.set(defaults);}else{try{collect();config.action?.(b.dataset.action,values,api);}catch(e){error.textContent=e.message;error.hidden=false;}}}));
 const resize=()=>{clearTimeout(timer);timer=setTimeout(render,100);};window.addEventListener('resize',resize);
 render();return ()=>{disposed=true;clearTimeout(timer);window.removeEventListener('resize',resize);config.dispose?.();};
}
export function guideCards(cards){return '<div class="reference-grid">'+cards.map(([title,equation,description])=>`<article class="reference-card"><h3>${escapeHtml(title)}</h3><p class="equation compact">${escapeHtml(equation)}</p><p>${escapeHtml(description)}</p></article>`).join('')+'</div>';}
// Send a designed loop to the original analyzer without a server or shared account state.
export function openAnalyzer(n,d,gain=1){
 for(const [id,value] of [['numerator',n.join(', ')],['denominator',d.join(', ')],['gain',gain],['preset','custom']])document.getElementById(id).value=value;
 document.getElementById('linked-note').textContent='Loop sent from a Chapter 9/10 playground. Unity negative feedback is assumed.';
 document.getElementById('gain').dispatchEvent(new Event('input',{bubbles:true}));
 window.location.hash='frequency-response';
}
