import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createPresentationWorld} from './universe/createPresentationWorld';
import {positionsFor,chapterPose,NODE_COUNT,seed} from './universe/presets';

const INTRO=5.4;
export function PerformanceUniverse({index,step=0,reduced,introSkip=0,restartToken=0,onPhase,onTravel}){
  const host=useRef(null),runtime=useRef(null),callback=useRef(onPhase),travelCallback=useRef(onTravel);
  const [fallback,setFallback]=useState(false);callback.current=onPhase;travelCallback.current=onTravel;
  useEffect(()=>{
    let renderer,engine,composer,bloom,output,observer,frame=0,disposed=false;
    const el=host.current;
    function refresh(){if(disposed)return;cancelAnimationFrame(frame);if(runtime.current)runtime.current.last=0;frame=requestAnimationFrame(draw);}
    function cleanup(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('blur',pointerReset);window.removeEventListener('pointerout',pointerOut);renderer?.domElement.removeEventListener('webglcontextlost',lost);bloom?.dispose();output?.dispose();composer?.dispose();engine?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();runtime.current=null;}
    function fail(){travelCallback.current?.(false);el.closest(".presentation")?.style.removeProperty("--arrival-opacity");cleanup();setFallback(true);callback.current?.(4);}
    function lost(e){e.preventDefault();fail();}
    function pointerMove(e){const r=runtime.current;if(!r||r.reduced||e.pointerType==='touch')return;r.pointerTarget.x=(e.clientX/innerWidth-.5)*2;r.pointerTarget.y=-(e.clientY/innerHeight-.5)*2;}
    function pointerReset(){if(runtime.current)runtime.current.pointerTarget.set(0,0);}
    function pointerOut(e){if(!e.relatedTarget)pointerReset();}
    function resize(){const r=runtime.current;if(!r)return;const {width,height}=el.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);composer?.setSize(width,height);r.camera.aspect=width/height;r.camera.updateProjectionMatrix();refresh();}
    function draw(now){
      const r=runtime.current;if(!r||r.lost||document.hidden)return;
      const interval=r.index===9?100:r.quality==='low'?50:33;
      if(now-r.last<interval){frame=requestAnimationFrame(draw);return;}
      const dt=r.last?Math.min((now-r.last)/1000,.08):.016;r.last=now;
      if(!r.reduced)r.time+=dt;
      if(r.reduced||r.skipped||r.index!==0)r.introElapsed=INTRO;
      else r.introElapsed=Math.min(INTRO,r.introElapsed+(r.introLast?(now-r.introLast)/1000:0));
      r.introLast=now;
      const intro=r.introElapsed,phase=intro>=INTRO?4:intro<1.5?0:intro<3?1:intro<4.5?2:3;
      if(r.phase!==phase){r.phase=phase;callback.current?.(phase);}
      r.pointer.lerp(r.pointerTarget,r.reduced?1:.07);
      try{
        engine.update({time:r.time,now,intro,reduced:r.reduced,pointer:r.reduced?{x:0,y:0}:r.pointer});
        renderer.info.reset();const started=performance.now();if(composer&&r.usePost)composer.render(dt);else renderer.render(engine.scene,r.camera);
        const cost=performance.now()-started;
        el.dataset.renderMs=cost.toFixed(2);
        if(r.frames===0&&r.index===0&&!r.skipped&&!r.reduced)r.introLast=performance.now();
        if(r.frames>0){r.cost+=cost;r.samples++;}
        if(r.samples===5&&r.cost/r.samples>28&&r.quality!=='low'){r.quality='low';r.usePost=false;renderer.setPixelRatio(.85);}
        const data=engine.diagnostics();
        if(r.travelling && data.chapter===r.index && data.progress===1){r.travelling=false;travelCallback.current?.(false);}
        el.closest(".presentation")?.style.setProperty("--arrival-opacity",String(data.arrival??1));
        Object.assign(el.dataset,{athletes:String(data.athletes??0),phase:String(phase),frames:String(++r.frames),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),drawCalls:String(renderer.info.render.calls),quality:r.quality,motion:r.reduced?'still':'ambient',chapter:String(data.chapter),step:String(data.step),progress:data.progress.toFixed(3),pose:data.pose,camera:data.camera,nodeCount:String(data.nodeCount),geometryBudget:String(data.geometryBudget),textureBudget:String(data.textureBudget)});
        el.style.setProperty('--world-progress',data.progress.toFixed(3));
      }catch(error){console.warn('WebKore: alternativa estática ativada.',error.message);fail();return;}
      if(!r.reduced)frame=requestAnimationFrame(draw);
    }
    try{
      if(new URLSearchParams(location.search).has('noWebGL'))throw Error('Static mode');
      const canvas=document.createElement('canvas'),context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!context)throw Error('WebGL unavailable');
      renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true});renderer.info.autoReset=false;renderer.setClearColor(0x0d0f18,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
      const low=navigator.hardwareConcurrency<=4||new URLSearchParams(location.search).get('quality')==='low';renderer.setPixelRatio(low?Math.min(devicePixelRatio,1):Math.min(devicePixelRatio,1.25));el.appendChild(canvas);
      const camera=new T.PerspectiveCamera(56,1,.1,180);engine=createPresentationWorld(renderer,camera,refresh);engine.setChapter(index,step,{immediate:reduced});
      runtime.current={index,step,reduced,restartToken,skipped:false,introElapsed:0,introLast:0,phase:-1,time:0,last:0,frames:0,samples:0,cost:0,camera,quality:low?'low':'balanced',usePost:!low,pointer:new T.Vector2(),pointerTarget:new T.Vector2(),refresh,engine};
      if(!low){composer=new EffectComposer(renderer);composer.setPixelRatio(.75);composer.addPass(new RenderPass(engine.scene,camera));bloom=new UnrealBloomPass(new T.Vector2(640,360),.24,.4,1.1);composer.addPass(bloom);output=new OutputPass();composer.addPass(output);}
      observer=new ResizeObserver(resize);observer.observe(el);resize();document.addEventListener('visibilitychange',refresh);canvas.addEventListener('webglcontextlost',lost);window.addEventListener('pointermove',pointerMove,{passive:true});window.addEventListener('pointerout',pointerOut,{passive:true});window.addEventListener('blur',pointerReset);refresh();
    }catch(error){if(error.message!=="Static mode")console.warn("WebKore: WebGL",error);cleanup();setFallback(true);callback.current?.(4);}
    return cleanup;
  },[]);
  useLayoutEffect(()=>{
    const r=runtime.current;if(!r)return;const changed=r.index!==index||r.step!==step,reset=r.restartToken!==restartToken;
    if(r.index!==index||reduced){
      r.travelling=!reduced && r.index!==index;
      const galleryFlight=Math.abs(r.index-index)===1 && Math.min(r.index,index)>=2 && Math.max(r.index,index)<=4;
      travelCallback.current?.(r.travelling,r.travelling && galleryFlight);
    }
    if(index===0&&(r.index!==0||reset)){r.introElapsed=0;r.introLast=0;r.skipped=r.index===1;r.phase=-1;}
    if(changed||reset||reduced!==r.reduced&&reduced)r.engine.setChapter(index,step,{immediate:reduced,replay:reset});
    Object.assign(r,{index,step,reduced,restartToken});r.refresh();
  },[index,step,reduced,restartToken]);
  useEffect(()=>{const r=runtime.current;if(r&&introSkip){r.skipped=true;r.refresh();}},[introSkip]);
  return <div className={`court-environment arena-environment performance-universe visible environment-${index} ${fallback?'static':''}`} data-renderer={fallback?'static':'webgl'} aria-hidden="true"><div ref={host} className="webgl-host"/>{fallback&&<StaticUniverse index={index} step={step}/>}</div>;
}
function StaticUniverse({index,step}){
  const {points,paths}=useMemo(()=>{const pose=chapterPose(index,step),camera=new T.PerspectiveCamera(pose.fov,1200/760,.1,160);camera.position.set(...pose.camera);camera.lookAt(...pose.look);camera.updateMatrixWorld();const positions=positionsFor(index,step),vector=new T.Vector3(),points=[];for(let i=0;i<NODE_COUNT;i++){vector.fromArray(positions,i*3).project(camera);points.push([(vector.x*.5+.5)*1200,(-vector.y*.5+.5)*760,vector.z]);}const paths=[];for(let i=0;i<NODE_COUNT;i++){const j=Math.floor(i/12)*12+(i+1)%12;if(seed(i+19)<pose.connections&&points[i][2]<1&&points[j][2]<1)paths.push(`M${points[i][0]} ${points[i][1]}L${points[j][0]} ${points[j][1]}`);}return{points,paths};},[index,step]);
  if(index<=2)return <MuseumFallback index={index} step={step} connected={index!==1}/>;
  return <svg className="arena-fallback universe-fallback" data-chapter={index} data-step={step} viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="universe-haze"><stop stopColor="#103344" stopOpacity=".65"/><stop offset="1" stopColor="#0d0f18" stopOpacity="0"/></radialGradient></defs><rect width="1200" height="760" fill="#0d0f18"/><ellipse cx="900" cy="330" rx="520" ry="410" fill="url(#universe-haze)"/><g stroke="#2c93ac" strokeWidth="1" fill="none" opacity=".45">{paths.map((d,i)=><path key={i} d={d}/>)}</g><g fill="#79dfef">{points.map(([x,y,z],i)=>z<1&&<circle key={i} cx={x} cy={y} r={i%12===0?3:1.5} opacity={.4+(i%3)*.2}/>)}</g></svg>;
}

function MuseumFallback({index,step,connected}){
  if(index===0)return <svg className="arena-fallback universe-fallback" data-chapter="0" data-step={step} viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="entry-haze"><stop stopColor="#163642"/><stop offset="1" stopColor="#060f15"/></radialGradient></defs>
    <rect width="1200" height="680" fill="url(#entry-haze)"/>
    <g fill="none" stroke="#345866">{[350,260,185].map((r,i)=><ellipse key={r} cx="600" cy={40+i*7} rx={r} ry={r*.28} strokeWidth="12"/>)}</g>
    <g fill="none" stroke="#3999a9">{[350,260,185].map((r,i)=><ellipse key={r} cx="600" cy={46+i*7} rx={r} ry={r*.28}/>)}<circle cx="600" cy="242" r="80"/><ellipse cx="600" cy="242" rx="36" ry="80"/><ellipse cx="600" cy="242" rx="80" ry="19"/></g>
    {[-1,1].map(side=><g key={side} transform={side===1?'translate(1200) scale(-1 1)':undefined}><path d="M0 570 Q430 440 267 398 L0 419Z" fill="#112732" stroke="#328294"/>{[20,128,222].map((x,i)=><path key={x} d={`M${x} ${106+i*24}l80 20v${194-i*15}l-80 5Z`} fill="#0d202a" stroke="#245362"/>)}</g>)}
  </svg>;
  return <svg className="arena-fallback museum-fallback universe-fallback" data-chapter={index} data-step={step} viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Vista esquemática do museu, alternativa sem WebGL">
    <defs><radialGradient id="museum-static-light"><stop stopColor="#245467"/><stop offset="1" stopColor="#09131b"/></radialGradient></defs>
    <rect width="1200" height="760" fill="url(#museum-static-light)"/>
    <path d="M0 760L660 430 1200 760" fill="#132c36"/>
    {[0,1,2,3,4].map(i=><g key={i} transform={`translate(${660-i*6},${440-i*22}) scale(${1-i*.14})`} fill="none"><path d="M-650 360V-80A650 650 0 0 1 650-80V360" stroke="#233c48" strokeWidth="32"/><path d="M-630 360V-80A630 630 0 0 1 630-80V360" stroke="#288b9d" strokeWidth="2"/></g>)}
    <ellipse cx="760" cy="610" rx="250" ry="55" fill="#10212b" stroke="#31a8bd"/>
    {[0,1,2].map(i=><g key={i} transform={`translate(${connected?0:(i%2?40:-30)},${connected?0:i*12})`}><ellipse cx="760" cy={240+i*85} rx={190-i*15} ry="47" fill="none" stroke="#34515e" strokeWidth="23" strokeDasharray={connected?undefined:'85 30'}/><ellipse cx="760" cy={244+i*85} rx={187-i*15} ry="47" fill="none" stroke="#34b9cc" strokeWidth="2" strokeDasharray={connected?undefined:'85 30'}/></g>)}
    {index===0?<circle cx="760" cy="350" r="72" fill="#112f3b" stroke="#349cad"/>:[0,1,2,3,4,5,6,7].map(i=><rect key={i} x={660+(i%3)*65+(connected?0:(i%2?50:-50))} y={315+Math.floor(i/3)*77} width="48" height="50" fill="#385663" stroke="#51727e"/>)}
  </svg>;
}
