import * as T from 'three';

export const featureViews=[
  [39,3.8,-46],[40.2,4.1,-47.5],[40.8,4.4,-49],[41,4.1,-50.5],[40.5,4,-52],
];
export const featureLook=[44,6,-74];
const curve=points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
export const featureRoute=curve([[37,4.4,-3],[38,4.3,-9],[41,4,-21],[42,3.8,-32],featureViews[0]]);
export const featureGaze=curve([[39,5.2,-28],[41,5.3,-33],[44,5.6,-46],[44,5.8,-60],featureLook]);

// Continue the nave through its rear arch. The raised right bank curves towards the beacon.
export function buildFeatureHall({fixed,arc,box,stone,metal,floor,geo,mat,pulse,group}){
  const glaze=mat(new T.MeshStandardMaterial({color:0x193e48,metalness:.48,roughness:.25}));
  const frost=mat(new T.MeshBasicMaterial({color:0x62e4f4}));
  const span=86, start=-42;
  fixed(box,floor,[53,-.12,-45-span/2],[60,.28,span]);
  const rib=arc(16,1.3,1.4,0,Math.PI), lip=arc(15.3,.08,.20,0,Math.PI);
  const axis=i=>40+i*1.95+.17*i*i;
  const granite=mat(new T.MeshStandardMaterial({color:0x24444e,metalness:.32,roughness:.43}));
  const drum=geo(new T.CylinderGeometry(1,1,1,64));
  for(let i=0;i<10;i++){
    const z=start-i*8.4, x=axis(i);
    fixed(rib,granite,[x,.18,z],[1,1,1],[Math.PI/2,0,0]);
    fixed(lip,pulse,[x,.18,z+.75],[1,1,1],[Math.PI/2,0,0]);
    for(const side of [-1,1]){
      const edge=x+side*13;
      const next=axis(i+1)+side*13, angle=-Math.atan2(next-edge,8.4);
      const mid=(edge+next)/2;
      fixed(box,metal,[mid+side*2.2,8,z-4.2],[.6,16.4,Math.hypot(next-edge,8.4)+.32],[0,angle,0]);
      fixed(box,stone,[edge+side*.8,2.25,z],[1.15,4.5,1.3]);
      fixed(box,frost,[edge-side*.03,2.65,z+.69],[.10,.58,.05]);
      fixed(box,glaze,[mid,4.6,z-4.2],[3.4,.52,Math.hypot(next-edge,8.4)+.25],[0,angle,0]);
      for(const h of [4.45,5.85])fixed(box,h>5?metal:pulse,[mid-side*1.68,h,z-4.2],[.065,.075,Math.hypot(next-edge,8.4)+.15],[0,angle,0]);
      for(const t of [0,.5])fixed(box,metal,[edge+(next-edge)*t-side*1.68,5.25,z-8.4*t],[.065,1.28,.065]);
    }
    if(i%3===1){
      const cx=x+7.4;
      for(const [radius,height] of [[6.2,12.8],[4.2,11.8]]){
        fixed(arc(radius,.75,.65),metal,[cx,height,z]);
        fixed(arc(radius-.33,.09,.09),pulse,[cx,height-.35,z]);
      }
      for(let j=0;j<6;j++){
        const a=j*Math.PI/3;
        fixed(box,glaze,[cx+3.4*Math.cos(a),10.9,z+3.4*Math.sin(a)],[1.4,.65,1.1],[0,-a,0]);
      }
      fixed(drum,glaze,[cx,.18,z],[4.65,.36,4.65]);
      fixed(drum,metal,[cx,.47,z],[3.65,.27,3.65]);
      fixed(arc(3.62,.07,.06),pulse,[cx,.62,z]);
      fixed(arc(4.4,.44,.36),glaze,[cx,.23,z]);
      fixed(arc(4.6,.055,.04),frost,[cx,.42,z]);
    }
  }
  for(const side of [-1,1])for(let k=0;k<4;k++){
    const path=curve(Array.from({length:12},(_,i)=>[axis(i)+side*(7+.29*k+Math.sin(i*.6)*1.7),.05+.022*k,start+4-8.4*i]));
    fixed(geo(new T.TubeGeometry(path,60,.018+k*.003,4,false)),pulse);
  }
  const uplight=new T.PointLight(0x69d6f3,440,46,1.55);
  uplight.position.set(50,5,-53);group.add(uplight);
  const distant=new T.PointLight(0x38dbf5,260,45,1.5);
  distant.position.set(62,2.5,-98);group.add(distant);
  // Light scattered around the far opening. Its falloff extends into the surrounding haze.
  const power={value:1};
  const beacon=mat(new T.ShaderMaterial({
    uniforms:{power},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:'varying vec2 v;void main(){v=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 v;uniform float power;void main(){float d=length(v)*2.;float glow=exp(-5.*d*d)*.35+exp(-230.*d*d)*.62;gl_FragColor=vec4(.13,.85,1.,power*glow*(1.-smoothstep(.75,1.,d)));}'
  }));
  fixed(geo(new T.PlaneGeometry(34,27)),beacon,[axis(9),3,-124]);
  return seconds=>{power.value=.96+.04*Math.sin(seconds*.5);};
}
