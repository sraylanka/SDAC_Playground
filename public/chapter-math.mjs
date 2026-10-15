import {roots,polynomialSum,evaluate,bode,margins,stepResponse,metrics,originCount,reduceOrigin} from './math.mjs';
export const multiply=(a,b)=>a.reduce((out,v,i)=>{b.forEach((w,j)=>out[i+j]+=v*w);return out;},Array(a.length+b.length-1).fill(0));
export const scale=(a,k)=>a.map(v=>v*k);
export const complex={
 add:(a,b)=>[a[0]+b[0],a[1]+b[1]],
 multiply:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],
 divide:(a,b)=>{const q=b[0]**2+b[1]**2;return [(a[0]*b[0]+a[1]*b[1])/q,(a[1]*b[0]-a[0]*b[1])/q];}
};
export function atPolynomial(a,s){return a.reduce((v,c)=>complex.add(complex.multiply(v,s),[c,0]),[0,0]);}
export const at=(n,d,s)=>complex.divide(atPolynomial(n,s),atPolynomial(d,s));
export const phase=v=>Math.atan2(v[1],v[0])*180/Math.PI;
export function closedLoop(n,d,gain=1,horizon=12,count=1000){
 const red=reduceOrigin(n,d),num=scale(red.n,gain),den=red.d,cd=polynomialSum(den,num);
 if(cd.every(v=>v===0)||cd.length<num.length)throw Error('Singular or improper closed loop.');
 const poles=roots(cd),tol=1e-7*Math.max(1,...poles.map(p=>Math.hypot(...p))),stable=poles.every(p=>p[0]<-tol),boundary=!stable&&!poles.some(p=>p[0]>tol);
 const response=stepResponse(num,cd,poles,horizon,count),finalValue=stable?num.at(-1)/cd.at(-1):null;
 return {num,den,cd,poles,stable,boundary,response,finalValue,metrics:stable?metrics(response,finalValue,.02):{os:null,ts:null}};
}
export function trackingConstants(n,d,gain=1){
 const red=reduceOrigin(n,d),low=gain*red.n[red.n.length-1-originCount(red.n)]/red.d[red.d.length-1-originCount(red.d)];
 const values=[0,1,2].map(j=>red.net===j?low:red.net>j?Infinity:0);
 return {type:red.type,kp:values[0],kv:values[1],ka:values[2],errors:[1/(1+values[0]),1/values[1],1/values[2]],low,net:red.net};
}
export function controller(kind,{zero=2,pole=12,lagZero=.2,lagPole=.02}={}){
 if(kind==='pd')return {n:[1,zero],d:[1]};
 if(kind==='lead')return {n:[1,zero],d:[1,pole]};
 if(kind==='pi')return {n:[1,lagZero],d:[1,0]};
 if(kind==='lag')return {n:[1,lagZero],d:[1,lagPole]};
 if(kind==='pid')return {n:multiply([1,zero],[1,lagZero]),d:[1,0]};
 if(kind==='lag-lead')return {n:multiply([1,zero],[1,lagZero]),d:multiply([1,pole],[1,lagPole])};
 throw Error('Unknown controller.');
}
export function designPoint(os,ts){
 if(!(os>0&&os<100&&ts>0))throw Error('Use overshoot between 0 and 100% and a positive settling time.');
 const l=-Math.log(os/100),zeta=l/Math.hypot(Math.PI,l),sigma=4/ts;
 return {s:[-sigma,sigma*Math.sqrt(1-zeta*zeta)/zeta],zeta};
}
export function targetGeometry(n,d,s){
 const value=at(n,d,s),angle=phase(value),deficit=((180-angle)%360+540)%360-180;
 return {angle,deficit,gain:1/Math.hypot(...value),onLocus:Math.abs(deficit)<1,zeros:roots(n),poles:roots(d)};
}
function ordered(previous,current){
 let best=null,cost=Infinity;
 function choose(path,left,sum){if(!left.length){if(sum<cost){cost=sum;best=path;}return;}if(sum>cost)return;left.forEach((p,i)=>choose([...path,p],left.filter((_,j)=>j!==i),sum+Math.hypot(previous[path.length][0]-p[0],previous[path.length][1]-p[1])));}
 choose([],current,0);return best;
}
export function rootLocus(n,d,maxGain=200,count=90){
 const branches=Array.from({length:d.length-1},()=>[]);let previous=roots(d),skipped=0;
 for(let i=0;i<count;i++){
  const k=i===0?0:10**(-4+(Math.log10(maxGain)+4)*(i-1)/(count-2));
  try{const r=roots(polynomialSum(d,scale(n,k)));if(r.length!==previous.length){skipped++;continue;}previous=ordered(previous,r);previous.forEach((p,j)=>branches[j].push(p));}catch{skipped++;}
 }
 return {branches,skipped};
}
export function frequencyData(n,d,min=.01,max=1000,count=800,delay=0){
 return bode(n,d,min,max,count).map(p=>{const v=evaluate(n,d,p.w),a=-p.w*delay,rotation=[Math.cos(a),Math.sin(a)],loop=complex.multiply(v,rotation),closed=complex.divide(loop,[1+loop[0],loop[1]]);return {...p,ph:p.ph-p.w*delay*180/Math.PI,loop,closed,closedDb:20*Math.log10(Math.hypot(...closed))};});
}
export function allMargins(n,d,data,delay=0){
 // Magnitude crossings are unchanged by a pure delay. Retain unwrapped phase for delay margin.
 const pm=margins(n,d,data).map(p=>{
  const i=Math.max(1,data.findIndex(v=>v.w>=p.w)),a=data[i-1],b=data[i],f=Math.log(p.w/a.w)/Math.log(b.w/a.w),ph=a.ph+(b.ph-a.ph)*f;
  return {...p,ph,pm:delay?180+ph:p.pm};
 });
 const gm=[];
 for(let i=1;i<data.length;i++){
  const a=data[i-1],b=data[i];
  if(!Number.isFinite(a.ph+b.ph)||Math.abs(b.ph-a.ph)<1e-12)continue;
  const low=Math.min(a.ph,b.ph),high=Math.max(a.ph,b.ph);
  for(let m=Math.ceil((low+180)/360);m<=Math.floor((high+180)/360);m++){
   const target=-180+360*m;if(target===a.ph&&i>1)continue;
   let lo=Math.log(a.w),hi=Math.log(b.w);
   for(let j=0;j<35;j++){
    const mid=(lo+hi)/2,w=Math.exp(mid),v=evaluate(n,d,w);let ph=phase(v)-w*delay*180/Math.PI;
    const reference=a.ph+(b.ph-a.ph)*(mid-Math.log(a.w))/Math.log(b.w/a.w);ph+=360*Math.round((reference-ph)/360);
    if((ph-target)*(a.ph-target)>0)lo=mid;else hi=mid;
   }
   const w=Math.exp((lo+hi)/2),db=-20*Math.log10(Math.hypot(...evaluate(n,d,w)));
   if(!gm.some(v=>Math.abs(Math.log(v.w/w))<1e-6))gm.push({w,db,factor:10**(db/20)});
  }
 }
 return {pm,gm};
}
export function nyquistContour(n,d,gain=1){
 const poles=roots(d),maxPole=Math.max(1,...poles.map(p=>Math.hypot(...p))),R=maxPole*1e4,eps=maxPole*1e-5;
 const axis=poles.filter(p=>Math.abs(p[0])<1e-7*maxPole),origin=axis.length>0;
 if(axis.some(p=>Math.abs(p[1])>1e-7*maxPole))return {resolved:false,reason:'Non-origin imaginary-axis poles need a separate indented contour.'};
 const frequencies=Array.from({length:1500},(_,i)=>eps*(R/eps)**(i/1499)),s=[];
 for(const w of frequencies.slice().reverse())s.push([0,-w]);
 if(origin)for(let i=0;i<=160;i++){const a=-Math.PI/2+i*Math.PI/160;s.push([eps*Math.cos(a),eps*Math.sin(a)]);}
 else s.push([0,0]);
 for(const w of frequencies)s.push([0,w]);
 for(let i=0;i<=500;i++){const a=Math.PI/2-i*Math.PI/500;s.push([R*Math.cos(a),R*Math.sin(a)]);}
 const mapped=s.map(z=>at(scale(n,gain),d,z)),shifted=mapped.map(v=>[1+v[0],v[1]]);let winding=0,maxJump=0;
 for(let i=1;i<=shifted.length;i++){const a=shifted[i-1],b=shifted[i%shifted.length],delta=Math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]);winding+=delta;maxJump=Math.max(maxJump,Math.abs(delta));}
 const clockwise=Math.round(-winding/(2*Math.PI)),P=poles.filter(p=>p[0]>1e-7*maxPole).length,cp=roots(polynomialSum(d,scale(n,gain))),Z=cp.filter(p=>p[0]>1e-7*Math.max(1,...cp.map(p=>Math.hypot(...p)))).length;
 const boundary=cp.some(p=>Math.abs(p[0])<1e-7*Math.max(1,...cp.map(p=>Math.hypot(...p))));
 const resolved=!boundary&&maxJump<.5&&shifted.every(v=>Number.isFinite(Math.hypot(...v))&&Math.hypot(...v)>1e-5)&&P+clockwise===Z;
 return {resolved,clockwise,P,Z,predicted:P+clockwise,mapped,origin,boundary,reason:resolved?'Complete clockwise right-half-plane contour; origin poles are bypassed to the right.':'Contour is near the critical point or insufficiently resolved; use the closed-loop pole check.'};
}
export function factorModel({gain=1,poles=[1,10],zeros=[],integrators=0,second=false,wn=5,zeta=.4}){
 if(!(gain>0)||integrators<0||integrators>2||!Number.isInteger(integrators)||poles.length+integrators+(second?2:0)>6||zeros.length>4||[...poles,...zeros,wn,zeta].some(v=>!Number.isFinite(v)||v<=0))throw Error('Use positive corner frequencies and gain; at most six denominator poles.');
 let n=[gain],d=[1];for(const z of zeros)n=multiply(n,[1/z,1]);for(const p of poles)d=multiply(d,[1/p,1]);for(let i=0;i<integrators;i++)d=multiply(d,[1,0]);if(second)d=multiply(d,[1/(wn*wn),2*zeta/wn,1]);
 if(n.length>d.length)throw Error('Keep the overall transfer function proper: add enough poles for these zeros.');
 return {n,d};
}
export function asymptote(w,{gain,poles,zeros,integrators,second,wn,zeta}){
 let db=20*Math.log10(gain)-20*integrators*Math.log10(w),ph=-90*integrators;
 const term=(corner,sign,order=1)=>{db+=sign*20*order*Math.max(0,Math.log10(w/corner));ph+=sign*45*order*Math.max(0,Math.min(2,Math.log10(w/corner)+1));};
 zeros.forEach(z=>term(z,1));poles.forEach(p=>term(p,-1));if(second)term(wn,-1,2);
 return {db,ph};
}
export function canonicalFrequency(zeta,wn){
 const n=[wn*wn],d=[1,2*zeta*wn,wn*wn],data=frequencyData(n,d,wn/100,wn*100,900);
 // Here n/d is the closed-loop transfer function itself.
 const peak=zeta<Math.SQRT1_2?1/(2*zeta*Math.sqrt(1-zeta*zeta)):1,peakW=zeta<Math.SQRT1_2?wn*Math.sqrt(1-2*zeta*zeta):0;
 const bandwidth=wn*Math.sqrt(1-2*zeta*zeta+Math.sqrt(4*zeta**4-4*zeta*zeta+2));
 return {n,d,data,peak,peakW,bandwidth};
}
export function rateFeedback(a,gain,feedback){
 // Plant 1/[s(s+a)], inner rate feedback Hf=kf*s; outer position unity feedback.
 return {n:[gain],d:[1,a+feedback,gain],innerPole:-(a+feedback)};
}
export function circuit(kind,r1K,r2K,cMicro){
 const r1=r1K*1000,r2=r2K*1000,c=cMicro*1e-6;
 if([r1,r2,c].some(v=>!Number.isFinite(v)||v<=0))throw Error('Resistors and capacitance must be positive.');
 if(kind==='pi')return {n:[-r2/r1,-1/(r1*c)],d:[1,0],zero:1/(r2*c),pole:0,sign:-1};
 if(kind==='pd')return {n:[-r2*c,-r2/r1],d:[1],zero:1/(r1*c),pole:null,sign:-1};
 if(kind==='lead'){const z=1/(r1*c),p=z+1/(r2*c);return {n:[1,z],d:[1,p],zero:z,pole:p,sign:1};}
 if(kind==='lag'){const z=1/(r2*c),p=1/((r1+r2)*c);return {n:scale([1,z],r2/(r1+r2)),d:[1,p],zero:z,pole:p,sign:1};}
 throw Error('Unknown circuit.');
}
export function identificationModel(kind){
 if(kind==='first')return {n:[3],d:[.5,1],description:'First-order low-pass'};
 if(kind==='second')return {n:[50],d:[1,3,25],description:'Underdamped second-order low-pass'};
 return {n:[2,4],d:[1,6,5],description:'Two poles and one zero'};
}
export function identificationMeasurement(n,d,w,index,noise=0){
 const v=evaluate(n,d,w),amplitude=Math.hypot(...v)*10**(noise*Math.sin(index*2.7+w)*.04),ph=phase(v)+noise*2*Math.cos(index*1.9+w);
 return {w,amplitude,db:20*Math.log10(amplitude),ph};
}
