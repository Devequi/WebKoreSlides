// Deterministic poses. A return to a chapter reconstructs exactly the same composition.
export const NODE_COUNT = 144;
export const GROUP_COUNT = 12;
export const CHAPTERS = [
  {name:'Surgimento',camera:[0,3.5,24],look:[0,0,-8],fov:56,connections:.64,scatter:.12},
  {name:'Fragmentação',camera:[-8,2,25],look:[0,0,-7],fov:62,connections:.18,scatter:1},
  {name:'Convergência',camera:[5,5,23],look:[0,0,-7],fov:54,connections:.92,scatter:0},
  {name:'Jornada',camera:[-4,4,25],look:[0,0,-7],fov:57,connections:.78,scatter:0},
  {name:'Funcionalidades',camera:[7,5,25],look:[0,0,-7],fov:56,connections:.8,scatter:0},
  {name:'Arquitetura',camera:[-7,6,26],look:[0,0,-7],fov:55,connections:.95,scatter:0},
  {name:'Dados e segurança',camera:[9,7,26],look:[0,0,-8],fov:56,connections:.88,scatter:0},
  {name:'Desenvolvimento',camera:[-9,6,27],look:[0,0,-8],fov:58,connections:.72,scatter:0},
  {name:'Resultados e futuro',camera:[3,8,31],look:[0,0,-8],fov:55,connections:.98,scatter:0},
  {name:'Ecossistema',camera:[0,6,39],look:[0,0,-8],fov:52,connections:1,scatter:0},
];
export const seed = (n) => {const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
export function chapterPose(index,step=0){
  const base=CHAPTERS[index];const pose={...base,camera:[...base.camera],look:[...base.look],step,index};
  if(index===3){pose.camera[0]+=step*1.5;pose.camera[2]-=step*.65;}
  if(index===4){const views=[[7,5,25],[-5,7,26],[4,8,23],[-6,4,26],[3,8,29]];pose.camera=[...views[step]];}
  if(index===5){pose.camera[0]+=(step===3?0:step)*5;pose.camera[2]-=Math.min(step,2)*2;}
  if(index===6){pose.camera[1]+=step*.65;pose.camera[0]-=step*1.4;}
  if(index===7){pose.camera[0]+=step*3;pose.camera[2]-=step*.9;}
  if(index===8&&step){pose.camera[2]+=3;pose.camera[0]-=3;}
  return pose;
}
export function nodePosition(index,step,i){
  const group=Math.floor(i/12),local=i%12,a=local/12*Math.PI*2;
  let x,y,z;
  if(index===1){x=(seed(i+2)-.5)*47;y=(seed(i+203)-.5)*25;z=-9+(seed(i+503)-.5)*44;}
  else if(index===3||(index===4&&step===1)||index===7){
    const count=index===7?4:5,g=i%count,j=Math.floor(i/count),angle=j*.93;
    x=-17+g*(34/(count-1))+Math.cos(angle)*1.8;y=-4+g*2+Math.sin(angle)*1.8;z=8-g*8+(j%4)*.65;
  } else if(index===5){
    const g=Math.floor(i/48),j=i%48,angle=j/12*Math.PI*2;
    x=(g-1)*12+Math.cos(angle)*(2.1+(j%3)*.45);y=-4+Math.floor(j/12)*2.2+Math.sin(angle)*.6;z=-g*7+Math.sin(angle)*2.6;
  } else if(index===6){
    const layer=Math.floor(i/36),j=i%36;
    x=(j%6-2.5)*5;y=-5+layer*3.5;z=-18+Math.floor(j/6)*5+(layer%2)*1.4;
  } else if(index===4&&step===2){
    const col=i%12,row=Math.floor(i/12);x=(col-5.5)*2.6;y=-5+(row/11)*(2+seed(col+40)*8);z=-19+row*2.2;
  } else if(index===4&&step===3){
    const col=i%18,row=Math.floor(i/18);x=(col-8.5)*2;y=-3+col*.32+Math.sin(col*.45+row*.5)*1.8;z=-22+row*4;
  } else if((index===4&&step===4)||(index===8&&step===1)){
    const g=Math.floor(i/48),j=i%48;const angle=-Math.PI*.75+g*Math.PI*.75;
    x=Math.cos(angle)*(7+(j%8)*1.6);y=-3+Math.floor(j/8)*1.8;z=-10+Math.sin(angle)*(7+(j%8)*1.6);
  } else {
    const angle=group/GROUP_COUNT*Math.PI*2;
    const radius=index===9?15:index===0?16:13;
    const cx=Math.cos(angle)*radius,cy=Math.sin(angle*2)*5,cz=-10+Math.sin(angle)*13;
    x=cx+Math.cos(a)*2.1+([0,9].includes(index)?(cx>=0?9:-9):0);y=cy+Math.sin(a)*2.1;z=cz+(local%3-1)*1.6;
    if(index===0){y+=Math.sin(group*.8)*2;z+=(group%2)*3;}
    if(index===2){x*=.93;y*=.85;}
    if(index===8){y+=Math.sin(angle)*2.5;}
  }
  return [x,y,z];
}
export function positionsFor(index,step=0){const values=new Float32Array(NODE_COUNT*3);for(let i=0;i<NODE_COUNT;i++)values.set(nodePosition(index,step,i),i*3);return values;}
export function groupCenters(index,step=0){const nodes=positionsFor(index,step),centers=[];for(let g=0;g<GROUP_COUNT;g++){const c=[0,0,0];for(let j=0;j<12;j++)for(let k=0;k<3;k++)c[k]+=nodes[(g*12+j)*3+k]/12;centers.push(c);}return centers;}
