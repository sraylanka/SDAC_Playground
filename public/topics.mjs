// Edit this catalog to map topics to textbook chapters/sections or add a playground.
export const topics = [
  {id:'overshoot-damping',group:'Time response',title:'Overshoot & Damping',lead:'Overshoot &',accent:'Damping',description:'Connect fractional overshoot, percent overshoot, and damping. Change ζ to see how much the response rings.',model:'Canonical second-order closed-loop response',workspace:'design',chart:'step'},
  {id:'settling-poles',group:'Time response',title:'Settling Time & Poles',lead:'Settling Time &',accent:'Poles',description:'Explore how the settling-time target moves the poles. Compare the textbook approximation with the calculated response.',model:'Canonical second-order closed-loop response · approximate settling constraint',workspace:'design',chart:'poles'},
  {id:'frequency-response',group:'Frequency response',title:'Frequency Response',lead:'Frequency',accent:'Response',description:'Bring your open-loop transfer function. Explore Bode plots, gain crossover, and phase margin as loop gain changes.',model:'Open-loop L(s) · continuous time · unity negative feedback',workspace:'transfer',chart:'bode'},
  {id:'system-type',group:'Steady-state error',title:'System Type',lead:'System',accent:'Type',description:'Count integrators in the open loop, inspect origin cancellations, and connect system type to steady-state tracking error.',model:'System type from open-loop L(s) · tracking requires closed-loop stability',workspace:'transfer',chart:'origin'}
];
export function resolveTopic(hash='',fallback='overshoot-damping') {
  const id=String(hash).replace(/^#/,'');
  const aliases={design:'overshoot-damping',transfer:'frequency-response'};
  return topics.find(t=>t.id===(aliases[id]||id))||topics.find(t=>t.id===fallback)||topics[0];
}
