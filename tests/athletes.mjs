import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Group,Vector3,Box3} from 'three';
import {createAthletes} from '../src/components/universe/createAthletes.js';

const bytes=await readFile(new URL('../public/models/webkore-athlete.glb',import.meta.url));
const panels=Array.from({length:6},()=>new Group());
const pedestal=new Group();
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{
  assert.equal(url,'./models/webkore-athlete.glb');
  return new Response(bytes);
};
let loaded;
const ready=new Promise(resolve=>{loaded=resolve;});
const athletes=createAthletes(panels,pedestal,loaded);
const anchors=[...panels,pedestal];
const opts={time:0,panelsVisible:true,centralVisible:true,gain:1,scatter:0};
function sample(anchor){
  anchor.updateMatrixWorld(true);
  let mesh;
  anchor.traverse(node=>{if(node.isSkinnedMesh)mesh=node;});
  const points=[];
  for(let i=0;i<mesh.geometry.attributes.position.count;i+=200){
    points.push(mesh.localToWorld(mesh.getVertexPosition(i,new Vector3())));
  }
  return points;
}
try{
  athletes.update(opts);await ready;
  assert.equal(athletes.count,7);
  athletes.update(opts);const before=anchors.map(sample);
  athletes.update({...opts,time:.72});
  const after=anchors.map(sample);
  for(const [i,points] of after.entries()){
    const movement=Math.max(...points.map((p,j)=>p.distanceTo(before[i][j])));
    assert.ok(movement>.03,'No deformation for actor '+i);
    const size=new Box3().setFromPoints(points).getSize(new Vector3());
    assert.ok(size.y>(i===6?5:2.5) && size.y<(i===6?14:8));
    console.log('Actor',i+1,'deformed',movement.toFixed(3),'m; height',size.y.toFixed(2),'m');
  }
  athletes.update(opts);
  anchors.map(sample).forEach((points,i)=>points.forEach((p,j)=>assert.ok(p.distanceTo(before[i][j])<1e-5)));
}finally{athletes.dispose();globalThis.fetch=originalFetch;}
anchors.forEach(anchor=>assert.equal(anchor.children.length,0));
