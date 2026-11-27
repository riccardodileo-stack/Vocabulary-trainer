/* Renderer usato sia nell'anteprima sia nell'app. Le misure del contenitore
 * sono gestite dal viewBox e gli aggiornamenti si fermano fuori schermata.
 */
import { poseAt, svgFrame, GREET_AT, INTRO_END } from './modello';

let nextId = 0;
const defaults = {yaw:0,tilt:0,tail:.52,expression:'smile',gaze:[0,0],feet:null};
const expressions = ['smile','curious','sleepy','focused','surprised','joy'];
const initialMood = () => Object.fromEntries(expressions.map(n => [n,Number(n==='smile')]));
export function createGorichecoEngine() {
 return { mount(host,{onEvent=()=>{}}={}) {
   let state={mode:'hold',active:false,reducedMotion:false};
   let target={...defaults}, current={...defaults}, moods=initialMood();
   let elapsed=0, introTime=0, wavedAt=null, blinkedAt=null, greeted=false, ended=false;
   let disposed=false, frame=null, previous=null;
   const prefix='goricheco-'+(++nextId);
   host.innerHTML=svgFrame(poseAt(0),prefix);
   const nodes=Object.fromEntries(Array.from(host.querySelectorAll('[data-joint]'),n=>[n.getAttribute('data-joint'),n]));
   let cached={};
   const running=()=>!disposed && state.active && !state.reducedMotion && state.mode!=='hold' && !host.ownerDocument.hidden;
   function draw() {
     const intro=state.mode==='intro';
     const wave=intro?introTime:(wavedAt===null?null:elapsed-wavedAt);
     const blink=blinkedAt===null?null:elapsed-blinkedAt;
     const attrs=poseAt(elapsed,{section:current,expressionMix:moods,reducedMotion:state.reducedMotion,waveTime:wave,blinkTime:blink});
     for(const [id,values] of Object.entries(attrs)){
       const prev=cached[id];
       for(const [name,value] of Object.entries(values)){
         if(prev?.[name]!==value) nodes[id].setAttribute(name,String(value));
       }
     }
     cached=attrs;
   }
   function updatePose(dt,instant=false) {
     const k=instant?1:1-Math.exp(-8*dt);
     const lerp=(a,b)=>a+(b-a)*k;
     for(const key of ['yaw','tilt','tail'])current[key]=lerp(current[key],target[key]);
     current.gaze=current.gaze.map((v,i)=>lerp(v,target.gaze[i]));
     current.feet=target.feet;
     for(const key of expressions)moods[key]=lerp(moods[key],Number(key===target.expression));
   }
   function cancel(){
     if(frame!==null) cancelAnimationFrame(frame);
     frame=null; previous=null;
   }
   function schedule(){if(frame===null && running())frame=requestAnimationFrame(tick);}
   function tick(now){
     frame=null;
     if(!running()){previous=null;return;}
     const dt=previous===null?0:Math.min(.08,Math.max(0,(now-previous)/1000));
     previous=now; elapsed+=dt;
     if(state.mode==='intro')introTime+=dt;
     updatePose(dt);draw();
     if(state.mode==='intro'){
       if(!greeted && introTime>=GREET_AT){greeted=true;onEvent('greet');}
       if(!ended && introTime>=INTRO_END){ended=true;onEvent('idle');}
     }
     schedule();
   }
   function visibility(){if(running())schedule();else cancel();}
   host.ownerDocument.addEventListener('visibilitychange',visibility);
   const api={
     configure(patch){
       if(disposed)return;
       const last=state.mode;
       state={...state,...patch};
       if(last!==state.mode){introTime=0;greeted=false;ended=false;wavedAt=null;blinkedAt=null;}
       if(state.reducedMotion)updatePose(0,true);
       draw();visibility();
     },
     section(pose={}){
       target={...defaults,...pose};
       if(!running())updatePose(0,true);
       draw();
     },
     perform(action){
       if(disposed || state.reducedMotion)return;
       if(action==='wave')wavedAt=elapsed;
       if(action==='blink')blinkedAt=elapsed;
       draw();schedule();
     },
     dispose(){
       disposed=true; cancel();host.ownerDocument.removeEventListener('visibilitychange',visibility);
       host.replaceChildren();
     }
   };
   onEvent('ready');
   return api;
 }};
}

