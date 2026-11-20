import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

const panelClips = ['Offensive Idle','Defeated','Soccer Idle','Header Soccerball','Offensive Idle','Soccer Idle'];

const exhibitHeights=[4.88,5.04,4.77,4.96,4.84,4.92];
const exhibitPhases=[.38,.59,.22,.41,.74,.81];

function hologram(fragmented) {
  const uniforms = { gain:{value:1}, scatter:{value:0} };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>
      ${fragmented ? 'attribute float stratum;' : ''}
      uniform float scatter;
      varying vec3 viewNormal, viewDirection;
      varying float height;
      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        ${fragmented ? 'transformed += scatter * vec3(19.0*sin(stratum*2.4), stratum*2.4, 13.0*cos(stratum*1.7));' : ''}
        #include <project_vertex>
        viewNormal = transformedNormal;
        viewDirection = -mvPosition.xyz;
        height = transformed.y;
      }`,
    fragmentShader: `
      uniform float gain;
      varying vec3 viewNormal, viewDirection;
      varying float height;
      void main() {
        vec3 n = normalize(viewNormal);
        float rim = pow(1.0 - abs(dot(n,normalize(viewDirection))), 2.3);
        float light = max(dot(n,normalize(vec3(-.55,.75,.6))),0.0);
        float scan = .5 + .5*cos(height*2.2);
        vec3 color = mix(vec3(.012,.074,.107),vec3(.10,.62,.72),light*light);
        color += rim*vec3(.18,.78,.91) + scan*.018;
        ${fragmented ? '' : `
          // Fixed gallery lighting on skinned normals gives the face, chest and
          // far shoulder different values as the athlete moves through a pose.
          vec3 key = normalize(mat3(viewMatrix)*vec3(-.82,.68,.38));
          vec3 eye = normalize(viewDirection);
          float diffuse = max(dot(n,key),0.);
          float sheen = pow(max(dot(n,normalize(key+eye)),0.),22.);
          color = vec3(.008,.035,.054) + diffuse*vec3(.055,.36,.43)
                + sheen*vec3(.17,.37,.38) + rim*vec3(.055,.28,.34)
                + scan*.005;
        `}
        gl_FragColor = vec4(color * gain,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  return material;
}

// Give each triangle of the original skinned surface one band. The same
// vertices reassemble exactly when scatter returns to zero.
function stratify(source) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const pos = geometry.attributes.position;
  geometry.computeBoundingBox();
  const {min,max} = geometry.boundingBox;
  const bands = new Float32Array(pos.count);
  for(let i=0;i<pos.count;i+=3){
    const y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3;
    const band=Math.min(10,Math.floor((y-min.y)*11/(max.y-min.y)));
    bands.fill(band,i,i+3);
  }
  geometry.setAttribute('stratum',new THREE.BufferAttribute(bands,1));
  return geometry;
}

export function createAthletes(panels, pedestal, invalidate) {
  const panelMaterial=hologram(false), centralMaterial=hologram(true);
  const actors=[], geometries=new Set(), skeletons=new Set();
  const controller=new AbortController();
  let started=false, disposed=false, ready=false;

  async function load(){
    const response=await fetch('./models/webkore-athlete.glb',{signal:controller.signal});
    if(!response.ok)throw Error('GLB HTTP '+response.status);
    const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
    gltf.scene.traverse(node=>{
      if(node.isSkinnedMesh){
        geometries.add(node.geometry);skeletons.add(node.skeleton);
        node.material.dispose();
      }
    });
    if(disposed){releaseAssets();return;}
    const clips=new Map(gltf.animations.map(c=>[c.name,c]));
    const anchors=[...panels,pedestal];
    for(const [index,anchor] of anchors.entries()){
      const central=anchor===pedestal;
      const root=clone(gltf.scene);
      root.name='Atleta '+(index+1);
      root.traverse(mesh=>{
        if(!mesh.isSkinnedMesh)return;
        skeletons.add(mesh.skeleton);
        mesh.geometry.computeBoundingBox();
        const bounds=mesh.geometry.boundingBox;
        root.scale.setScalar((central?10:exhibitHeights[index])/(bounds.max.y-bounds.min.y));
        mesh.material=central?centralMaterial:panelMaterial;
        if(central){mesh.geometry=stratify(mesh.geometry);geometries.add(mesh.geometry);}
        // Rest-pose bounds do not include a jump or separated strata.
        mesh.frustumCulled=false;
      });
      anchor.add(root);
      const mixer=new THREE.AnimationMixer(root);
      const clip=clips.get(central?'Header Soccerball':panelClips[index]);
      const action=mixer.clipAction(clip).play();
      actors.push({root,mixer,action,offset:clip.duration*(central?((index*.27+.13)%1):exhibitPhases[index]),central});
    }
    ready=true;
    invalidate();
  }
  function releaseAssets(){
    skeletons.forEach(s=>s.dispose());geometries.forEach(g=>g.dispose());
    skeletons.clear();geometries.clear();
  }
  return {
    update({time,panelsVisible,centralVisible,centralGain=1,gain,scatter}){
      if(!started){started=true;load().catch(e=>{if(!disposed)console.warn('WebKore: atletas indisponíveis.',e.message);});}
      panelMaterial.uniforms.gain.value=gain;
      centralMaterial.uniforms.scatter.value=scatter;
      centralMaterial.uniforms.gain.value=centralGain;
      for(const actor of actors){
        if(actor.central?centralVisible:panelsVisible)actor.mixer.setTime(time+actor.offset);
      }
    },
    get count(){return ready?actors.length:0;},
    dispose(){
      disposed=true;controller.abort();
      for(const {root,mixer} of actors){mixer.stopAllAction();mixer.uncacheRoot(root);root.removeFromParent();}
      actors.length=0;releaseAssets();panelMaterial.dispose();centralMaterial.dispose();
    }
  };
}
