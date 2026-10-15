import {roots,stepResponse,canonicalStep} from './math.mjs';
import {multiply,scale,closedLoop,controller,designPoint,targetGeometry,rootLocus,trackingConstants,frequencyData,rateFeedback,circuit} from './chapter-math.mjs';
import {palette as C,fmt,escapeHtml as esc,number,slider,select,metric,table,linePlot,plotCard,bodePlots,guideCards,openAnalyzer} from './lab-ui.mjs';
const plants={motor:{n:[1],d:[1,2,0],label:'Motor · 1/[s(s+2)]'},third:{n:[1],d:[1,8,12,0],label:'Third order · 1/[s(s+2)(s+6)]'},type0:{n:[1],d:[1,5,4],label:'Type 0 · 1/[(s+1)(s+4)]'}};
const plantField=select('plant','Uncompensated plant','third',Object.entries(plants).map(([k,p])=>[k,p.label]));
const poleText=ps=>ps.map(p=>`${fmt(p[0])}${Math.abs(p[1])>1e-7?` ${p[1]<0?'−':'+'} j${fmt(Math.abs(p[1]))}`:''}`).join('; ')||'None';
const tfText=(n,d)=>`N = [${n.map(v=>fmt(v,4)).join(', ')}] · D = [${d.map(v=>fmt(v,4)).join(', ')}]`;
function locusPlot(chart,n,d,gain,target,cache){
 const key=JSON.stringify([n,d]);if(cache.key!==key){cache.key=key;cache.value=rootLocus(n,d,500,100);}
 const geometry=targetGeometry(n,d,target),loop=closedLoop(n,d,gain,1,20);
 const poles=geometry.poles,zeros=geometry.zeros,bound=Math.max(6,Math.abs(target[0])*2,...poles.map(p=>Math.abs(p[0]))),vertical=Math.max(5,target[1]*1.8,...loop.poles.map(p=>Math.abs(p[1])*1.2));
 const series=cache.value.branches.map(data=>({data,color:C.teal,width:1.4}));
 for(const p of poles)series.push({data:[p,target],color:C.muted,dashed:true,width:.7});for(const z of zeros)series.push({data:[z,target],color:C.amber,dashed:true,width:.7});
 const points=[...poles.map(p=>({x:p[0],y:p[1],shape:'cross',color:C.red})),...zeros.map(p=>({x:p[0],y:p[1],shape:'zero',color:C.amber})),...loop.poles.map(p=>({x:p[0],y:p[1],color:C.lime})),{x:target[0],y:target[1],shape:'cross',color:C.blue}];
 const html=linePlot(chart,{title:'Root locus and target pole geometry',series,points,xmin:-bound*1.1,xmax:Math.max(1,...loop.poles.map(p=>p[0]*1.2)),ymin:-vertical,ymax:vertical,xLabel:'Real σ (1/s)',yLabel:'Imaginary ω (rad/s)',lines:[{axis:'x',value:0},{axis:'y',value:0}],height:340});
 return {geometry,html:plotCard('Shape the locus. Then choose gain.','Dashed vectors show pole/zero contributions at the blue target.',html,`Teal: locus for 0 ≤ K ≤ 500 · lime: current closed-loop poles · red ×: open-loop poles · amber ○: zeros${cache.value.skipped?' · '+cache.value.skipped+' unresolved gain samples omitted':''}`)};
}
function compensationConfig(id){
 const lead=id==='lead-design',lag=id==='lag-design',combo=id==='combined-design',cache={};
 const kinds=lead?[['lead','Practical lead'],['pd','Ideal PD']]:lag?[['lag','Practical lag'],['pi','Ideal PI']]:[['lag-lead','Practical lag–lead'],['pid','Ideal PID']];
 const fields=[{...plantField,value:lag?'type0':'third'},select('kind','Compensator',kinds[0][0],kinds),slider('gain','Final loop gain K',lead?30:lag?8:60,.01,500,.01),slider('baselineGain','Uncompensated gain',8,.01,100,.01)];
 if(lead||combo)fields.push(slider('zero','Lead / PD zero at −z',1,.02,20,.02),{...slider('pole','Lead pole at −p',12,.05,50,.05),when:v=>!['pd','pid'].includes(v.kind)});
 if(lag||combo)fields.push(slider('lagZero','Lag / PI zero at −zᵢ',.2,.001,2,.001),{...slider('lagPole','Lag pole at −pᵢ',.02,.0001,1,.0001),when:v=>!['pi','pid'].includes(v.kind)});
 fields.push(slider('targetOS','Target overshoot (%)',20,1,70,1),slider('targetTs','Target settling time (s)',2,.3,12,.1),slider('horizon','Response window (s)',lag||combo?60:12,2,200,1));
 return {
  source:lead?'Nise §9.3 · pp. 462–473':lag?'Nise §9.2 · pp. 453–461':'Nise §9.4 · pp. 474–486',fields,
  question:lead?'Can a new zero put your desired response on the root locus?':lag?'How much tracking improvement can you buy without changing the fast response?':'Can you meet speed and accuracy targets in two deliberate stages?',
  actions:[...(lead?[{key:'solve',label:'Solve zero / pole for target'}]:[]),{key:'magnitude',label:'Use target magnitude gain'},{key:'analyzer',label:'Open final loop in analyzer'}],
  validate(v){if(v.kind.includes('lead')&&v.pole<=v.zero)throw Error('For a lead section, p must exceed z (pole farther left).');if(v.kind.includes('lag')&&v.lagPole>=v.lagZero)throw Error('For a lag section, pᵢ must be smaller than zᵢ (pole closer to the origin).');},
  action(action,v,api){
   const plant=plants[v.plant],target=designPoint(v.targetOS,v.targetTs).s;
   if(action==='analyzer'){const c=controller(v.kind,v);openAnalyzer(multiply(plant.n,c.n),multiply(plant.d,c.d),v.gain);return;}
   if(action==='solve'){
    if(v.kind==='pd'){
     const angle=targetGeometry(plant.n,plant.d,target).angle,required=((180-angle)%360+360)%360;
     if(required<=0||required>=180)throw Error('A single left-half-plane zero cannot supply this angle. Change the target.');
     const zero=target[1]/Math.tan(required*Math.PI/180)-target[0];if(zero<.02||zero>20)throw Error('Required zero is outside this lab’s range. Change the target.');api.set({zero:Number(zero.toFixed(5))});
    }else{
     const angle=targetGeometry(multiply(plant.n,[1,v.zero]),plant.d,target).angle,required=((angle-180)%360+360)%360;
     const pole=target[1]/Math.tan(required*Math.PI/180)-target[0];if(required<=0||required>=180||pole<=v.zero||pole>50)throw Error('That zero and target do not admit a lead pole in range. Try another zero or target.');api.set({pole:Number(pole.toFixed(5))});
    }
   }
   const updated=api.values,c=controller(updated.kind,updated),n=multiply(plant.n,c.n),d=multiply(plant.d,c.d),g=targetGeometry(n,d,target).gain;
   if(!(g>=.01&&g<=500))throw Error('Target magnitude gain is outside 0.01–500. Change the target.');api.set({gain:Number(g.toFixed(5))});
  },
  render(v,{chart}){
   const plant=plants[v.plant],c=controller(v.kind,v),n=multiply(plant.n,c.n),d=multiply(plant.d,c.d),target=designPoint(v.targetOS,v.targetTs),base=closedLoop(plant.n,plant.d,v.baselineGain,v.horizon),final=closedLoop(n,d,v.gain,v.horizon),constants=trackingConstants(n,d,v.gain),baseConstants=trackingConstants(plant.n,plant.d,v.baselineGain);
   const stages=[{label:'Uncompensated',model:base,color:C.muted,constants:baseConstants}];
   if(combo){const first=controller(v.kind==='pid'?'pd':'lead',v),firstN=multiply(plant.n,first.n),firstD=multiply(plant.d,first.d),mid=closedLoop(firstN,firstD,v.gain,v.horizon);stages.push({label:'Transient stage',model:mid,color:C.amber,constants:trackingConstants(firstN,firstD,v.gain)});}
   stages.push({label:'Final compensated',model:final,color:C.lime,constants});
   const locus=locusPlot(chart,n,d,v.gain,target.s,cache);
   const estimated=Array.from({length:700},(_,i)=>{const t=i*Math.min(v.horizon,v.targetTs*4)/699;return [t,canonicalStep(target.zeta,4/(v.targetTs*target.zeta),t)];});
   const stepSeries=stages.map(s=>({data:s.model.response.map(p=>[p.t,p.y]),color:s.color}));stepSeries.push({data:estimated,color:C.blue,dashed:true});
   const step=plotCard('Compare the full step responses.','The blue dashed line is the canonical target estimate, not the compensated system.',linePlot(chart,{title:'Compensation step comparison',series:stepSeries,xmin:0,xmax:v.horizon,ymin:Math.min(-.1,...stages.flatMap(s=>s.model.response.map(p=>Math.max(-2,p.y)))) ,ymax:Math.min(5,Math.max(1.2,...stages.flatMap(s=>s.model.response.map(p=>Math.min(5,p.y))))),yLabel:'Output',lines:[{axis:'y',value:1},{axis:'x',value:v.targetTs,label:'Target Tₛ'}]}),`${combo?'Gray: original · amber: intermediate':'Gray: original'} · lime: final · blue dashed: target estimate`);
   let tracking='';
   if(lag||combo){
    const order=baseConstants.type===0?0:1,input=t=>order===0?1:t;
    const traces=stages.map(s=>{const model=s.model,den=order?multiply(model.cd,[1,0]):model.cd;const data=order?stepResponse(model.num,den,roots(den),v.horizon,1000):model.response;return {data:data.map(p=>[p.t,p.y]),color:s.color};});
    traces.unshift({data:[[0,input(0)],[v.horizon,input(v.horizon)]],color:C.blue,dashed:true});
    tracking=plotCard(order?'Track a ramp.':'Track a unit step.','Accuracy claims apply only to asymptotically stable closed loops.',linePlot(chart,{title:'Tracking comparison',series:traces,xmin:0,xmax:v.horizon,yLabel:'Reference / output'}),'Blue dashed: reference · gray: original · lime: final');
   }
   const geom=locus.geometry,stable=final.stable,realSlow=stable?Math.min(...final.poles.map(p=>-p[0])):null;
   return {metrics:metric('Closed loop',stable?'Stable':final.boundary?'Near axis':'Unstable',poleText(final.poles),stable?'pass':'fail')+metric('Measured overshoot',fmt(final.metrics.os)+'%',`Target ≤ ${v.targetOS}%`,stable&&final.metrics.os<=v.targetOS?'pass':'')+metric('Measured Tₛ',fmt(final.metrics.ts)+' s',`±2%; window ${v.horizon} s`),
    insight:`${geom.onLocus?'Target satisfies the angle condition to within 1°.':'Target is not yet on this locus: the angle condition must be met before magnitude gain will place a pole there.'} Angle error ${fmt(geom.deficit,2)}°; magnitude gain ${fmt(geom.gain,3)}. ${realSlow&&1/realSlow>v.horizon/5?'A slow mode may need a longer response window. ':''}${stable&&final.poles.some(p=>p[0]>target.s[0]+.1)?'Another pole is closer to the imaginary axis than the target; the target pair may not dominate. ':''}All response metrics come from the full transfer function.`,
    visuals:locus.html+step+tracking,
    extra:table(['Stage','Stability','%OS','Tₛ (s)','Type','Kₚ / Kᵥ / Kₐ','Step / ramp / parabola error'],stages.map(s=>[s.label,s.model.stable?'Stable':'Not asymptotically stable',fmt(s.model.metrics.os),fmt(s.model.metrics.ts),s.constants.type,[s.constants.kp,s.constants.kv,s.constants.ka].map(x=>fmt(x)).join(' / '),s.model.stable?s.constants.errors.map(x=>fmt(x)).join(' / '):'Unavailable']))+`<details class="pole-details"><summary>Target geometry & transfer function</summary><p class="hint">${esc(tfText(scale(n,v.gain),d))}</p><p class="hint">Target s = ${esc(poleText([target.s]))}; ζ = ${fmt(target.zeta)}. A 180° odd-multiple phase is required. Nearest phase error: ${fmt(geom.deficit)}°.</p>${table(['Contribution','Location','Vector angle (°)'],[...geom.zeros.map(z=>['Zero (+)',poleText([z]),fmt(Math.atan2(target.s[1]-z[1],target.s[0]-z[0])*180/Math.PI)]),...geom.poles.map(p=>['Pole (−)',poleText([p]),fmt(Math.atan2(target.s[1]-p[1],target.s[0]-p[0])*180/Math.PI)])])}</details>`};
  },
  guide:guideCards(lead?[
   ['Angle, then magnitude','∠L(sᵈ) = (2m+1)180°; K = 1/|L₀(sᵈ)|','A target pole must satisfy both conditions. The magnitude-gain button alone cannot repair an angle mismatch. The solve button uses the selected plant and target to place the PD zero or lead pole.'],
   ['Ideal and practical','PD: s+z · Lead: (s+z)/(s+p), p>z','A lead section includes a pole in addition to the zero. Ideal differentiation amplifies high-frequency noise; the practical pole limits its high-frequency gain.'],
   ['Check the full response','T(s) = L(s)/(1+L(s))','Target overshoot and settling time use a second-order approximation. Extra poles and zeros can invalidate it. Truncated or unsettled responses show an unavailable settling time.']
  ]:lag?[
   ['Increase low-frequency gain','Lag: (s+zᵢ)/(s+pᵢ), 0<pᵢ<zᵢ','The zero/pole ratio increases DC gain at fixed K. Moving both near the origin often reduces their effect at the dominant poles, but can add a long tail.'],
   ['PI changes system type','PI: (s+zᵢ)/s','An added origin pole raises type unless cancelled. Verify the full closed-loop stability before using the final-value tracking rules.'],
   ['Compare like inputs','Step error = 1/(1+Kₚ); ramp error = 1/Kᵥ','The tracking chart uses a step for a Type 0 original plant and a ramp for a Type 1 original plant. Error tables also show the parabolic-input t²/2 case.']
  ]:[
   ['Design in stages','Transient design → accuracy design → verify','The intermediate stage uses the same K as the final stage so the effect of adding lag or PI is visible. The original gain is separately adjustable.'],
   ['Two controller families','PID = K(s+z)(s+zᵢ)/s','For PID, Kd=K, Kp=K(z+zᵢ), Ki=Kzzᵢ. Practical lag–lead replaces ideal differentiation and integration with finite pole/zero sections.'],
   ['Do not assume independence','Every added pole and zero changes the full model','Design stages interact. Compare every response and extend the time window to inspect slow modes; a target dominant pair alone is insufficient.']
  ])
 };
}
function rateConfig(){return {
 source:'Nise §9.5 · pp. 487–494',question:'Can velocity feedback add damping without simply reducing the position-loop gain?',
 fields:[slider('a','Motor damping a (1/s)',2,.1,10,.1),slider('gain','Outer position gain K',16,.1,100,.1),slider('feedback','Inner rate gain kf',4,0,20,.1),slider('horizon','Response window (s)',10,2,40,.5)],
 render(v,{chart}){
  const r=rateFeedback(v.a,v.gain,v.feedback),base=rateFeedback(v.a,v.gain,0),poles=roots(r.d),basePoles=roots(base.d),response=stepResponse(r.n,r.d,poles,v.horizon,900),original=stepResponse(base.n,base.d,basePoles,v.horizon,900),m=metricsFor(response),zeta=(v.a+v.feedback)/(2*Math.sqrt(v.gain));
  const schematic=`<svg class="loop-schematic" viewBox="0 0 760 150" role="img" aria-label="Outer position loop and inner rate feedback around motor"><path class="signal-flow" d="M15 45H730 M680 45V130H60V45 M590 45V90H200V45"/><rect x="90" y="25" width="90" height="40"/><rect x="240" y="25" width="180" height="40"/><rect x="450" y="25" width="150" height="40"/><rect x="360" y="73" width="110" height="34"/><text x="135" y="50">K = ${fmt(v.gain)}</text><text x="330" y="50">1/[s(s+${fmt(v.a)})]</text><text x="525" y="50">Position y(t)</text><text x="415" y="95">kf · s = ${fmt(v.feedback)}s</text><text x="180" y="22">+ / −</text><text x="55" y="25">+ / −</text><text x="310" y="145">Unity position feedback</text></svg>`;
  return {metrics:metric('Damping ratio ζ',fmt(zeta),'(a+kf)/(2√K)')+metric('Natural frequency',fmt(Math.sqrt(v.gain))+' rad/s','Set by outer gain K')+metric('Measured overshoot',fmt(m.os)+'%',`Tₛ = ${fmt(m.ts)} s`),insight:`The inner velocity loop moves its nonzero pole from −${fmt(v.a)} to −${fmt(v.a+v.feedback)}. Increasing kf increases damping at fixed natural frequency; too much feedback produces an overdamped, slower response.`,visuals:plotCard('Close the inner loop.','Rate feedback changes the effective damping of the motor.',schematic)+plotCard('Position response','Gray: no rate feedback · lime: current inner loop',linePlot(chart,{title:'Rate feedback step comparison',series:[{data:original.map(p=>[p.t,p.y]),color:C.muted},{data:response.map(p=>[p.t,p.y]),color:C.lime}],yLabel:'Position',xmin:0,xmax:v.horizon,lines:[{axis:'y',value:1}]}))+plotCard('Outer-loop poles','All poles remain in the left half-plane for the positive parameters here.',linePlot(chart,{title:'Rate feedback closed-loop poles',series:[],points:[...basePoles.map(p=>({x:p[0],y:p[1],color:C.muted,shape:'cross'})),...poles.map(p=>({x:p[0],y:p[1],color:C.lime,shape:'cross'}))],xmin:-Math.max(5,v.a+v.feedback),xmax:1,ymin:-Math.sqrt(v.gain)*1.3,ymax:Math.sqrt(v.gain)*1.3,xLabel:'σ (1/s)',yLabel:'ω (rad/s)',lines:[{axis:'x',value:0},{axis:'y',value:0}]})),extra:`<p class="hint">T(s) = ${fmt(v.gain)} / [s² + ${fmt(v.a+v.feedback)}s + ${fmt(v.gain)}]. Closed-loop poles: ${esc(poleText(poles))}.</p>`};
 },guide:guideCards([['Inner and outer loops','T(s)=K/[s²+(a+kf)s+K]','The ideal motor is 1/[s(s+a)]. Negative rate feedback kf·s is inside the outer unity position loop. Kf acts at the motor input; it is not multiplied by K in this configuration.'],['Damping is not always speed','ζ=(a+kf)/(2√K)','Critical damping occurs at kf=2√K−a when this value is nonnegative. Beyond that, the slow real pole approaches the origin as rate feedback increases.']])
};}
function metricsFor(data){let last=-1;data.forEach((p,i)=>{if(Math.abs(p.y-1)>.02)last=i;});return {os:Math.max(0,(Math.max(...data.map(p=>p.y))-1)*100),ts:last===data.length-1?null:data[Math.min(last+1,data.length-1)].t};}
function circuitConfig(){return {
 source:'Nise §9.6 · pp. 495–499 · Tables 9.10–9.11',question:'Which pole and zero do your resistor and capacitor values actually build?',
 fields:[select('kind','Circuit','lead',[['lead','Passive lead'],['lag','Passive lag'],['pi','Active inverting PI'],['pd','Active inverting PD']]),slider('r1','R₁ (kΩ)',10,1,100,.5),slider('r2','R₂ (kΩ)',20,1,100,.5),slider('cap','C (µF)',10,.1,100,.1)],
 render(v,{chart}){
  const model=circuit(v.kind,v.r1,v.r2,v.cap),data=frequencyData(model.n,model.d,.001,1e4),active=model.sign<0;
  const resistor=(x,y,label)=>`<path d="M${x} ${y}h10l5 -7l10 14l10 -14l10 14l10 -14l5 7h10"/><text x="${x+40}" y="${y-16}">${esc(label)}</text>`;
  const capacitor=(x,y,label)=>`<path d="M${x} ${y}h28m0 -12v24m12 -24v24m0 -12h30"/><text x="${x+35}" y="${y-18}">${esc(label)}</text>`;
  let schematic;
  if(active){const z1=v.kind==='pi'?resistor(80,90,'R₁'):resistor(80,90,'R₁')+capacitor(80,130,'C');const z2=v.kind==='pi'?resistor(290,35,'R₂')+capacitor(370,35,'C'):resistor(290,35,'R₂');schematic=`<svg class="loop-schematic circuit-diagram" viewBox="0 0 760 230" role="img" aria-label="Inverting op amp with input impedance Z1 and feedback impedance Z2"><path d="M20 90H80 M160 90H360 M240 90V35H290 M${v.kind==='pi'?440:370} 35H580V115 M480 115H710 M360 150H320V185H300 M300 185h40 M307 192h26 M314 199h12"/>${z1}${v.kind==='pd'?'<path d="M80 90V130 M160 90V130"/>':''}${z2}<path d="M360 70L480 115L360 170Z"/><text x="375" y="96">−</text><text x="375" y="151">+</text><text x="35" y="75">Vᵢ</text><text x="665" y="100">Vₒ</text><text x="160" y="220">Ideal op amp · Gc(s) = −Z₂(s)/Z₁(s)</text></svg>`;}
  else if(v.kind==='lead')schematic=`<svg class="loop-schematic circuit-diagram" viewBox="0 0 760 230" role="img" aria-label="Passive lead: R1 parallel C in series, R2 to ground"><path d="M20 90H150 M150 50V130 M230 50V130 M230 90H690 M500 90V130 M20 200H690 M500 200V190"/>${resistor(150,50,'R₁')}${capacitor(150,130,'C')}<path d="M500 130l-7 5l14 10l-14 10l14 10l-7 5v20"/><text x="540" y="155">R₂</text><text x="30" y="75">Vᵢ</text><text x="650" y="75">Vₒ</text><text x="90" y="225">R₁ ∥ C → series input · R₂ → return</text></svg>`;
  else schematic=`<svg class="loop-schematic circuit-diagram" viewBox="0 0 760 230" role="img" aria-label="Passive lag: R1 series, R2 and C in series to ground"><path d="M20 60H200 M280 60H690 M460 60V90 M20 210H690 M460 190V210"/>${resistor(200,60,'R₁')}<path d="M460 90l-7 5l14 10l-14 10l14 10l-7 5v10 M448 150h24 M448 165h24 M460 165v25"/><text x="490" y="115">R₂</text><text x="490" y="165">C</text><text x="30" y="45">Vᵢ</text><text x="650" y="45">Vₒ</text><text x="90" y="235">R₁ → series input · R₂ + C → return</text></svg>`;
  const high=model.n.length===model.d.length?model.n[0]/model.d[0]:null;
  return {metrics:metric('Zero location','−'+fmt(model.zero)+' rad/s','Time constant '+fmt(1/model.zero)+' s')+metric('Pole location',model.pole===null?'No finite pole':'−'+fmt(model.pole)+' rad/s',active?'Ideal active network':'Unloaded passive network')+metric('High-frequency gain',high===null?'Unbounded':fmt(high),active?'Inverting sign included':'Voltage ratio'),insight:active?'The active circuit is inverting: its frequency phase includes the minus sign. A second inverting stage can restore the positive compensator sign used in the design labs. Ideal PD has unbounded high-frequency gain.':'These formulas assume an unloaded output and ideal components. Buffers are needed between cascaded passive sections to prevent loading from changing their pole/zero locations.',visuals:plotCard('Build the network.','R values in kΩ · C in µF · source and load are ideal.',schematic)+bodePlots(chart,[{data,color:C.teal,label:'Teal: physical circuit response'}],{min:.001,max:1e4}),extra:`<p class="hint">${esc(tfText(model.n,model.d))}</p>`};
 },guide:guideCards([['Passive lead','z=1/(R₁C); p=z+1/(R₂C)','Gc=(s+z)/(s+p). The capacitor is parallel to R₁ in the series input branch; R₂ returns the output to ground.'],['Passive lag','z=1/(R₂C); p=1/[(R₁+R₂)C]','Gc=[R₂/(R₁+R₂)](s+z)/(s+p). R₁ is in series; the output shunt branch is R₂ in series with C.'],['Active circuits','PI: −(R₂/R₁)(s+1/R₂C)/s','PD: −R₂C(s+1/R₁C). The active circuits use ideal op amps; saturation, finite bandwidth, and component tolerances are outside this lab.']])
};}
export function chapter9Config(id){if(['lead-design','lag-design','combined-design'].includes(id))return compensationConfig(id);if(id==='rate-feedback')return rateConfig();if(id==='compensator-circuits')return circuitConfig();return null;}
