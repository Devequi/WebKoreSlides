import {featureViews,featureLook,featureRoute,featureGaze} from './createFeatureHall';
import {createJourneyGallery,journeyRoute,journeyGaze} from './createJourneyGallery';
import {createAthletes} from './createAthletes';
import * as T from 'three';
import {createRotunda} from './createRotunda';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Reflector} from 'three/addons/objects/Reflector.js';

// Metres, Y up. Both chapters occupy this same atrium and reuse every exhibit.
export function createMuseum(camera,renderer,invalidate){
  const scene=new T.Scene(),geometries=new Set(),materials=new Set(),textures=new Set(),batches=[];
  scene.fog=new T.FogExp2(0x0b1820,.018);
  const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  let random=827;const rand=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
  for(let i=0;i<pixels.data.length;i+=4){const n=120+rand()*62;pixels.data.set([n,n+3,n+5,255],i);}ctx.putImageData(pixels,0,0);
  ctx.strokeStyle='#737b80';ctx.lineWidth=2;for(let i=0;i<256;i+=64){ctx.strokeRect(i,0,64,128);ctx.strokeRect(i+32,128,64,128);}
  const stoneMap=new T.CanvasTexture(canvas);stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;stoneMap.repeat.set(2,2);stoneMap.colorSpace=T.SRGBColorSpace;textures.add(stoneMap);
  const stone=mat(new T.MeshStandardMaterial({color:0x656a69,map:stoneMap,bumpMap:stoneMap,bumpScale:.17,roughness:.78,metalness:.12}));
  const metal=mat(new T.MeshStandardMaterial({color:0x172e38,roughness:.32,metalness:.58}));
  const pale=mat(new T.MeshStandardMaterial({color:0x91a9ad,map:stoneMap,bumpMap:stoneMap,bumpScale:.08,roughness:.53,metalness:.23}));
  const cyan=mat(new T.MeshBasicMaterial({color:new T.Color('#37d3e7').multiplyScalar(1.7)}));
  const warm=mat(new T.MeshBasicMaterial({color:0xf7dab0}));
  const glass=mat(new T.MeshStandardMaterial({color:0x317c8b,transparent:true,opacity:.17,roughness:.25,metalness:.2,depthWrite:false,side:T.DoubleSide}));
  const box=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,48));
  const collections=new Map();
  function fixed(g,m,p=[0,0,0],s=[1,1,1],rotation=[0,0,0]){
    const clone=g.index?g.toNonIndexed():g.clone();clone.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...s)));
    if(!collections.has(m))collections.set(m,[]);collections.get(m).push(clone);
  }
  function arc(radius,width,height,start=0,length=Math.PI*2){
    const shape=new T.Shape(),steps=Math.max(8,Math.ceil(length*20));
    for(let i=0;i<=steps;i++){const a=start+i/steps*length,x=Math.cos(a)*(radius+width/2),y=Math.sin(a)*(radius+width/2);if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}
    for(let i=steps;i>=0;i--){const a=start+i/steps*length;shape.lineTo(Math.cos(a)*(radius-width/2),Math.sin(a)*(radius-width/2));}shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});g.translate(0,0,-height/2);g.rotateX(-Math.PI/2);return geo(g);
  }
  // Tiled floor, deep side galleries, and vaults visibly extend beyond the viewport.
  fixed(box,stone,[0,-.55,-13],[88,1,100]);
  const floorMap=stoneMap.clone();floorMap.repeat.set(20,30);textures.add(floorMap);
  const floor=mat(new T.MeshStandardMaterial({color:0x40545b,map:floorMap,bumpMap:floorMap,bumpScale:.035,roughness:.32,metalness:.3}));
  fixed(box,floor,[0,-.025,-13],[52,.1,95]);
  const mirror=new Reflector(geo(new T.PlaneGeometry(50,94)),{color:0x384b54,textureWidth:512,textureHeight:256,multisample:0,clipBias:.004});
  mirror.rotation.x=-Math.PI/2;mirror.position.set(0,.035,-13);
  // Low-resolution planar reflection mixed with stone rather than a perfect mirror.
  mirror.material.transparent=true;mirror.material.depthWrite=false;
  mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay(base.rgb, color) * 0.7, 0.38 )');
  scene.add(mirror);
  const renderReflection=mirror.onBeforeRender,lastReflectionCamera=new T.Vector3(Infinity,Infinity,Infinity);
  let reflectionAspect=-1,lastProgress=-1;
  fixed(box,stone,[0,10,-57],[49,22,2]);
  fixed(box,stone,[-24,10,-13],[1,22,90]);
  for(const [z,length] of [[-25,66],[24,16]])fixed(box,stone,[24,10,z],[1,22,length]);
  fixed(box,stone,[24,14,12],[1,14,8]);
  for(const [z,length] of [[-25,66],[24,16]])fixed(arc(21,.45,length,0,Math.PI),stone,[0,2,z],[1,1,1],[Math.PI/2,0,0]);
  for(let z=-48;z<=28;z+=8){
    for(const side of [-1,1]){
      fixed(box,stone,[side*20,10,z],[2.4,20,2.8]);fixed(box,metal,[side*19.6,3,z],[3.2,.4,3.6]);
      fixed(box,stone,[side*22,20,z],[6,1.6,8]);
      fixed(box,cyan,[side*18.72,11,z+.08],[.08,10,.12]);
      fixed(box,warm,[side*18.7,1,z+1.5],[.12,.65,.12]);
    }
    const vault=arc(20,1.5,1.5,0,Math.PI);fixed(vault,stone,[0,2,z],[1,1,1],[Math.PI/2,0,0]);
    const lightArc=arc(19.1,.065,.1,0,Math.PI);fixed(lightArc,cyan,[0,2,z+.84],[1,1,1],[Math.PI/2,0,0]);
  }
  for(const side of [-1,1]){
    fixed(box,stone,[side*20,6.9,-12],[7,.8,83]);
    fixed(box,metal,[side*16.4,8.8,-12],[.09,.09,83]);fixed(box,cyan,[side*16.4,7.3,-12],[.06,.06,83]);
    fixed(box,glass,[side*16.4,8,-12],[.06,1.4,83]);
    for(let z=-52;z<30;z+=2)fixed(box,metal,[side*16.4,8,z],[.07,1.8,.07]);
    // Ground-floor handrails curve towards the main installation.
    const rail=arc(11.7,.065,.065,side===1?-.1:Math.PI-.85,.95);
    fixed(rail,metal,[3,1.5,2]);fixed(rail,cyan,[3,.15,2]);
    for(let i=0;i<=12;i++){const a=(side===1?-.1:Math.PI-.85)+i/12*.95;fixed(box,metal,[3+Math.cos(a)*11.7,.8,2+Math.sin(a)*11.7],[.065,1.4,.065]);}
  }
  // Skylight and suspended structural frame.
  fixed(arc(9,1.3,.8),stone,[3,22,-5]);fixed(arc(8.4,.07,.07),cyan,[3,21.52,-5]);
  fixed(cylinder,metal,[3,.3,-5],[6.6,.6,6.6]);fixed(cylinder,stone,[3,.7,-5],[5.6,.45,5.6]);
  fixed(arc(5.7,.075,.08),cyan,[3,.96,-5]);fixed(arc(8.5,.06,.04),cyan,[3,.05,-5]);
  fixed(arc(10.3,.04,.03),warm,[3,.05,-5]);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;fixed(box,metal,[3+Math.cos(a)*7,18,-5+Math.sin(a)*7],[.035,8,.035]);}
  // A distant connected gallery remains visible behind the transforming exhibit.
  for(let i=0;i<5;i++){
    const x=-12+i*7,z=-29-i%2*3;
    fixed(box,metal,[x,4,z],[4,.35,2]);fixed(box,glass,[x,8,z],[4.3,7.5,.08]);
    fixed(box,cyan,[x,4.1,z+.1],[4.3,.06,.08]);
    for(let j=0;j<7;j++){const h=1+((j*3+i*2)%7)*.55;fixed(box,metal,[x-1.5+j*.5,4.4+h/2,z+.1],[.28,h,.2]);fixed(box,cyan,[x-1.5+j*.5,4.5+h,z+.22],[.27,.05,.04]);}
  }
  function finishArchitecture(parent){
    for(const [material,parts] of collections){
      const mesh=new T.Mesh(geo(mergeGeometries(parts,false)),material);
      parts.forEach(p=>p.dispose());
      mesh.castShadow=material===stone||material===metal;
      mesh.receiveShadow=true;parent.add(mesh);
    }
    collections.clear();
  }
  finishArchitecture(scene);
  const pedestal=new T.Group();
  pedestal.position.set(3,1,-5);pedestal.rotation.y=-.32;scene.add(pedestal);
  const pieces=[],transforms=[];
  function moving(mesh,assembled,broken,ar=[0,0,0],br=[0,0,0]){mesh.position.set(...assembled);mesh.rotation.set(...ar);scene.add(mesh);mesh.castShadow=true;mesh.receiveShadow=true;pieces.push(mesh);transforms.push({a:new T.Vector3(...assembled),b:new T.Vector3(...broken),aq:new T.Quaternion().setFromEuler(new T.Euler(...ar)),bq:new T.Quaternion().setFromEuler(new T.Euler(...br))});}
  const fragments=[[-3,3,-11],[11,3.2,-9],[-3.5,6.7,-14],[12,7.8,-8],[-4,10.6,-10],[13,10.8,-15]];
  // Preserve the six orientations of the fragmented exhibit independently of its assembled pose.
  const fragmentAngles=[
    [-0.2270396,-0.1283049,-0.3450595],
    [-0.2639429,-0.8462717,0.0102337],
    [0.0377898,-1.1424027,-0.0496879],
    [0.5396038,-1.4399733,0.3944105],
    [-0.2083700,-2.2412775,-0.1593436],
    [0.4017792,-2.2635626,0.0281292]
  ];
  const panelPositions=[[8,3.3,-11],[8,6.3,-11],[8,9.3,-11]];
  const blockInstances=new T.InstancedMesh(box,pale,fragments.length);
  const stripInstances=new T.InstancedMesh(box,cyan,fragments.length);
  for(const batch of [blockInstances,stripInstances]){
    batch.frustumCulled=false;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(batch);batches.push(batch);
  }
  blockInstances.castShadow=true;blockInstances.receiveShadow=true;
  const stripTransform=new T.Object3D(),blockSizes=[];
  fragments.forEach((position,i)=>{
    const mesh=new T.Mesh(box,pale),panel=panelPositions[i%3];
    blockSizes.push(new T.Vector3(1.6+(i%4)*.3,.65+(i%2)*.2,1.25));
    // Fragments on the left recede in place. The others dock beside the indicators.
    const dock=i%2?[panel[0]+2.1,panel[1]-.7,panel[2]]:position;
    moving(mesh,dock,position,[0,.35,0],fragmentAngles[i]);
    mesh.visible=false;
  });
  // Keep the original suspended-ring poses independent of the number of blocks.
  random=4263057639;
  // Large solid suspended ring segments physically reunite in the solution.
  for(let level=0;level<2;level++)for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,r=level?7.8:6.7,y=level?15.2:12.3;
    const segment=new T.Mesh(arc(r,.7,.65,a,.5),metal);
    const strip=new T.Mesh(arc(r-.03,.08,.035,a,.49),cyan);strip.position.y=-.34;segment.add(strip);
    moving(segment,[3,y,-5],[3+Math.cos(a)*1.15,y+(i%3-1)*.68,-5+Math.sin(a)*1.6],[0,0,0],[(rand()-.5)*.12,(rand()-.5)*.15,(rand()-.5)*.12]);
  }
  // Exhibited charts represent the concept of data, never claim product metrics.
  const indicatorFaces=[];
  function trace(points,radius,material){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return new T.Mesh(geo(new T.TubeGeometry(curve,32,radius,5,false)),material);
  }
  for(let i=0;i<3;i++){
    const panel=new T.Group(),back=new T.Mesh(box,metal);back.scale.set(3.6,2.4,.18);panel.add(back);
    const bars=new T.Group(),signal=new T.Group();panel.add(bars,signal);
    function mark(parent,x,y,width,height){
      const bar=new T.Mesh(box,cyan);bar.scale.set(width,height,.035);bar.position.set(x,y,.12);parent.add(bar);
    }
    for(let j=0;j<6;j++){const h=.3+(j*.31+i*.18)%1.7;mark(bars,-1.25+j*.5,-.9+h/2,.25,h);}
    if(i===0){
      for(const y of [-.55,0,.55]){mark(signal,-1.1,y,.16,.16);mark(signal,.25,y,1.85,.085);}
    }else if(i===2){
      signal.add(trace([[-1.35,-.65,.13],[-.72,-.23,.13],[-.08,-.33,.13],[.57,.24,.13],[1.32,.70,.13]],.045,cyan));
    }
    indicatorFaces.push({bars,signal,panel});
    moving(panel,panelPositions[i],[i===0?-4:10+i*1.5,4+i*1.8,-14-i*2],[0,.32,0],[.12,i*.3-.3,-.15+i*.16]);
  }
  const linkMaterial=mat(new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{time:{value:0},gain:{value:0}},
    vertexShader:'varying float u;void main(){u=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying float u;uniform float time,gain;void main(){float wave=.5+.5*cos(6.283*(u-time*.15));gl_FragColor=vec4(.15,.67,.74,gain*(.34+.42*pow(wave,8.)));}'
  }));
  const links=new T.Group();scene.add(links);
  for(const i of [0,2]){
    const y=panelPositions[i][1];
    links.add(trace([[5.1,1.25,-6],[5.6,1.65,-7.8],[5.7,y-.55,-9.5],[6.5,y,-10.55]],.032,linkMaterial));
  }
  const hemi=new T.HemisphereLight(0xa4bcc5,0x161b20,.8);scene.add(hemi);
  const key=new T.SpotLight(0xd6f4ff,2700,85,.7,.65,1.5);key.position.set(3,23,0);key.target.position.set(3,3,-5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0002;key.shadow.normalBias=.09;scene.add(key,key.target);
  const rim=new T.DirectionalLight(0x4ad9ee,1.8);rim.position.set(-14,12,-18);scene.add(rim);
  const front=new T.DirectionalLight(0xd3dce6,1.1);front.position.set(8,12,18);scene.add(front);
  for(const x of [-18,18]){const light=new T.PointLight(0xffd6a3,95,28,1.5);light.position.set(x,2,3);scene.add(light);}
  for(const x of [-14,16]){const light=new T.PointLight(0x29c4df,550,32,1.6);light.position.set(x,6,-8);scene.add(light);}
  // Soft volumetric shaft. A depth-tested cone, not a screen-space overlay.
  const beamMat=mat(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{tint:{value:new T.Color('#69cddd')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 tint;void main(){float a=pow(sin(vUv.x*3.14159265),4.)*.035*(1.-vUv.y);gl_FragColor=vec4(tint,a);}'}));
  const beam=new T.Mesh(geo(new T.CylinderGeometry(4.8,8,22,48,1,true)),beamMat);beam.position.set(3,11,-5);scene.add(beam);
  const gallery=new T.Group();gallery.add(...scene.children.slice());scene.add(gallery);
  const wing=createJourneyGallery({fixed,arc,box,stone,metal,floor,geo,mat});
  finishArchitecture(wing.group);scene.add(wing.group);
  // Keep the museum lighting shared when the atrium is behind the camera.
  const sharedLights=[hemi,key,key.target,rim,front];
  scene.add(...sharedLights);
  scene.add(mirror);
  const rotunda=createRotunda(stoneMap);scene.add(rotunda.room);
  const athletes=createAthletes(rotunda.panels,pedestal,invalidate);
  let journeyTravel=false,featureTravel=false,portalTravel=false;
  let along=0, startAlong=0;
  const startPoint=new T.Vector3();
  const passage=new T.Vector3(0,4.5,36);
  let entryTravel=false,entry=0,entryStart=0;
  const entryCamera=new T.CatmullRomCurve3([
    new T.Vector3(0,4.2,77),new T.Vector3(0,4.2,57),rotunda.passage,
    new T.Vector3(-1.4,4.3,29),new T.Vector3(-10,4.8,23)
  ]);
  const entryGaze=new T.CatmullRomCurve3([
    new T.Vector3(0,6.5,51),rotunda.passage,new T.Vector3(0,4.4,23),
    new T.Vector3(0,5.5,8),new T.Vector3(-4.5,6,-5)
  ]);
  const entryCameraOffset=new T.Vector3(),entryLookOffset=new T.Vector3();
  const cameraFraction=value=>T.MathUtils.smootherstep(value,.35,1);
  const openingLook=new T.Vector3(0,6.5,51);
  const from=pieces.map(p=>({position:p.position.clone(),quaternion:p.quaternion.clone()}));
  const state={index:-1,step:0,start:0,progress:1,immediate:true,travel:14};let currentCamera=camera.position.clone(),currentLook=new T.Vector3(3,7,-5),fromCamera=currentCamera.clone(),fromLook=currentLook.clone(),targetCamera=currentCamera.clone(),targetLook=currentLook.clone(),fromMix=1,mix=1,toMix=1;
  const ease=t=>t*t*t*(t*(t*6-15)+10),target=new T.Vector3(),quat=new T.Quaternion();
  function setChapter(index,step,{immediate=false,previous=state.index}={}){
    if(index===3 && previous===3){state.step=step;if(immediate)state.immediate=true;return;}
    const retracing=state.progress<1 && previous===state.index &&
      ((journeyTravel && (index===2||index===3)) || (featureTravel && (index===3||index===4)));
    const continuingEntry=entryTravel && state.progress<1;
    entryTravel=(previous===0 && index===1)||(previous===1 && index===0);
    entryStart=continuingEntry?entry:previous===0?0:1;
    journeyTravel=(previous===2&&index===3)||(previous===3&&index===2);
    featureTravel=(previous===3&&index===4)||(previous===4&&index===3);
    const forward=index===(featureTravel?4:3);
    startAlong=retracing?along:forward?0:1;
    along=startAlong;
    if(index>=3&&!journeyTravel&&!featureTravel&&previous!==index)immediate=true;
    portalTravel=!journeyTravel && !featureTravel && index<3 && state.index>=0 && state.index!==index && (state.index===0 || index===0);
    if(previous<0)immediate=true;
    state.travel=state.index!==index?14:1.5;
    fromCamera.copy(previous===state.index && previous>=0 ? currentCamera : camera.position);
    state.index=index;state.step=step;state.start=performance.now();state.progress=immediate?1:0;state.immediate=immediate;
    fromLook.copy(currentLook);fromMix=mix;toMix=index===1?0:1;
    if(entryTravel){
      const f=cameraFraction(entryStart);
      entryCameraOffset.copy(fromCamera).sub(entryCamera.getPoint(f,target));
      entryLookOffset.copy(fromLook).sub(entryGaze.getPoint(f,target));
    }
    targetCamera.set(...(index===2?[12.8,4.5,16.5]:[-10,4.8,23]));
    targetLook.set(...(index===2?[-1,7,-6]:[-4.5,6,-5]));
    if(index===3){journeyRoute.getPoint(1,targetCamera);journeyGaze.getPoint(1,targetLook);}
    if(index===4){targetCamera.set(...featureViews[step]);targetLook.set(...featureLook);}
    if(index===0){targetCamera.set(0,4.2,77);targetLook.copy(openingLook);}
    lastProgress=-1;
    pieces.forEach((p,i)=>{from[i].position.copy(p.position);from[i].quaternion.copy(p.quaternion);});
    renderer.shadowMap.needsUpdate=true;lastReflectionCamera.setScalar(Infinity);
  }
  function update({now,reduced,pointer,intro,time}){
    const duration=entryTravel?4200:journeyTravel||featureTravel?3350:portalTravel?3200:state.index===4?700:2600;
    // RAF timestamps refer to the frame boundary, even if React committed later in that frame.
    state.progress=state.immediate||reduced?1:T.MathUtils.clamp((now-state.start)/duration,0,1);
    const t=T.MathUtils.clamp(ease(state.progress),0,1);
    mix=T.MathUtils.lerp(fromMix,toMix,t);
    if(state.progress<1||lastProgress!==1||state.index<3){
    for(let i=0;i<pieces.length;i++){
      const pose=transforms[i];target.copy(pose.b).lerp(pose.a,toMix);quat.copy(pose.bq).slerp(pose.aq,toMix);
      pieces[i].position.copy(from[i].position).lerp(target,t);pieces[i].quaternion.copy(from[i].quaternion).slerp(quat,t);
    }
    blockInstances.count=stripInstances.count=0;
    for(let i=0;i<fragments.length;i++){
      const block=pieces[i],size=T.MathUtils.lerp(.58,i%2 ? .33 : 0,mix);
      if(size<.001)continue;
      block.scale.copy(blockSizes[i]).multiplyScalar(size);
      block.updateMatrix();blockInstances.setMatrixAt(blockInstances.count++,block.matrix);
      stripTransform.position.set(0,-.36,.515).applyMatrix4(block.matrix);
      stripTransform.quaternion.copy(block.quaternion);
      stripTransform.scale.set(block.scale.x*.8,.035,.025);stripTransform.updateMatrix();
      stripInstances.setMatrixAt(stripInstances.count++,stripTransform.matrix);
    }
    blockInstances.instanceMatrix.needsUpdate=true;stripInstances.instanceMatrix.needsUpdate=true;
    }
    const forward=state.index===(featureTravel?4:3);
    along=T.MathUtils.lerp(startAlong,forward?1:0,t);
    const travel=journeyTravel?along:state.index>=3?1:0;
    currentCamera.copy(fromCamera).lerp(targetCamera,t);
    // Travel through the foreground strata along a deliberate bow, not an orbit loop.
    const path=featureTravel?featureRoute:journeyRoute, gaze=featureTravel?featureGaze:journeyGaze;
    function sample(spline,out,from,to){
      spline.getPoint(along,out);
      const last=spline.points.length-1;
      spline.getPoint(startAlong,startPoint);
      out.addScaledVector(target.copy(from).sub(startPoint),1-t);
      out.addScaledVector(target.copy(to).sub(spline.points[forward?last:0]),t);
    }
    entry=entryTravel?T.MathUtils.lerp(entryStart,state.index===1?1:0,state.progress):0;
    const entryFraction=cameraFraction(entry);
    if(entryTravel){
      entryCamera.getPoint(entryFraction,currentCamera).addScaledVector(entryCameraOffset,1-t);
    }else if(journeyTravel||featureTravel){
      sample(path,currentCamera,fromCamera,targetCamera);
    }else if(portalTravel){
      const bend=4*t*(1-t);
      currentCamera.x+=bend*(passage.x-(fromCamera.x+targetCamera.x)*.5);
      currentCamera.y+=bend*(passage.y-(fromCamera.y+targetCamera.y)*.5);
    }else if(state.index!==0&&state.index!==4)currentCamera.z-=Math.sin(Math.PI*state.progress)*state.travel*(reduced?0:1);
    if(state.index===0 && !entryTravel){
      const reveal=1-T.MathUtils.smoothstep(intro,0,5.4);
      currentCamera.z+=reveal*5*t;
      currentCamera.x+=(reveal*.75+(reduced?0:.05*Math.sin(time*.25)))*t;
    }
    rotunda.room.visible=state.index===0 || portalTravel && state.progress<1;
    gallery.visible=travel<1 && (state.index!==0 || portalTravel && currentCamera.z<55);
    for(const light of sharedLights)light.visible=state.index!==0 || gallery.visible;
    if(entryTravel)gallery.visible=entry>0;
    else if(portalTravel && currentCamera.z>55)gallery.visible=false;
    wing.group.visible=travel>0;
    if(wing.group.visible)wing.update(reduced?0:time,camera.aspect);
    const exhibit=1-T.MathUtils.smoothstep(travel,0,.35);
    pedestal.visible=exhibit>0;
    const organized=mix*exhibit;
    links.visible=gallery.visible && organized>.001;
    linkMaterial.uniforms.gain.value=organized;
    linkMaterial.uniforms.time.value=reduced?0:time;
    indicatorFaces.forEach(({bars,signal,panel},i)=>{
      panel.scale.setScalar(Math.max(.001,exhibit));
      bars.visible=i===1 || mix<.5;signal.visible=i!==1 && mix>=.5;
      signal.position.y=bars.position.y=reduced?0:.075*organized*Math.sin(time*.55+i*2);
      panel.children[0].position.y=signal.position.y;
    });
    const hallFloor=currentCamera.z < -27 && travel===1;
    mirror.visible=!rotunda.room.visible && (travel<.6 || hallFloor);
    mirror.position.set(hallFloor?53:0,.035,hallFloor?-88:-13);
    mirror.scale.x=hallFloor?1.18:1;
    athletes.update({time:reduced?0:time,panelsVisible:rotunda.room.visible,centralVisible:gallery.visible&&pedestal.visible,centralGain:exhibit,gain:state.index===0?.18+.82*T.MathUtils.smoothstep(intro,1.45,3):1,scatter:.08*(1-mix)});
    if(rotunda.room.visible)rotunda.update(state.index===0?intro:5.4,reduced?0:time,entry);
    currentLook.copy(fromLook).lerp(targetLook,t);
    if(entryTravel){
      entryGaze.getPoint(entryFraction,currentLook).addScaledVector(entryLookOffset,1-t);
    }else if(journeyTravel||featureTravel){
      sample(gaze,currentLook,fromLook,targetLook);
    }
    camera.position.copy(currentCamera);
    if(!reduced){const gain=featureTravel?1-Math.sin(Math.PI*t):1;camera.position.x+=pointer.x*.32*gain;camera.position.y+=pointer.y*.15*gain;}
    camera.fov=camera.aspect<1?64+travel*5:53;camera.updateProjectionMatrix();camera.lookAt(currentLook);
    const reflectionChanged=state.progress<1||reflectionAspect!==camera.aspect||camera.position.distanceToSquared(lastReflectionCamera)>.00001;
    mirror.onBeforeRender=reflectionChanged?renderReflection:()=>{};
    lastReflectionCamera.copy(camera.position);
    reflectionAspect=camera.aspect;
    if(state.progress<1||lastProgress!==state.progress)renderer.shadowMap.needsUpdate=true;
    lastProgress=state.progress;
    key.intensity=(3100+mix*600)*(1-.64*travel);hemi.intensity=.8+mix*.2;
  }
  function diagnostics(){let hash=2166136261;for(const p of pieces)for(const n of [...p.position.toArray(),...p.quaternion.toArray()])hash=Math.imul(hash^Math.round(n*1000),16777619);return{chapter:state.index,step:state.step,progress:state.progress,pose:(hash>>>0).toString(16),camera:camera.position.toArray().map(n=>Math.round(n*1000)/1000).join(','),journeyTravel:journeyTravel&&state.progress<1,arrival:entryTravel?(state.index===1?T.MathUtils.smoothstep(entry,.79,1):1-T.MathUtils.smoothstep(entry,0,.18)):portalTravel && state.index===1?T.MathUtils.smoothstep(state.progress,.60,.94):1,athletes:athletes.count,nodeCount:pieces.length,geometryBudget:geometries.size+rotunda.geometryCount+2,textureBudget:textures.size+3+rotunda.textureCount+7};}
  function dispose(){athletes.dispose();rotunda.dispose();mirror.dispose();batches.forEach(b=>b.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());key.shadow.map?.dispose();scene.clear();}
  return {scene,setChapter,update,diagnostics,dispose};
}
