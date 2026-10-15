import {topics,resolveTopic} from './topics.mjs';
export function initNavigation(onChange) {
  const $=id=>document.getElementById(id),links=[...document.querySelectorAll('[data-topic]')],sidebar=$('topic-sidebar'),toggle=$('menu-toggle'),media=window.matchMedia('(max-width: 780px)');
  let menuOpen=false,currentId=null;
  const syncMenu=()=>{sidebar.hidden=media.matches&&!menuOpen;toggle.setAttribute('aria-expanded',String(media.matches&&menuOpen));toggle.setAttribute('aria-label',menuOpen?'Close playground menu':'Open playground menu');};
  toggle.addEventListener('click',()=>{menuOpen=!menuOpen;syncMenu();});
  media.addEventListener('change',()=>{menuOpen=false;syncMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen){menuOpen=false;syncMenu();toggle.focus();}});
  let saved;try{saved=localStorage.getItem('flight-controls-topic');}catch{}
  function activate(focus=false){
    const topic=resolveTopic(window.location.hash,saved),index=topics.indexOf(topic),changed=topic.id!==currentId;
    currentId=topic.id;saved=topic.id;
    if(window.location.hash!==`#${topic.id}`)history.replaceState(null,'',`#${topic.id}`);
    document.body.dataset.playground=topic.id;document.body.dataset.workspace=topic.workspace;
    links.forEach(link=>{const active=link.dataset.topic===topic.id;if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    $('topic-breadcrumb').textContent=`${topic.group.toUpperCase()} / PLAYGROUND ${String(index+1).padStart(2,'0')}`;
    const heading=$('playground-heading');heading.replaceChildren(document.createTextNode(topic.lead+' '));const em=document.createElement('em');em.textContent=topic.accent;heading.append(em);
    $('topic-description').textContent=topic.description;$('topic-model').textContent=topic.model;document.title=`${topic.title} • Flight Controls`;
    $('chapter').hidden=topic.workspace!=='chapter';
    $('digital').hidden=topic.workspace!=='digital';
    $('design').hidden=topic.workspace!=='design';$('transfer').hidden=topic.workspace!=='transfer';
    $('design-section-label').textContent=topic.title.toUpperCase()+' LAB';$('transfer-section-label').textContent=topic.title.toUpperCase()+' LAB';
    $('transfer-heading').textContent=topic.id==='system-type'?'Find the integrators. Check the tracking.':'Explore your open loop.';
    $('transfer-description').textContent=topic.id==='system-type'?'System type comes from L(s), before closing the loop.':'Inspect gain crossover and phase margin.';
    $('origin-summary').hidden=topic.id!=='system-type';document.querySelector('[data-tf-chart="origin"]').hidden=topic.id!=='system-type';
    document.querySelector('.pole-details').open=topic.id==='system-type';
    document.querySelectorAll('[data-topics]').forEach(card=>{card.hidden=!card.dataset.topics.split(' ').includes(topic.id);});
    for(const [id,neighbor] of [['previous-topic',topics[index-1]],['next-topic',topics[index+1]]]){const a=$(id);a.hidden=!neighbor;if(neighbor){a.href='#'+neighbor.id;a.textContent=id==='previous-topic'?`← ${neighbor.title}`:`${neighbor.title} →`;}}
    try{localStorage.setItem('flight-controls-topic',topic.id);}catch{}
    menuOpen=false;syncMenu();if(changed)onChange(topic);
    if(focus){heading.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  }
  window.addEventListener('hashchange',()=>activate(true));
  links.forEach(link=>link.addEventListener('click',()=>{if(link.hash===window.location.hash){menuOpen=false;syncMenu();$('playground-heading').focus({preventScroll:true});}}));
  activate();
}
