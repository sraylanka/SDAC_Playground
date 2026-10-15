import {mountLab} from './lab-ui.mjs';
import {chapter9Config} from './chapter9.mjs';
import {chapter10Config} from './chapter10.mjs';
export function initChapters(chart){
 let dispose=null;
 return topic=>{dispose?.();dispose=null;if(topic.workspace!=='chapter')return;const config=chapter9Config(topic.id)||chapter10Config(topic.id);if(!config)throw Error('Unknown chapter playground.');dispose=mountLab(document.getElementById('chapter'),topic,config,chart);};
}
