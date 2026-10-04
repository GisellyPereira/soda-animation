const root=document.documentElement,hero=document.querySelector('.hero'),runway=document.querySelector('.scroll-experience');
const scenes=[...document.querySelectorAll('.flavor-scene')],copies=[...document.querySelectorAll('.copy')],descriptions=[...document.querySelectorAll('.description')],progressBar=document.querySelector('.progress');
const flavors=[{name:'Morango',color:[237,37,90],hue:0,brightness:1,saturation:1},{name:'Mirtilo',color:[65,70,183],hue:-105,brightness:1,saturation:1},{name:'Melancia',color:[170,37,77],hue:0,brightness:.78,saturation:.9}];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let target=0,current=0,frame=0,lastTime=0,announced=-1,px=0,py=0,tx=0,ty=0;
let settled=0,motion=null,wheelTime=-Infinity,wheelDirection=0,wheelAmount=0,wheelConsumed=false,touchStart=null;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
function startNextStep(time=performance.now(),pause=0){
 if(motion||settled===target)return;
 motion={from:settled,to:settled+Math.sign(target-settled),start:time+pause,duration:1350};
}
function goTo(index){
 if(motion)return;
 const next=clamp(index,0,2);if(next===target)return;
 target=next;
 if(reduced.matches){current=settled=target;motion=null;}
 else startNextStep();
 requestFrame();
}
function advance(direction){goTo(target+direction);}
function requestFrame(){if(!frame)frame=requestAnimationFrame(render);}
function render(time){
 const dt=lastTime?Math.min(50,time-lastTime):16;lastTime=time;const follow=1-Math.exp(-dt/85);
 if(reduced.matches){current=settled=target;motion=null;}
 else if(motion){
  const elapsed=clamp((time-motion.start)/motion.duration);
  const eased=(1-Math.cos(Math.PI*elapsed))/2;
  current=mix(motion.from,motion.to,eased);
  if(elapsed===1){current=settled=motion.to;motion=null;startNextStep(time,120);}
 }
 px=mix(px,tx,follow);py=mix(py,ty,follow);
 const segment=Math.min(1,Math.floor(current)),local=current-segment;
 const blend=reduced.matches?(local>.5?1:0):local;
 const a=flavors[segment],b=flavors[segment+1],active=blend<.5?segment:segment+1;
 root.style.setProperty('--bg',`rgb(${a.color.map((v,i)=>Math.round(mix(v,b.color[i],blend))).join(',')})`);
 root.style.setProperty('--hue',mix(a.hue,b.hue,blend).toFixed(3));root.style.setProperty('--brightness',mix(a.brightness,b.brightness,blend).toFixed(4));root.style.setProperty('--saturation',mix(a.saturation,b.saturation,blend).toFixed(4));
 root.style.setProperty('--travel',clamp(current/2).toFixed(4));root.style.setProperty('--turn',`${reduced.matches?0:-Math.sin(blend*Math.PI*2)*7}deg`);root.style.setProperty('--lift',`${reduced.matches?0:-Math.sin(blend*Math.PI)*28}px`);root.style.setProperty('--scale',reduced.matches?1:1+Math.sin(blend*Math.PI)*.035);root.style.setProperty('--pointer-x',px+'px');root.style.setProperty('--pointer-y',py+'px');
 scenes.forEach((scene,i)=>{const offset=i-segment-blend;scene.style.setProperty('--offset',offset.toFixed(5));scene.style.visibility=Math.abs(offset)<1.05?'visible':'hidden';scene.style.opacity=reduced.matches?(i===active?'1':'0'):String(clamp(1-Math.max(0,Math.abs(offset)-.65)/.35));});
 copies.forEach((copy,i)=>{const visible=i===active;copy.style.setProperty('--copy-offset',0);copy.style.setProperty('--copy-opacity',visible?1:0);descriptions[i].style.setProperty('--copy-offset',0);descriptions[i].style.setProperty('--copy-opacity',visible?1:0);copy.setAttribute('aria-hidden',String(!visible));descriptions[i].setAttribute('aria-hidden',String(!visible));});
 progressBar.setAttribute('aria-valuenow',String(Math.round(current*50)));
 document.querySelector('#scroll-label').textContent=current>1.94?'Role para voltar aos sabores':'Role para trocar o sabor';
 if(active!==announced){announced=active;document.querySelector('#status').textContent='Sabor '+flavors[active].name;document.querySelector('meta[name="theme-color"]').content='#'+flavors[active].color.map(v=>v.toString(16).padStart(2,'0')).join('');}
 frame=0;if(motion||Math.abs(px-tx)>.02||Math.abs(py-ty)>.02)requestFrame();else lastTime=0;
}
// One gesture completes one adjacent transition. Input during that transition
// is consumed, never queued; the next flavor needs a fresh gesture at rest.
addEventListener('wheel',e=>{
 if(e.ctrlKey||Math.abs(e.deltaY)<Math.abs(e.deltaX)||!e.deltaY)return;
 e.preventDefault();const now=performance.now(),direction=Math.sign(e.deltaY);
 if(motion){wheelTime=now;wheelDirection=direction;wheelConsumed=true;wheelAmount=0;return;}
 if(now-wheelTime>170||direction!==wheelDirection){wheelAmount=0;wheelConsumed=false;}
 wheelTime=now;wheelDirection=direction;
 wheelAmount+=Math.abs(e.deltaY)*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 if(!wheelConsumed&&wheelAmount>=8){wheelConsumed=true;wheelAmount=0;advance(direction);}
},{passive:false});
hero.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
hero.addEventListener('touchend',e=>{if(!touchStart)return;const touch=e.changedTouches[0],dy=touchStart.y-touch.clientY,dx=touchStart.x-touch.clientX;if(Math.abs(dy)>28&&Math.abs(dy)>Math.abs(dx))advance(Math.sign(dy));touchStart=null;},{passive:true});
hero.addEventListener('touchcancel',()=>touchStart=null,{passive:true});
addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 if(['ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();advance(e.shiftKey?-1:1);}
 else if(['ArrowUp','PageUp'].includes(e.key)){e.preventDefault();advance(-1);}
 else if(e.key==='Home'){e.preventDefault();goTo(0);}
 else if(e.key==='End'){e.preventDefault();goTo(2);}
});
addEventListener('resize',requestFrame);reduced.addEventListener('change',()=>{tx=ty=0;requestFrame();});
hero.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;tx=(e.clientX/innerWidth-.5)*16;ty=(e.clientY/innerHeight-.5)*12;requestFrame();});hero.addEventListener('pointerleave',()=>{tx=ty=0;requestFrame();});
requestFrame();
