export const PI = Math.PI;
export function overshoot(z) { return z >= 1 ? 0 : Math.exp(-PI*z/Math.sqrt(1-z*z)); }
export function damping(mp) { if (!(mp>0 && mp<1)) throw Error('Mp must be greater than 0 and less than 1.'); const l=-Math.log(mp); return l/Math.hypot(PI,l); }
export function phaseTarget(z) { const q=1/Math.sqrt(Math.sqrt(1+4*z**4)+2*z*z); return Math.atan2(2*z,q)*180/PI; }
export function design(z,ts,band=0.02) { const c=band===0.02?4:3,wn=c/(z*ts),sigma=z*wn; return {z,ts,band,wn,sigma,mp:overshoot(z),pm:phaseTarget(z),poles:z<1?[[-sigma,wn*Math.sqrt(1-z*z)],[-sigma,-wn*Math.sqrt(1-z*z)]]:[[-wn*(z-Math.sqrt(z*z-1)),0],[-wn*(z+Math.sqrt(z*z-1)),0]],c}; }
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],div=(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d]},abs=a=>Math.hypot(...a);
export function trim(a) { let i=0;while(i<a.length-1 && a[i]===0)i++;return a.slice(i); }
export function parseCoeffs(str) { const cleaned=str.trim().replace(/^\[/,'').replace(/\]$/,''); if(!cleaned || !/^[-+\deE.,\s]+$/.test(cleaned))throw Error('Use real coefficients separated by spaces or commas, such as 1, 3, 0.'); const a=trim(cleaned.split(/[\s,]+/).map(Number));if(a.some(x=>!Number.isFinite(x)||Math.abs(x)>1e12))throw Error('Each coefficient must be finite with magnitude ≤ 10¹².');if(a.every(x=>x===0))throw Error('The numerator and denominator must each be nonzero.');if(a.length>7)throw Error('Supported polynomial degree: 0 through 6.');return a; }
export function originCount(a){let n=0;for(let i=a.length-1;i>0 && a[i]===0;i--)n++;return n;}
export function reduceOrigin(n,d) { const nc=originCount(n),dc=originCount(d),cancel=Math.min(nc,dc);return {n:cancel?n.slice(0,-cancel):n,d:cancel?d.slice(0,-cancel):d,type:Math.max(0,dc-nc),cancel,raw:dc,net:dc-nc}; }
function evalComplex(a,z) { let v=[a[0],0];for(let i=1;i<a.length;i++)v=add(mul(v,z),[a[i],0]);return v; }
export function roots(input) {
 const a=trim(input),n=a.length-1;if(n===0)return [];
 if(n===1)return [[-a[1]/a[0],0]];
 if(n===2){const b=a[1]/a[0],c=a[2]/a[0],disc=b*b-4*c;if(disc<0)return [[-b/2,Math.sqrt(-disc)/2],[-b/2,-Math.sqrt(-disc)/2]];const q=-0.5*(b+(b>=0?1:-1)*Math.sqrt(disc));return q===0?[[0,0],[0,0]]:[[q,0],[c/q,0]];}
 const rate=Math.max(1e-12,...a.slice(1).map((v,i)=>Math.abs(v/a[0])**(1/(i+1)))),p=a.map((v,i)=>v/a[0]/rate**i),dp=p.slice(0,-1).map((v,i)=>v*(n-i));
 let r=Array.from({length:n},(_,i)=>{const t=2*PI*(i+0.37)/n;return [1.3*Math.cos(t),1.3*Math.sin(t)];});
 for(let it=0;it<1800;it++){let largest=0;const next=r.map((z,i)=>{const f=evalComplex(p,z),der=evalComplex(dp,z);if(abs(f)<1e-15)return z;const delta=div(f,der);let sum=[0,0];r.forEach((w,j)=>{if(j!==i)sum=add(sum,div([1,0],sub(z,w)))});const move=div(delta,sub([1,0],mul(delta,sum)));largest=Math.max(largest,abs(move));return sub(z,move);});r=next;if(largest<2e-12)break;}
 if(r.some(z=>!Number.isFinite(abs(z)) || abs(evalComplex(p,z))>1e-7*Math.max(1,abs(z)**n)))throw Error('Root calculation did not converge. Try a lower-order or better-scaled polynomial.');
 return r.map(z=>[z[0]*rate,Math.abs(z[1])<1e-7*Math.max(1,abs(z))?0:z[1]*rate]);
}
export function polynomialSum(a,b) { const n=Math.max(a.length,b.length);return trim(Array.from({length:n},(_,i)=>(a[i-(n-a.length)]||0)+(b[i-(n-b.length)]||0))); }
export function evaluate(n,d,w) { const a=evalComplex(n,[0,w]),b=evalComplex(d,[0,w]);return div(a,b); }
export function bode(n,d,wmin,wmax,count=1000) {
 const ratio=reduceOrigin(n,d),anchor=-90*ratio.net+(Math.sign(ratio.n.at(-1)/ratio.d.at(-1))<0?180:0);let last=anchor;
 return Array.from({length:count},(_,i)=>{const w=wmin*(wmax/wmin)**(i/(count-1)),v=evaluate(n,d,w);let ph=Math.atan2(v[1],v[0])*180/PI;while(ph-last>180)ph-=360;while(ph-last<=-180)ph+=360;last=ph;return {w,db:20*Math.log10(abs(v)),ph};});
}
export function margins(n,d,data) { const found=[];for(let i=1;i<data.length;i++){const a=data[i-1],b=data[i];if(!Number.isFinite(a.db+b.db)||a.db===b.db)continue;if((a.db>=0 && b.db<0)||(a.db<=0 && b.db>0)){let lo=Math.log(a.w),hi=Math.log(b.w),sign=a.db;for(let j=0;j<48;j++){const m=(lo+hi)/2,v=20*Math.log10(abs(evaluate(n,d,Math.exp(m))));if(v*sign>0)lo=m;else hi=m;}const w=Math.exp((lo+hi)/2),f=(Math.log(w)-Math.log(a.w))/(Math.log(b.w)-Math.log(a.w));let ph=Math.atan2(...evaluate(n,d,w).slice().reverse())*180/PI;const ref=a.ph+(b.ph-a.ph)*f;while(ph-ref>180)ph-=360;while(ph-ref<=-180)ph+=360;let pm=180+ph;while(pm>180)pm-=360;while(pm<-180)pm+=360;if(!found.some(v=>Math.abs(Math.log(v.w/w))<1e-7))found.push({w,pm,ph});}}
 return found;
}
function mm(a,b){const n=a.length;return a.map(row=>Array.from({length:n},(_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));}
function identity(n){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));}
function expm(a){const n=a.length,norm=Math.max(...a.map(row=>row.reduce((s,x)=>s+Math.abs(x),0))),s=Math.max(0,Math.ceil(Math.log2(norm/0.5))),b=a.map(row=>row.map(x=>x/2**s));let out=identity(n),term=identity(n);for(let k=1;k<80;k++){term=mm(term,b).map(row=>row.map(x=>x/k));out=out.map((row,i)=>row.map((x,j)=>x+term[i][j]));if(Math.max(...term.flat().map(Math.abs))<1e-16)break;}for(let i=0;i<s;i++)out=mm(out,out);return out;}
export function stepResponse(n,d,poles,horizon,count=2600) {
 const order=d.length-1;if(order===0){const v=n[0]/d[0];return [{t:0,y:v},{t:horizon,y:v}];}
 const rate=Math.max(1e-8,...poles.map(abs)),dn=d.map((v,i)=>v/d[0]/rate**i),padded=Array(d.length-n.length).fill(0).concat(n),bn=padded.map((v,i)=>v/d[0]/rate**i),direct=bn[0];
 const A=Array.from({length:order+1},()=>Array(order+1).fill(0));for(let i=0;i<order-1;i++)A[i][i+1]=1;for(let i=0;i<order;i++)A[order-1][i]=-dn[order-i];A[order-1][order]=1;
 const C=Array.from({length:order},(_,i)=>bn[order-i]-direct*dn[order-i]),dt=horizon/(count-1),E=expm(A.map(row=>row.map(x=>x*dt*rate)));let x=Array(order).fill(0).concat(1);const out=[];
 for(let k=0;k<count;k++){const y=direct+C.reduce((s,v,i)=>s+v*x[i],0);if(!Number.isFinite(y)||Math.abs(y)>1e8)break;out.push({t:k*dt,y});x=E.map(row=>row.reduce((s,v,i)=>s+v*x[i],0));}return out;
}
export function metrics(data,finalValue,band) { if(!Number.isFinite(finalValue)||Math.abs(finalValue)<1e-12)return {os:null,ts:null};const directed=data.map(p=>p.y/finalValue),peak=Math.max(...directed),os=Math.max(0,(peak-1)*100);let last=-1;directed.forEach((v,i)=>{if(Math.abs(v-1)>band)last=i;});const ts=last===data.length-1?null:(data[Math.min(last+1,data.length-1)]?.t??0);return {os,ts}; }
export function analyze(n,d,k=1,wmin=1e-4,wmax=1e4,band=0.02,targetTs=1) {
 if(n.length>d.length)throw Error('Enter a proper open-loop transfer function (numerator degree ≤ denominator degree).');if(!(k>0 && k<=1e8))throw Error('Gain K must be greater than 0 and at most 10⁸.');if(!(wmin>0&&wmax>wmin&&wmax/wmin<=1e12))throw Error('Frequency bounds must be positive, increasing, and span at most 12 decades.');
 const red=reduceOrigin(n,d),num=red.n.map(v=>v*k),den=red.d,closedDen=polynomialSum(den,num);if(closedDen.every(v=>v===0)||closedDen.length<num.length)throw Error('This feedback interconnection is singular or improper.');
 const poles=roots(den),zeros=roots(num),cp=roots(closedDen),tol=1e-7*Math.max(1,...cp.map(abs)),stable=cp.every(p=>p[0]<-tol),uncertain=!stable && !cp.some(p=>p[0]>tol),data=bode(num,den,wmin,wmax),pm=margins(num,den,data);
 const minDecay=stable?Math.min(...cp.map(p=>-p[0])):0,horizon=stable&&cp.length?Math.max(targetTs*3,12/minDecay):targetTs*5;
 const response=stepResponse(num,closedDen,cp,horizon),finalValue=stable?num.at(-1)/closedDen.at(-1):null,m=stable?metrics(response,finalValue,band):{os:null,ts:null};
 const low=red.n.at(-1)*k/red.d.at(-1),constant=j=>red.net===j?low:red.net>j?Infinity:0;
 return {...red,num,den,closedDen,poles,zeros,cp,stable,uncertain,data,pm,response,finalValue,metrics:m,horizon,constants:{kp:constant(0),kv:constant(1),ka:constant(2)}};
}
export function canonicalStep(z,wn,t){if(z<1){const q=Math.sqrt(1-z*z);return 1-Math.exp(-z*wn*t)*(Math.cos(wn*q*t)+z/q*Math.sin(wn*q*t));}if(Math.abs(z-1)<1e-8)return 1-Math.exp(-wn*t)*(1+wn*t);const q=Math.sqrt(z*z-1),a=-wn*(z-q),b=-wn*(z+q);return 1+(b*Math.exp(a*t)-a*Math.exp(b*t))/(a-b);}
