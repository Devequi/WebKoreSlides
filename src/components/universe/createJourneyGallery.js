import {buildFeatureHall} from './createFeatureHall';
import * as T from 'three';

// The aisle passes under the east balcony, then opens onto a second vaulted nave.
const spline = points => new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
export const journeyRoute = spline([[12.8,4.5,16.5],[16,4,14],[21,3.8,12],[27,4.1,11],[34,4.6,6],[37,4.4,-3]]);
export const journeyGaze = spline([[-1,7,-6],[12,5,7],[29,4.6,11],[36,5,1],[38,5,-13],[39,5.2,-28]]);

export function createJourneyGallery({fixed,arc,box,stone,metal,floor,geo,mat}) {
  const group = new T.Group();
  fixed(box,floor,[38,-.08,-12],[31,.2,66]);
  fixed(box,metal,[53,8,-12],[1,17,66]);

  const rib = arc(14,.85,1.25,0,Math.PI);
  const trim = arc(13.54,.065,.1,0,Math.PI);
  const time = {value:0};
  const pulse = mat(new T.ShaderMaterial({
    uniforms:{time},vertexShader:'varying vec3 local; void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 local; uniform float time; void main(){float wave=.5+.5*cos(local.x*.28+local.z*.12-time*.65);gl_FragColor=vec4(vec3(.025,.33,.42)+vec3(.06,.38,.43)*pow(wave,6.),1.);}',
  }));
  for(let i=0;i<7;i++){
    const z=8-i*8, x=38+Math.sin(i*.55)*1.4;
    fixed(rib,stone,[x,.3,z],[1,1,1],[Math.PI/2,0,0]);
    fixed(trim,pulse,[x,.3,z+.65],[1,1,1],[Math.PI/2,0,0]);
  }
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const points=Array.from({length:10},(_,j)=>[38+side*(8+i*.25+2*Math.sin(j*.55)),.12+i*.07+j*j*.008,17-j*6.5]);
      fixed(geo(new T.TubeGeometry(spline(points),48,.023,4,false)),pulse);
    }
  }
  const updateHall=buildFeatureHall({fixed,arc,box,stone,metal,floor,geo,mat,pulse,group});
  const coords=Array.from({length:32},(_,i)=>[27+(i*17%251)/12,1+(i*23%91)/13,12-(i*19%93)*1.3]).flat();
  const dust=geo(new T.BufferGeometry());
  dust.setAttribute('position',new T.Float32BufferAttribute(coords,3));
  const motes=new T.Points(dust,mat(new T.PointsMaterial({color:0x54bfcf,size:.045,transparent:true,opacity:.45,depthWrite:false})));
  group.add(motes);
  const wash=new T.PointLight(0x5ccad8,230,45,1.65);
  wash.position.set(37,10,-13);group.add(wash);
  return {group,update(seconds,aspect){time.value=seconds;updateHall(seconds);motes.position.y=.18*Math.sin(seconds*.21);dust.setDrawRange(0,aspect<1?12:32);}};
}
