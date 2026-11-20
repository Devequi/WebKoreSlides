import * as T from 'three';
import { CHAPTERS, NODE_COUNT, GROUP_COUNT, chapterPose, positionsFor, groupCenters, seed } from './presets';

export function createPerformanceUniverse(renderer,camera){
  const scene=new T.Scene();scene.fog=new T.FogExp2(0x0d0f18,.013);
  const geometries=new Set(),materials=new Set(),textures=new Set(),batches=[];
  const geometry=g=>(geometries.add(g),g),material=m=>(materials.add(m),m);
  scene.add(new T.HemisphereLight(0x8dd4ec,0x07111e,2));
  const key=new T.DirectionalLight(0x83c6ef,2.6);key.position.set(-12,18,14);scene.add(key);
  const rim=new T.PointLight(0x1f74d4,180,80,2);rim.position.set(18,8,-12);scene.add(rim);
  const fill=new T.PointLight(0x22d3ee,130,60,2);fill.position.set(-18,-2,8);scene.add(fill);
  const nodeMat=material(new T.MeshStandardMaterial({color:0x70c4d7,emissive:0x0a4356,emissiveIntensity:.7,metalness:.35,roughness:.34,transparent:true,opacity:1}));
  const coreMat=material(new T.MeshBasicMaterial({color:new T.Color(0x69e8fa).multiplyScalar(1.55),transparent:true,opacity:1}));
  const nodes=new T.InstancedMesh(geometry(new T.IcosahedronGeometry(.17,1)),nodeMat,NODE_COUNT);
  const cores=new T.InstancedMesh(geometry(new T.SphereGeometry(.075,6,5)),coreMat,NODE_COUNT);
  nodes.instanceMatrix.setUsage(T.DynamicDrawUsage);cores.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(nodes,cores);batches.push(nodes,cores);
  const shellMat=material(new T.MeshBasicMaterial({color:0x2ba8c6,transparent:true,opacity:.2,wireframe:true,depthWrite:false}));
  const shells=new T.InstancedMesh(geometry(new T.IcosahedronGeometry(1,0)),shellMat,GROUP_COUNT);shells.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(shells);batches.push(shells);
  const edges=[];for(let i=0;i<NODE_COUNT;i++)edges.push([i,Math.floor(i/12)*12+(i+1)%12]);
  for(let i=0;i<GROUP_COUNT;i++)for(let j=1;j<=2;j++)edges.push([i*12,((i+j)%GROUP_COUNT)*12]);
  const edgePositions=new Float32Array(edges.length*6),edgeColors=new Float32Array(edges.length*6);
  const edgeGeometry=geometry(new T.BufferGeometry());edgeGeometry.setAttribute('position',new T.BufferAttribute(edgePositions,3).setUsage(T.DynamicDrawUsage));edgeGeometry.setAttribute('color',new T.BufferAttribute(edgeColors,3).setUsage(T.DynamicDrawUsage));
  const edgeMat=material(new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.43,depthWrite:false}));
  const links=new T.LineSegments(edgeGeometry,edgeMat);links.frustumCulled=false;scene.add(links);

  const BAR_COUNT=36,barMat=material(new T.MeshStandardMaterial({color:0x176781,emissive:0x06354c,emissiveIntensity:.8,metalness:.3,roughness:.4,transparent:true,opacity:0}));
  const bars=new T.InstancedMesh(geometry(new T.BoxGeometry(1,1,1)),barMat,BAR_COUNT);bars.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(bars);batches.push(bars);
  const plateMat=material(new T.MeshStandardMaterial({color:0x1a4056,emissive:0x082733,metalness:.5,roughness:.35,transparent:true,opacity:0}));
  const plates=new T.InstancedMesh(geometry(new T.BoxGeometry(7,.32,5)),plateMat,3);plates.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(plates);batches.push(plates);
  const volumeGeometry=geometry(new T.BufferGeometry()),volumePositions=new Float32Array(NODE_COUNT*3),volumeIndices=[];
  for(let y=0;y<7;y++)for(let x=0;x<17;x++){const a=y*18+x;volumeIndices.push(a,a+1,a+18,a+1,a+19,a+18);}
  volumeGeometry.setAttribute('position',new T.BufferAttribute(volumePositions,3).setUsage(T.DynamicDrawUsage));volumeGeometry.setIndex(volumeIndices);
  const volumeMat=material(new T.MeshBasicMaterial({color:0x22bdd8,side:T.DoubleSide,transparent:true,opacity:0,depthWrite:false}));
  const surface=new T.Mesh(volumeGeometry,volumeMat);surface.frustumCulled=false;scene.add(surface);

  const ribbonGeometry=geometry(new T.BufferGeometry()),ribbonPositions=new Float32Array(4*65*2*3),ribbonUv=new Float32Array(4*65*2*2),ribbonIndices=[];
  for(let r=0;r<4;r++)for(let j=0;j<=64;j++){const v=r*130+j*2;ribbonUv.set([j/64,0,j/64,1],v*2);if(j<64)ribbonIndices.push(v,v+1,v+2,v+1,v+3,v+2);}
  ribbonGeometry.setAttribute('position',new T.BufferAttribute(ribbonPositions,3).setUsage(T.DynamicDrawUsage));ribbonGeometry.setAttribute('uv',new T.BufferAttribute(ribbonUv,2));ribbonGeometry.setIndex(ribbonIndices);
  const ribbonMat=material(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{time:{value:0},strength:{value:.5},fragmented:{value:0}},vertexShader:`varying vec2 vUv;varying float depth;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec2 vUv;varying float depth;uniform float time;uniform float strength;uniform float fragmented;void main(){float beam=pow(1.-abs(vUv.y-.5)*2.,2.);float pulse=exp(-pow((vUv.x-fract(time*.08))*18.,2.));float gaps=mix(1.,smoothstep(.35,.55,fract(vUv.x*9.)),fragmented);float fog=exp(-depth*.014);gl_FragColor=vec4(mix(vec3(.035,.26,.5),vec3(.1,.7,.86),vUv.x),beam*(.2+pulse*.55)*strength*gaps*fog);}`}));
  const ribbons=new T.Mesh(ribbonGeometry,ribbonMat);ribbons.frustumCulled=false;scene.add(ribbons);
  const runnerMat=material(new T.MeshBasicMaterial({color:new T.Color(0x96f3ff).multiplyScalar(1.6)}));
  const runners=new T.InstancedMesh(geometry(new T.SphereGeometry(.1,6,5)),runnerMat,4);scene.add(runners);batches.push(runners);

  const particleValues=new Float32Array(256*3);for(let i=0;i<256;i++)particleValues.set([(seed(i+11)-.5)*70,(seed(i+313)-.5)*42,-50+seed(i+721)*72],i*3);
  const particleGeometry=geometry(new T.BufferGeometry());particleGeometry.setAttribute('position',new T.BufferAttribute(particleValues,3));
  const particleMat=material(new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0},scatter:{value:0},opacity:{value:.6},pointer:{value:new T.Vector2()}},vertexShader:`uniform float time;uniform float scatter;uniform vec2 pointer;varying float fade;void main(){vec3 p=position;p.x+=sin(p.z*.12+time*.11)*(.22+scatter*.3)+pointer.x*.3;p.y+=cos(p.x*.17+time*.14)*.25+pointer.y*.2;vec4 mv=modelViewMatrix*vec4(p,1.);fade=exp(-abs(mv.z)*.012);gl_PointSize=clamp(52./max(1.,-mv.z),1.,3.3);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float opacity;varying float fade;void main(){float a=1.-smoothstep(.03,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.24,.66,.84,a*opacity*fade);}`}));
  scene.add(new T.Points(particleGeometry,particleMat));

  // One local atlas. Labels describe the actual stack; no numerical results are fabricated.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
  ['React · Vite','Node.js · Express','Prisma · MySQL'].forEach((text,i)=>{ctx.fillStyle='#c6edf6';ctx.font='500 44px "Space Grotesk","Segoe UI",sans-serif';ctx.fillText(text,28,i*160+63);ctx.fillStyle='#4f9db3';ctx.fillRect(28,i*160+85,450,2);ctx.font='22px "Segoe UI",sans-serif';ctx.fillText(['INTERFACE','API','DADOS'][i],28,i*160+124);});
  const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;textures.add(atlas);
  const labelGeometry=geometry(new T.BufferGeometry()),labelPositions=new Float32Array(36),uv=[],indices=[];
  for(let i=0;i<3;i++){const top=1-i*160/512,bottom=1-(i*160+140)/512;uv.push(0,top,.55,top,0,bottom,.55,bottom);const b=i*4;indices.push(b,b+2,b+1,b+1,b+2,b+3);}
  labelGeometry.setAttribute('position',new T.BufferAttribute(labelPositions,3).setUsage(T.DynamicDrawUsage));labelGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));labelGeometry.setIndex(indices);
  const labelMat=material(new T.MeshBasicMaterial({map:atlas,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));const labels=new T.Mesh(labelGeometry,labelMat);labels.frustumCulled=false;scene.add(labels);

  const current=positionsFor(1),from=new Float32Array(current),target=positionsFor(0);
  const fromCenters=groupCenters(1),centers=groupCenters(1),targetCenters=groupCenters(0);
  const state={index:0,step:0,pose:chapterPose(0),fromCamera:new T.Vector3(0,1,34),fromLook:new T.Vector3(0,0,-10),fromFov:62,started:performance.now(),duration:1200,progress:0,first:true};
  camera.position.copy(state.fromCamera);camera.lookAt(state.fromLook);camera.fov=62;
  const look=new T.Vector3(0,0,-10),eye=new T.Vector3(),via=new T.Vector3(),matrix=new T.Matrix4(),quaternion=new T.Quaternion(),scale=new T.Vector3(),position=new T.Vector3(),curvePoint=new T.Vector3();
  let disposed=false,barOpacity=0,shellOpacity=.12,plateOpacity=0,surfaceOpacity=0,connectionAmount=.64,orientation=0;
  const pathCache=Array.from({length:4},()=>Array.from({length:65},()=>new T.Vector3()));
  const driftColor=new T.Color();
  function setChapter(index,step=0,{immediate=false,replay=false}={}){
    if(disposed)return;
    from.set(current);target.set(positionsFor(index,step));
    const nextCenters=groupCenters(index,step);for(let i=0;i<GROUP_COUNT;i++){fromCenters[i]=[...centers[i]];targetCenters[i]=nextCenters[i];}
    state.fromCamera.copy(camera.position);state.fromLook.copy(look);state.fromFov=camera.fov;
    state.index=index;state.step=step;state.pose=chapterPose(index,step);state.started=performance.now();state.duration=index===9?1550:index===state.previousIndex?750:1150;state.progress=immediate?1:0;state.immediate=immediate;state.previousIndex=index;
    if(immediate){current.set(target);for(let i=0;i<GROUP_COUNT;i++)centers[i]=[...targetCenters[i]];camera.position.set(...state.pose.camera);look.set(...state.pose.look);camera.fov=state.pose.fov;}
  }
  function update({time,now=performance.now(),intro=3.4,reduced=false,pointer={x:0,y:0}}){
    const p=state.immediate||reduced?1:state.index===0?Math.min(1,intro/3.4):Math.min(1,(now-state.started)/state.duration);
    const t=T.MathUtils.smootherstep(p,0,1);state.progress=p;
    const pose=state.pose;
    const foreground=[1,.45,.42,.5,.55,.34,.34,.45,.5,.85][state.index];nodeMat.opacity=foreground;coreMat.opacity=foreground*.85;edgeMat.opacity=[0,9].includes(state.index)?.4:.2;
    for(let i=0;i<current.length;i++)current[i]=T.MathUtils.lerp(from[i],target[i],t);
    for(let i=0;i<GROUP_COUNT;i++)for(let k=0;k<3;k++)centers[i][k]=T.MathUtils.lerp(fromCenters[i][k],targetCenters[i][k],t);
    const end=eye.set(...pose.camera);via.copy(state.fromCamera).lerp(end,.5);
    via.y+=state.index===9?2:state.index===1?-.4:1.2;via.x+=state.index===2?2:state.index===5?-1:0;
    camera.position.copy(state.fromCamera).multiplyScalar((1-t)*(1-t)).addScaledVector(via,2*(1-t)*t).addScaledVector(end,t*t);
    look.set(...pose.look).lerp(state.fromLook,1-t);
    if(!reduced){camera.position.x+=pointer.x*.22+Math.sin(time*.055)*.035;camera.position.y+=pointer.y*.14;}
    camera.lookAt(look);camera.fov=T.MathUtils.lerp(state.fromFov,pose.fov,t);camera.updateProjectionMatrix();
    const reveal=state.index===0?T.MathUtils.smoothstep(intro,.1,1.7):1;
    connectionAmount=T.MathUtils.lerp(connectionAmount,pose.connections,reduced?1:.14);const connections=state.index===0?connectionAmount*T.MathUtils.smoothstep(intro,.65,2.4):connectionAmount;orientation=T.MathUtils.lerp(orientation,state.index*.18,reduced?1:.1);
    for(let i=0;i<NODE_COUNT;i++){
      const j=i*3,breath=reduced?0:Math.sin(time*.3+i*.7)*.035;
      position.set(current[j],current[j+1]+breath,current[j+2]);
      const active=state.index===3?(i%5)<=state.step:state.index===7?(i%4)<=state.step:state.index===5?Math.floor(i/48)===Math.min(state.step,2):true;
      const s=(active?1:.62)*(.28+.72*reveal);scale.setScalar(s);matrix.compose(position,quaternion,scale);nodes.setMatrixAt(i,matrix);cores.setMatrixAt(i,matrix);
      driftColor.set(active?0x8ed8e6:0x235363);nodes.setColorAt(i,driftColor);
    }
    nodes.instanceMatrix.needsUpdate=true;cores.instanceMatrix.needsUpdate=true;if(nodes.instanceColor)nodes.instanceColor.needsUpdate=true;
    for(let e=0;e<edges.length;e++){
      const [a,b]=edges[e],j=e*6;const enabled=seed(e+19)<connections;
      for(let k=0;k<3;k++){edgePositions[j+k]=current[a*3+k];edgePositions[j+3+k]=enabled?current[b*3+k]:T.MathUtils.lerp(current[a*3+k],current[b*3+k],.12);}
      const brightness=enabled?state.index===1?.2:.75:.045;
      edgeColors.set([.08*brightness,.62*brightness,.8*brightness,.06*brightness,.4*brightness,.64*brightness],j);
    }
    edgeGeometry.attributes.position.needsUpdate=true;edgeGeometry.attributes.color.needsUpdate=true;
    const shellGoal=[0,2,9].includes(state.index)?.19:state.index===4&&state.step===0?.18:.025;
    shellOpacity=T.MathUtils.lerp(shellOpacity,shellGoal,reduced?1:.15);shellMat.opacity=shellOpacity*reveal;
    for(let i=0;i<GROUP_COUNT;i++){position.set(...centers[i]);scale.setScalar(2.45);quaternion.setFromEuler(new T.Euler((i%3)*.35,orientation+i*.24,(i%2)*.3));matrix.compose(position,quaternion,scale);shells.setMatrixAt(i,matrix);}shells.instanceMatrix.needsUpdate=true;quaternion.identity();
    const chart=state.index===4&&[2,3].includes(state.step)||state.index===8;
    barOpacity=T.MathUtils.lerp(barOpacity,chart?.37:0,reduced?1:.15);barMat.opacity=barOpacity;bars.visible=barOpacity>.002;
    for(let i=0;i<BAR_COUNT;i++){const col=i%12,row=Math.floor(i/12),height=.8+seed(col+44)*4.8+(state.index===8?1.2:0);position.set((col-5.5)*2.5,-5+height/2,-17+row*5);scale.set(.55,height,.65);matrix.compose(position,quaternion,scale);bars.setMatrixAt(i,matrix);}bars.instanceMatrix.needsUpdate=true;
    const architecture=state.index===5||state.index===6;plateOpacity=T.MathUtils.lerp(plateOpacity,architecture?.34:0,reduced?1:.15);plateMat.opacity=plateOpacity;plates.visible=plateOpacity>.002;
    for(let i=0;i<3;i++){position.set((i-1)*12,-5.5,-i*7);scale.set(1,1,1);matrix.compose(position,quaternion,scale);plates.setMatrixAt(i,matrix);
      const j=i*12,cx=(i-1)*12,cy=7,cz=-i*7;labelPositions.set([cx-3.5,cy+1,cz,cx+3.5,cy+1,cz,cx-3.5,cy-1,cz,cx+3.5,cy-1,cz],j);
    }plates.instanceMatrix.needsUpdate=true;labelMat.opacity=plateOpacity*1.7;labels.visible=labelMat.opacity>.002;labelGeometry.attributes.position.needsUpdate=true;
    const surfaceGoal=state.index===4&&state.step===3?.095:0;surfaceOpacity=T.MathUtils.lerp(surfaceOpacity,surfaceGoal,reduced?1:.12);volumeMat.opacity=surfaceOpacity;surface.visible=surfaceOpacity>.002;volumePositions.set(current);volumeGeometry.attributes.position.needsUpdate=true;
    for(let r=0;r<4;r++){
      const a=centers[r*3],b=centers[(r*3+3)%12];
      for(let j=0;j<=64;j++){const f=j/64,arch=Math.sin(f*Math.PI)*(state.index===1?2:4);
        const x=T.MathUtils.lerp(a[0],b[0],f),y=T.MathUtils.lerp(a[1],b[1],f)+arch,z=T.MathUtils.lerp(a[2],b[2],f)-Math.sin(f*Math.PI)*(r%2?2:4);
        pathCache[r][j].set(x,y,z);const offset=(r*130+j*2)*3;ribbonPositions.set([x,y-.085,z,x,y+.085,z],offset);
      }
      const f=(time*(state.index===9?.012:.045)+r*.23)%1,idx=Math.min(63,Math.floor(f*64));curvePoint.copy(pathCache[r][idx]).lerp(pathCache[r][idx+1],f*64-idx);position.copy(curvePoint);scale.setScalar(reveal);matrix.compose(position,quaternion,scale);runners.setMatrixAt(r,matrix);
    }
    runners.instanceMatrix.needsUpdate=true;ribbonGeometry.attributes.position.needsUpdate=true;
    ribbonMat.uniforms.time.value=time;ribbonMat.uniforms.strength.value=(state.index===1?.22:.72)*reveal;ribbonMat.uniforms.fragmented.value=T.MathUtils.lerp(ribbonMat.uniforms.fragmented.value,pose.scatter,reduced?1:.12);
    particleMat.uniforms.time.value=time;particleMat.uniforms.scatter.value=T.MathUtils.lerp(particleMat.uniforms.scatter.value,pose.scatter,reduced?1:.1);particleMat.uniforms.pointer.value.set(pointer.x,pointer.y);particleMat.uniforms.opacity.value=(state.index===9?.34:.68)*(.2+.8*reveal);
    rim.intensity=state.index===1?110:180;fill.intensity=state.index===9?95:130;
  }
  function diagnostics(){let signature=2166136261;for(const n of current)signature=Math.imul(signature^Math.round(n*1000),16777619);return {chapter:state.index,step:state.step,progress:state.progress,pose:(signature>>>0).toString(16),camera:camera.position.toArray().map(n=>Math.round(n*1000)/1000).join(','),nodeCount:NODE_COUNT,geometryBudget:geometries.size,textureBudget:textures.size};}
  function dispose(){if(disposed)return;disposed=true;batches.forEach(b=>b.dispose());geometries.forEach(o=>o.dispose());materials.forEach(o=>o.dispose());textures.forEach(o=>o.dispose());scene.clear();}
  return {scene,setChapter,update,diagnostics,dispose};
}
