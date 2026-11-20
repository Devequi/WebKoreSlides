import * as T from 'three';
import {createPerformanceUniverse} from './createPerformanceUniverse';
import {createMuseum} from './createMuseum';

// One renderer / one root scene. The first five chapters share the museum.
export function createPresentationWorld(renderer,camera,invalidate){
  const original=createPerformanceUniverse(renderer,camera),museum=createMuseum(camera,renderer,invalidate);
  const scene=new T.Scene(),originalGroup=new T.Group(),museumGroup=new T.Group();
  originalGroup.add(...original.scene.children.slice());museumGroup.add(...museum.scene.children.slice());scene.add(originalGroup,museumGroup);
  let previous=-1,active=original;
  function setChapter(index,step,options){
    const inMuseum=index>=0&&index<=4;active=inMuseum?museum:original;
    originalGroup.visible=!inMuseum;museumGroup.visible=inMuseum;
    scene.fog=active.scene.fog;scene.background=inMuseum?new T.Color(0x0b1820):null;
    renderer.shadowMap.enabled=inMuseum && index!==0;renderer.shadowMap.type=T.PCFShadowMap;
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=inMuseum;
    active.setChapter(index,step,{...options,previous});previous=index;
  }
  return {scene,setChapter,update:args=>active.update(args),diagnostics:()=>{const d=active.diagnostics(),a=original.diagnostics(),b=museum.diagnostics();return {...d,geometryBudget:a.geometryBudget+b.geometryBudget+1,textureBudget:a.textureBudget+b.textureBudget+4};},dispose(){original.dispose();museum.dispose();scene.clear();}};
}
