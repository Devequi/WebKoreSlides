import { useEffect, useRef, useState } from 'react';
import { slides } from '../data/content';
import { notes, stages, stageNames } from '../data/presenter';
export function Presenter({inline=false,state:provided,command:localCommand}) {
 const [remote,setRemote]=useState(null),[connected,setConnected]=useState(false),bus=useRef(null);
 useEffect(()=>{if(inline)return;try{const channel=new BroadcastChannel('webkore-presentation-v2');bus.current=channel;channel.onmessage=({data})=>{if(data.type==='state'){setRemote(data);setConnected(true);}};channel.postMessage({type:'hello'});const ping=setInterval(()=>{setConnected(false);channel.postMessage({type:'hello'});},4000);return()=>{clearInterval(ping);channel.close();};}catch{}},[inline]);
 const state=provided||remote||{index:0,step:0,seconds:0};
 const {index,step,seconds}=state;
 const send=(name)=>inline?localCommand(name):bus.current?.postMessage({type:'command',name});
 const preview=(n,current)=>`?preview&noWebGL&step=${current?step:0}#${n+1}`;
 return <div className={`presenter-view ${inline?'inline':''}`}><header><h1>Controle do apresentador</h1><strong>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong></header>{!inline&&<p role="status">{connected?'Sincronizado localmente':'Aguardando a janela de projeção. Se necessário, use N na janela principal para abrir as notas.'}</p>}
 {!inline&&<div className="presenter-previews"><figure><figcaption>Atual · {index+1}/10 · {slides[index].name}</figcaption><Preview title="Slide atual" src={preview(index,true)} /></figure><figure><figcaption>{index===9?'Encerramento':`Próximo capítulo · ${slides[index+1].name}`}</figcaption><Preview title="Próximo slide" src={preview(Math.min(index+1,9))}/></figure></div>}
 <div className="presenter-notes"><h2>{slides[index].title}</h2>{index!==2&&<p>Etapa {step+1} de {stages[index]+1} · {stageNames[index][step]||slides[index].name}</p>}<ul>{notes[index].map(n=><li key={n}>{n}</li>)}</ul><p><strong>Próximo comando:</strong> {step<stages[index]?stageNames[index][step+1]:index<9?slides[index+1].name:'Permanecer no encerramento'}</p></div>
 <nav><button onClick={()=>send('back')}>{index===2?'Slide anterior':'Voltar etapa'}</button><button className="primary" onClick={()=>send('next')}>{index===2?'Próximo slide':'Avançar etapa'}</button>{index!==2&&<button onClick={()=>send('reset')}>Reiniciar demonstração</button>}<button onClick={()=>send('restart')}>Reiniciar apresentação</button></nav></div>;
}

function Preview({title,src}) {
 const ref=useRef(null),[scale,setScale]=useState(.4);
 useEffect(()=>{const observer=new ResizeObserver(([e])=>setScale(e.contentRect.width/1366));observer.observe(ref.current);return()=>observer.disconnect();},[]);
 return <div className="preview-frame" ref={ref}><iframe title={title} key={src} src={src} style={{width:1366,height:768,transform:`scale(${scale})`,transformOrigin:'top left'}}/></div>;
}
