import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Reflector} from 'three/addons/objects/Reflector.js';

const TAU = Math.PI * 2;
const origin = 53;
const ramp = T.MathUtils.smoothstep;

// An engraved world atlas on a real sphere. Coastlines and dots are generated
// locally, so projection and occlusion follow the globe as it turns.
function atlas() {
  const c=document.createElement('canvas');c.width=1024;c.height=512;
  const ctx=c.getContext('2d');ctx.fillStyle='#041c28';ctx.fillRect(0,0,c.width,c.height);
  const land=[
    [[-168,65],[-150,72],[-120,69],[-96,76],[-55,60],[-66,44],[-81,32],[-87,17],[-77,9],[-100,18],[-117,33],[-126,49],[-143,58]],
    [[-80,10],[-63,12],[-48,1],[-35,-7],[-43,-23],[-54,-34],[-68,-55],[-74,-43],[-70,-20],[-81,-5]],
    [[-52,60],[-60,73],[-41,83],[-18,77],[-30,67]],
    [[-17,15],[-12,31],[1,37],[23,32],[32,30],[44,12],[51,12],[42,-2],[39,-18],[24,-35],[16,-27],[10,-7],[3,4],[-9,5]],
    [[-10,36],[-9,44],[3,47],[8,55],[5,61],[19,71],[29,70],[24,59],[43,68],[76,74],[105,78],[144,70],[177,65],[166,53],[145,47],[131,34],[121,24],[109,20],[106,10],[99,6],[92,22],[79,7],[72,20],[56,26],[52,16],[43,12],[32,29],[27,39],[16,38],[9,44],[2,37]],
    [[113,-22],[122,-15],[136,-12],[144,-15],[153,-26],[148,-38],[134,-33],[116,-35]],
    [[46,-13],[50,-14],[47,-26],[44,-24]],[[130,33],[143,45],[145,43],[136,32]],[[96,4],[107,-5],[120,-8],[112,-9]],[[166,-45],[178,-36],[175,-42]]
  ];
  const path=new Path2D();for(const polygon of land){polygon.forEach(([x,y],i)=>path[i?'lineTo':'moveTo']((x+180)/360*c.width,(90-y)/180*c.height));path.closePath();}
  ctx.fillStyle='#13566a';ctx.fill(path);
  const raster=ctx.getImageData(0,0,c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const offset=4*(y*c.width+x);
    if(raster.data[offset+1]<65)continue;
    const dot=(y%4===0 && (x+(y%8===0?2:0))%4<2);
    const grain=dot?105+((x*13+y*17)%100):25;
    raster.data[offset]=grain*.25;raster.data[offset+1]=grain;raster.data[offset+2]=grain*1.14;
  }
  ctx.putImageData(raster,0,0);ctx.lineWidth=.8;ctx.strokeStyle='#3392a2';ctx.stroke(path);
  ctx.strokeStyle='#123946';ctx.lineWidth=.7;
  for(let x=0;x<1024;x+=1024/24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
  for(let y=0;y<512;y+=512/12){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}

export function createRotunda(stoneMap){
  const room=new T.Group();room.position.z=origin;
  const geometries=new Set(),materials=new Set(),staticParts=new Map();
  const own=g=>(geometries.add(g),g);
  const material=m=>(materials.add(m),m);
  const concrete=material(new T.MeshStandardMaterial({color:0x5e6d74,map:stoneMap,bumpMap:stoneMap,bumpScale:.05,roughness:.74,metalness:.17}));
  const alloy=material(new T.MeshStandardMaterial({color:0x435660,roughnessMap:stoneMap,roughness:.54,metalness:.6}));
  const dark=material(new T.MeshStandardMaterial({color:0x132129,roughness:.46,metalness:.25}));
  const trim=material(new T.MeshBasicMaterial({color:0x27b7c8}));
  const lamp=material(new T.MeshBasicMaterial({color:0xe0c5a0}));
  const glass=material(new T.MeshBasicMaterial({color:0x21404c,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false}));
  const box=own(new T.BoxGeometry());
  const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{
    const g=geo.index?geo.toNonIndexed():geo.clone();
    g.scale(sx,sy,sz);g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);
    if(!staticParts.has(mat))staticParts.set(mat,[]);staticParts.get(mat).push(g);
  };
  function annulus(inner,outer,h,start=0,sweep=TAU){
    const points=[[inner,-h/2],[outer,-h/2],[outer,h/2],[inner,h/2],[inner,-h/2]].map(([r,y])=>new T.Vector2(r,y));
    return own(new T.LatheGeometry(points,Math.ceil(sweep*18),start,sweep));
  }
  // Suspended drums, recessed light coves and panel joints.
  for(const [r,y] of [[11,14],[7.3,13.5],[15.5,16.7]]){
    add(annulus(r,r+1.25,1.05),alloy,0,y,-1);
    add(annulus(r+.09,r+.19,.055),trim,0,y-.55,-1);
    for(let i=0;i<32;i++){const a=i*TAU/32;add(box,dark,Math.sin(a)*(r+.62),y-.537,Math.cos(a)*(r+.62)-1,.045,.025,1.2,0,a);}
  }
  for(let i=0;i<48;i++){
    const a=i*TAU/48,x=Math.sin(a)*23,z=Math.cos(a)*23;
    if(z>12 || (z<-20 && Math.abs(x)<7))continue;
    add(box,concrete,x,8.8,z,2.97,17.6,.8,0,a);
    add(box,alloy,x*.975,8.8,z*.975,.15,17.6,.13,0,a);
    add(box,lamp,x*.95,.55,z*.95,.08,.25,.08);
  }
  // Two arc-shaped mezzanines leave a clear axial passage to the next atrium.
  for(const side of [-1,1]){
    const angle=side===1?Math.PI+.18:.18;
    const x=side*23;
    add(annulus(12.8,20,1.15,angle,Math.PI-.36),concrete,x,.64,6);
    add(annulus(12.79,12.87,.055,angle,Math.PI-.36),trim,x,1.24,6);
    add(annulus(12.8,12.85,1.46,angle,Math.PI-.36),glass,x,1.98,6);
    add(annulus(12.78,12.91,.10,angle,Math.PI-.36),alloy,x,2.75,6);
    add(annulus(12.76,12.8,.034,angle,Math.PI-.36),trim,x,2.78,6);
    for(let j=0;j<=30;j++){const a=angle+j*(Math.PI-.36)/30;add(box,alloy,x+12.8*Math.sin(a),1.96,6+12.8*Math.cos(a),.055,1.52,.055);}
  }
  const portalZ=-17,portalY=4.2,aperture=5.575;
  const rim=own(new T.TorusGeometry(6,.38,10,80));
  const seam=own(new T.TorusGeometry(aperture+.045,.045,8,80));
  const sealLight=material(new T.MeshBasicMaterial({color:0x238b9c}));
  for(const z of [portalZ,-21]){
    add(rim,alloy,0,portalY,z);
    add(seam,z===portalZ?sealLight:trim,0,portalY,z+.09);
  }
  const panels=[];
  // Outer exhibits are seen obliquely from the central aisle. Turn the
  // shoulders further inward so that this viewpoint still reads in three quarters.
  const exhibitYaw=[1.18,.91,.82,1.11,1.02,.76];
  const setback=[1.72,1.52,1.35,1.63,1.58,1.40];
  const base=annulus(.01,1.26,.24);
  const inset=annulus(1.08,1.105,.018);
  for(let i=0;i<6;i++){
    const side=i<3?-1:1,depth=i%3,x=side*(14-depth*2.05),z=4-depth*6,angle=-side*.27;
    add(box,dark,x,7,z,4.25,7.7,.15,0,angle);
    add(box,trim,x,3.17,z+.09,4.25,.035,.12,0,angle);
    add(box,alloy,x,11,z,.04,3,.04);
    const anchor=new T.Group();
    const exhibitX=x+side*(depth===2?.62:.12);
    const exhibitZ=z+setback[i];
    add(base,alloy,exhibitX,3.33,exhibitZ,1,1,.82);
    add(inset,trim,exhibitX,3.457,exhibitZ,1,1,.82);
    anchor.position.set(exhibitX,3.46,exhibitZ);
    anchor.rotation.y=-side*exhibitYaw[i];
    room.add(anchor);panels.push(anchor);
  }
  const shaftMaterial=material(new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    uniforms:{reveal:{value:0}},
    vertexShader:'varying vec2 tex; void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 tex;uniform float reveal;void main(){float band=.5+.5*cos(tex.x*50.);float density=pow(band,4.)*smoothstep(0.,.75,tex.y)*.024;gl_FragColor=vec4(.14,.56,.63,density*reveal);}'
  }));
  const shaft=new T.Mesh(own(new T.CylinderGeometry(5.3,8.1,13,64,1,true)),shaftMaterial);
  shaft.position.set(0,7,-1);room.add(shaft);
  const map=atlas();
  const earth=new T.Mesh(own(new T.SphereGeometry(3.75,80,48)),material(new T.MeshBasicMaterial({map,color:0x8ab6c1})));
  earth.position.set(0,9.25,-2);room.add(earth);
  const flow=new T.Mesh(annulus(11.08,11.20,.025,0,.33),material(new T.MeshBasicMaterial({color:0x9ff6fb})));flow.position.set(0,13.43,-1);room.add(flow);
  const ground=new Reflector(own(new T.PlaneGeometry(53,57)),{textureWidth:512,textureHeight:256,multisample:0,clipBias:.004,color:0x52646c});
  // Frosted basalt floor: sample the projected reflection across several texels.
  ground.material.fragmentShader=ground.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv=vUv.xy/vUv.w;
    vec2 d=vec2(.002,.008);vec4 base=(texture2D(tDiffuse,uv)*2.+texture2D(tDiffuse,uv+d)+texture2D(tDiffuse,uv-d)+texture2D(tDiffuse,uv+vec2(d.x,-d.y))+texture2D(tDiffuse,uv+vec2(-d.x,d.y)))/6.;
    base.rgb=base.rgb*.38+vec3(.012,.021,.026);`);
  ground.rotation.x=-Math.PI/2;ground.position.y=.015;room.add(ground);
  for(let i=-6;i<=6;i++)add(box,dark,i*4,.023,0,.016,.012,56);
  for(let i=-7;i<=7;i++)add(box,dark,0,.023,i*4,52,.012,.018);
  function finishBatch(parent){
    for(const [mat,parts] of staticParts){
      parent.add(new T.Mesh(own(mergeGeometries(parts)),mat));
      parts.forEach(g=>g.dispose());
    }
    staticParts.clear();
  }
  finishBatch(room);

  const gate=new T.Group(),leaf=new T.Group();
  gate.position.set(0,portalY,portalZ-.38);
  gate.add(leaf);room.add(gate);

  // Batched vertices are in leaf space. Clip all armour and hardware to the
  // stationary bore, including in the floor reflection, while the leaf lifts.
  const lift={value:0};
  function gateFinish(base){
    const finish=material(base.clone());
    finish.onBeforeCompile=shader=>{
      shader.uniforms.lift=lift;
      shader.vertexShader='uniform float lift; varying vec2 borePosition;\n'+shader.vertexShader.replace(
        '#include <begin_vertex>','#include <begin_vertex>\n borePosition=position.xy+vec2(0.,lift);'
      );
      shader.fragmentShader='varying vec2 borePosition;\n'+shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\n if(dot(borePosition,borePosition)>'+ (aperture*aperture).toFixed(5) +') discard;'
      );
    };
    return finish;
  }
  const steel=gateFinish(alloy),recess=gateFinish(dark),edge=gateFinish(sealLight);
  steel.color.setHex(0x819da5);
  steel.metalness=.32;
  steel.emissive.setHex(0x28434d);
  edge.color.setHex(0x55d7df);
  const diameter=2*aperture;
  add(box,recess,0,0,-.25,diameter+.12,diameter+.12,.5);
  for(let i=-1;i<=1;i++){
    const y=i*diameter/3;
    add(box,steel,0,y,.04,diameter,diameter/3-.09,.15);
  }
  for(const side of [-1,1]){
    for(const y of [-1.75,1.75]){
      add(box,recess,side*2.5,y,.17,4.7,.52,.25,0,0,side*Math.sign(y)*.29);
      add(box,steel,side*2.5,y,.32,4.52,.29,.10,0,0,side*Math.sign(y)*.29);
    }
    add(box,recess,side*4.55,0,.14,.48,diameter,.22);
    add(box,steel,side*4.55,0,.28,.23,diameter,.13);
    add(box,edge,side*1.65,.04,.14,2.55,.06,.035);
    add(box,recess,side*.36,0,.14,.44,1.05,.18);
  }
  // The flat lower shoe is exposed as it crosses the circular opening.
  add(box,steel,0,-aperture+.19,.16,diameter,.38,.22);
  add(box,edge,0,-aperture+.30,.28,diameter,.055,.035);
  finishBatch(leaf);
  const gateLight=new T.PointLight(0xaacbd5,105,15,1.6);
  gateLight.position.set(-2.8,3.5,4);gate.add(gateLight);
  const sky=new T.HemisphereLight(0x94becb,0x192831,1);room.add(sky);
  for(const side of [-1,1]){const light=new T.PointLight(0x68c3d1,210,33,1.8);light.position.set(side*12,3,1);room.add(light);}
  return {room,panels,passage:room.localToWorld(new T.Vector3(0,portalY,portalZ)),update(intro,time,entry){
    // Hold the seal, take up the load, then lift at constant speed and brake into the header.
    const u=T.MathUtils.clamp((entry-.07)/.49,0,1),accel=.18,brake=.24;
    const speed=1/(1-(accel+brake)/2);
    const stroke=u<accel ? speed*u*u/(2*accel)
      : u>1-brake ? 1-speed*(1-u)*(1-u)/(2*brake)
      : speed*(u-accel/2);
    const preload=ramp(entry,.02,.055)*(1-ramp(entry,.07,.12));
    leaf.position.y=(diameter+.14)*stroke-.035*preload;
    lift.value=leaf.position.y;
    leaf.visible=u<1;
    gateLight.intensity=105*(1-ramp(u,.55,1));
    const gain=ramp(intro,0,1.55);sky.intensity=.20+gain*.85;shaftMaterial.uniforms.reveal.value=gain;
    trim.color.setRGB(.004,.045+gain*.52,.065+gain*.60);
    earth.rotation.y=-1.65+time*.031;earth.material.color.setScalar(.32+.53*ramp(intro,1.4,3)+.018*Math.sin(time*.5));
    flow.rotation.y=time*.19;flow.visible=intro>1.4;
  },dispose(){ground.dispose();map.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());},
  geometryCount:geometries.size,textureCount:2};
}

