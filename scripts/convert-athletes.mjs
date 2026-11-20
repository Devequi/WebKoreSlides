import {readdir, readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Offline geometry/animation conversion. The installation supplies its own material.
globalThis.window = globalThis;
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend();
  }
};
const directory = new URL('../public/models/', import.meta.url);
const baseFile = 'Ch45_nonPBR.fbx';
const filenames = await readdir(directory);
const sources = [baseFile, ...filenames.filter(f => f.endsWith('.fbx') && f !== baseFile).sort()];
let base, signature;
const clips = [];
for (const filename of sources) {
  const bytes = await readFile(new URL(filename,directory));
  const source = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const meshes = [];
  source.traverse(node => { if(node.isSkinnedMesh) meshes.push(node); });
  assert.equal(meshes.length,1);
  const mesh = meshes[0];
  const hash = createHash('sha256');
  for(const key of ['position','normal','skinIndex','skinWeight']) hash.update(Buffer.from(mesh.geometry.attributes[key].array.buffer));
  hash.update(JSON.stringify(mesh.skeleton.bones.map((bone,i)=>[bone.name,bone.parent.name,mesh.skeleton.boneInverses[i].elements])));
  const id = hash.digest('hex');
  if(filename===baseFile){
    base=source; signature=id;
    mesh.geometry.deleteAttribute('uv');
    mesh.geometry.clearGroups();
    mesh.geometry=mergeVertices(mesh.geometry,1e-5);
    mesh.material=new THREE.MeshStandardMaterial();
    base.traverse(node => { node.userData={}; });
  } else {
    assert.equal(id,signature,'Character or bind pose changed in '+filename);
  }
  for(const clip of source.animations){
    if(!clip.tracks.length) continue;
    const moving=clip.tracks.some(track=>track.values.some((v,i)=>Math.abs(v-track.values[i%track.getValueSize()])>1e-4));
    console.log(filename,mesh.skeleton.bones.length,'bones',clip.duration,'seconds',moving?'animated':'static');
    if(moving){clip.name=filename.replace('.fbx','');clips.push(clip.optimize());}
  }
}
base.animations=[];
const glb=await new GLTFExporter().parseAsync(base,{binary:true,animations:clips,onlyVisible:false});
await writeFile(new URL('webkore-athlete.glb',directory),new Uint8Array(glb));
console.log(clips.map(c=>c.name),glb.byteLength,'bytes');
