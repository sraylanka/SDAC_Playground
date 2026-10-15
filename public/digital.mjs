import {sampleSignal,holdSeries} from './digital-math.mjs';
export function initDigital(chart) {
 const $=id=>document.getElementById(id),fields=['period','frequency','amplitude','offset','phase','bits','range'],defaults={period:.1,frequency:1,amplitude:1.5,offset:2,phase:0,bits:3,range:5};
 let view='sampling';
 try{const saved=JSON.parse(localStorage.getItem('flight-controls-digital-v1'));if(saved&&typeof saved==='object')for(const key of fields)if(Number.isFinite(saved[key]))$('digital-'+key).value=saved[key];}catch{}
 const f=v=>Number(v.toFixed(4)).toString();
 function render(){
  const values=Object.fromEntries(fields.map(key=>[key,$('digital-'+key).value===''?NaN:Number($('digital-'+key).value)]));
  let data;try{data=sampleSignal({...values,span:values.range});}catch(e){$('digital-error').hidden=false;$('digital-error').textContent=e.message;for(const id of ['chart','metrics','insight','word','weights','readout','hold-note','ledger','index-label'])$('digital-'+id).replaceChildren();$('digital-index').disabled=true;return;}
  $('digital-error').hidden=true;$('digital-index').disabled=false;$('digital-clock').value=values.period;
  try{localStorage.setItem('flight-controls-digital-v1',JSON.stringify(values));}catch{}
  const {samples,signal,fs,nyquist,alias,aliasSignal,delta}=data,unsafe=values.frequency>=nyquist,overload=samples.some(s=>s.overload);
  $('digital-metrics').innerHTML=`<div><span>Sampling frequency</span><strong>${f(fs)} Hz</strong><small>T = ${f(values.period)} s</small></div><div><span>Nyquist boundary</span><strong class="${unsafe?'warn':'pass'}">${f(nyquist)} Hz</strong><small>${unsafe?'At or beyond the boundary':'Signal below the boundary'}</small></div><div><span>Quantization step Δ</span><strong>${f(delta)} V</strong><small>${2**values.bits} levels · ±${f(delta/2)} V without overload</small></div>`;
  const continuous=Array.from({length:1001},(_,i)=>[i/500,signal(i/500)]),series=[{data:continuous,color:'#6de5ca',width:1.8}];
  if(view==='sampling'&&unsafe)series.push({data:continuous.map(([t])=>[t,aliasSignal(t)]),color:'#efcd93',dashed:true});
  if(view!=='sampling')series.push({data:holdSeries(samples,2,view==='adc'?'input':'voltage'),color:view==='adc'?'#91a5b3':'#cfeb8c',width:2});
  if(view==='sampling')for(const s of samples)series.push({data:[[s.t,0],[s.t,s.input]],color:'#405b59',width:1});
  const points=samples.map(s=>({x:s.t,y:view==='sampling'?s.input:s.voltage,color:'#cfeb8c'}));
  $('digital-index').max=samples.length-1;const index=Math.min(samples.length-1,Math.max(0,Number($('digital-index').value)));$('digital-index').value=index;const selected=samples[index];
  const ymin=Math.min(0,values.offset-values.amplitude)-.4,ymax=Math.max(values.range,values.offset+values.amplitude)+.4;
  $('digital-chart').innerHTML=chart({title:view==='sampling'?'Analog signal and sampling instants':view==='adc'?'Sample-and-hold input and quantized samples':'D/A output with zero-order hold',xmin:0,xmax:2,ymin,ymax,xLabel:'Time (s)',yLabel:'Voltage (V)',series,points,lines:[{axis:'x',value:selected.t,label:`k = ${index}`,color:'#efcd93'}],height:310});
  $('digital-insight').textContent=(unsafe?`Sampling ambiguity: ${f(values.frequency)} Hz and a ${f(alias)} Hz alias have identical samples before quantization. ${view==='sampling'?'The amber curve shows that alternative.':'Switch to Sampling to see the amber alternative.'} At the Nyquist boundary, phase may hide oscillation. `:`${f(fs/values.frequency)} samples per cycle. Decrease T to follow the analog signal more closely. `)+(overload?'Converter overload: some sampled voltages exceed the representable 0 to '+f(values.range-delta)+' V range. Error can exceed Δ/2.':'Sampled inputs remain in the representable range. Quantization changes amplitude; the hold adds staircase error between samples.');
  $('digital-index-label').textContent=`k = ${index} · ${f(selected.t)} s`;
  $('digital-word').textContent=selected.binary;
  const weights=[...selected.binary].map((bit,i)=>`${bit}×${2**(values.bits-1-i)}`);
  $('digital-weights').textContent=`MSB → LSB: ${weights.join(' + ')} = ${selected.code}`;
  $('digital-readout').innerHTML=`<div><span>Analog sample</span><strong>${f(selected.input)} V</strong></div><div><span>A/D code</span><strong>${selected.code} / ${2**values.bits-1}</strong></div><div><span>D/A = code × Δ</span><strong>${f(selected.voltage)} V</strong></div><div><span>D/A − input</span><strong>${f(selected.error)} V</strong></div>`;
  $('digital-hold-note').textContent=`Hold ${f(selected.voltage)} V from t = ${f(selected.t)} to ${f(selected.t+values.period)} s (until the next clock tick). ${selected.overload?'This sample is outside the representable voltage range.':''}`;
  $('digital-ledger').innerHTML=samples.map(s=>`<tr${s.k===index?' class="selected-sample"':''}><td>${s.k}</td><td>${f(s.t)}</td><td>${f(s.input)}</td><td><code>${s.binary}</code></td><td>${f(s.voltage)}</td><td>${f(s.error)}${s.overload?' *':''}</td></tr>`).join('');
 }
 fields.forEach(key=>$('digital-'+key).addEventListener('input',render));
 $('digital-clock').addEventListener('input',()=>{$('digital-period').value=$('digital-clock').value;render();});
 $('digital-index').addEventListener('input',render);
 document.querySelectorAll('[data-digital-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.digitalView;document.querySelectorAll('[data-digital-view]').forEach(btn=>{const active=btn===b;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active);});render();}));
 $('digital-preset').addEventListener('change',()=>{const presets={clean:{},alias:{period:.3,frequency:4},coarse:{bits:2},clip:{amplitude:3,offset:2.5}};for(const [key,value] of Object.entries({...defaults,...presets[$('digital-preset').value]}))$('digital-'+key).value=value;render();});
 render();return render;
}
