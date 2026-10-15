// Unsigned converter: 2^bits codes, spacing M/2^bits, nearest-level rounding.
export function convertSample(input,bits,span) {
 if(!Number.isFinite(input)||!Number.isInteger(bits)||bits<1||bits>16||!Number.isFinite(span)||span<=0)throw Error('Invalid converter parameters.');
 const levels=2**bits,delta=span/levels,raw=Math.floor(input/delta+0.5),code=Math.max(0,Math.min(levels-1,raw)),voltage=code*delta;
 return {code,voltage,error:voltage-input,delta,binary:code.toString(2).padStart(bits,'0'),overload:input<0||input>span-delta};
}
export function sampleSignal({period,frequency,amplitude,offset,phase,bits,span},duration=2) {
 if(![period,frequency,amplitude,offset,phase,bits,span,duration].every(Number.isFinite)||period<.01||period>1||frequency<.1||frequency>10||amplitude<0||amplitude>10||offset< -5||offset>10||phase< -180||phase>180||![2,3,4,8,12].includes(bits)||span<1||span>10||duration<=0||duration>10)throw Error('Use T 0.01–1 s, frequency 0.1–10 Hz, amplitude 0–10 V, offset −5–10 V, phase ±180°, and span 1–10 V.');
 const angle=phase*Math.PI/180,signal=t=>offset+amplitude*Math.sin(2*Math.PI*frequency*t+angle),fs=1/period,signedAlias=frequency-Math.floor(frequency/fs+.5)*fs;
 const samples=Array.from({length:Math.floor(duration/period+1e-9)+1},(_,k)=>{const t=k*period,input=signal(t);return {k,t,input,...convertSample(input,bits,span)};});
 return {samples,signal,fs,nyquist:fs/2,alias:Math.abs(signedAlias),aliasSignal:t=>offset+amplitude*Math.sin(2*Math.PI*signedAlias*t+angle),delta:span/2**bits};
}
export function holdSeries(samples,duration,key='voltage') {
 return samples.flatMap((s,i)=>[[s.t,s[key]],[Math.min(samples[i+1]?.t??duration,duration),s[key]]]);
}
