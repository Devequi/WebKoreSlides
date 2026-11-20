import { useState, useEffect } from "react";
import { screens } from "../data/screens";
import { motion } from "motion/react";
import {
  ClipboardList,
  Files,
  ChartNoAxesCombined,
  Check,
  ShieldCheck,
  Database,
  Monitor,
  Server,
  Play,
  RotateCcw,
  ChevronRight,
  Download,
  GitBranch,
} from "lucide-react";
import {
  problems,
  journey,
  features,
  architecture,
  methodology,
  challenges,
  results,
  future,
} from "../data/content";
import { DemoTag } from "../components/Visuals";
export function Scene({ index, step, setStep, resetKey, next, introPhase=4, skipIntro }) {
  const selected = index === 4 ? step : index === 5 ? Math.min(step, 2) : step;
  const select = setStep;
  const [playing, setPlaying] = useState(false), [delay, setDelay] = useState(3500);
  const request = index === 5 ? step + 1 : 0;
  useEffect(() => {
    setPlaying(false);
  }, [index, resetKey]);
  useEffect(() => {
    if (!playing || index !== 5) return;
    if (step >= 3) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(v => Math.min(3,v + 1)), delay);
    return () => clearTimeout(timer);
  }, [playing,index,step,delay,setStep]);
  const icons = [Monitor, Server, Database];
  if(index===0)return <div className="hero rotunda-opening" data-phase={introPhase}>
    <div className="rotunda-title">
      <img src="./logo.png" alt="Logo original WebKore"/>
      <h1>WEBKORE</h1><i aria-hidden="true"/>
      <p>GERENCIAMENTO · TREINO · EVOLUÇÃO</p>
      <button className="rotunda-start" disabled={introPhase<3} onClick={next}><Play size={16} fill="currentColor"/> Iniciar apresentação</button>
    </div>
    {introPhase<4 && <button className="rotunda-skip" onClick={skipIntro}>Pular abertura</button>}
  </div>;
  if(index===9)return <div className="hero cinematic-hero closing hero-closing">
    <div className="cinematic-copy"><div className="cinematic-identity"><motion.img layoutId="webkore-identity" transition={{duration:.35}} src="./logo.png" alt="Logo original WebKore"/><span>DO REGISTRO À COMPREENSÃO</span></div>
    <h1>WEB<span>KORE</span></h1><div className="cinematic-rule"/><h2>Informação que acompanha<br/><span>a evolução.</span></h2><p className="cinematic-description">Obrigado. Vamos às perguntas.</p></div>
    <div className="cinematic-credits"><span>TRABALHO DE CONCLUSÃO DE CURSO</span><p>Felipe Devequi <i/> Arthur Sousa Santos</p></div>
  </div>;
  if (index === 1)
    return <div className="museum-content museum-problem">
      <p className="problem-context">Sem um histórico centralizado, informações de treinos e avaliações podem ficar dispersas, dificultando uma visão contínua do desempenho dos atletas.</p>
      <div className="problem-panels">
        {problems.map(problem=>{
          const Icon=problem.icon==='files'?Files:ChartNoAxesCombined;
          return <article className="problem-panel" key={problem.title}>
            <Icon size={22} aria-hidden="true"/>
            <div><h3>{problem.title}</h3><p>{problem.text}</p></div>
          </article>;
        })}
      </div>
      <p className="problem-conclusion">A necessidade: transformar registros isolados em acompanhamento contínuo.</p>
    </div>;
  if (index === 2)
    return <div className="museum-content museum-solution">
      <p className="solution-context">O WebKore reúne treinos, avaliações e histórico de desempenho em uma única plataforma, conectando treinadores e atletas.</p>
      <div className="solution-benefits">
        <article><ClipboardList aria-hidden="true"/><h3>Registro centralizado</h3><p>Treinos, presenças e avaliações organizados por equipe.</p></article>
        <article><ChartNoAxesCombined aria-hidden="true"/><h3>Evolução mensurável</h3><p>Históricos e indicadores para acompanhar o desempenho.</p></article>
      </div>
      <section className="solution-profiles" aria-labelledby="solution-profiles-title">
        <h3 id="solution-profiles-title">Dois perfis conectados</h3>
        <dl><div><dt>Treinador</dt><dd>Organiza equipes, registra treinos e avalia atletas.</dd></div>
          <div><dt>Atleta</dt><dd>Consulta avaliações e acompanha seu histórico.</dd></div></dl>
      </section>
    </div>;
  if (index === 3)
    return (
      <div className="journey-layout">
        <div
          className="journey-steps"
          role="tablist"
          aria-label="Etapas da jornada"
        >
          {journey.map((s, i) => (
            <button
              role="tab"
              aria-selected={step === i}
              key={s.name}
              className={step === i ? "active" : step > i ? "complete" : ""}
              onClick={() => setStep(i)}
            >
              <span>
                {step > i ? (
                  <Check size={16} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {s.name}
            </button>
          ))}
        </div>
        <div className="journey-main">
          <div className="journey-copy">
            <span className="eyebrow">
              {journey[step].role} · ETAPA {step + 1} DE 5
            </span>
            <h3>{journey[step].title}</h3>
            <p>{journey[step].text}</p>
            <code className="state-code">{journey[step].status}</code>
            <button
              className="primary"
              onClick={() => (step < 4 ? setStep(step + 1) : next())}
            >
              {journey[step].action}
              <ChevronRight size={18} />
            </button>
            <div className="inline-controls">
              <button disabled={step === 0} onClick={() => setStep(step - 1)}>
                Etapa anterior
              </button>
              <button aria-label="Reiniciar jornada" onClick={() => setStep(0)}>
                <RotateCcw size={15} />
              </button>
            </div>
            <small>
              SPACE / → percorrem as etapas.
              <br />O botão inferior segue a mesma sequência.
            </small>
          </div>
          <motion.div
            initial={{ opacity: 0.5, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="demo-wrap"
          >
            <ProductCapture name={['entrada','solicitacao','treinos','avaliacao','evolucao'][step]} label={journey[step].name} />
            <div className="demo-progress-state" role="status">{['Solicitação enviada · Pendente','Vínculo aprovado pelo treinador','Treino misto registrado · Presença confirmada','Avaliação registrada · Média ilustrativa 8,0','Histórico atualizado · Notas ilustrativas: 6,0 → 7,0 → 8,0'][step]}</div>
          </motion.div>
        </div>
      </div>
    );
  if (index === 4)
    return (
      <div className="features-layout">
        <div
          className="feature-menu"
          role="tablist"
          aria-label="Funcionalidades"
        >
          {features.map((f, i) => (
            <button
              role="tab"
              aria-selected={selected === i}
              className={selected === i ? "active" : ""}
              key={f.name}
              onClick={() => select(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {f.name}
              <ChevronRight size={17} />
            </button>
          ))}
          <div className="feature-description">
            <h3>{features[selected].title}</h3>
            <p>{features[selected].text}</p>
            {selected === 4 && (
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(
                    new Blob(
                      [
                        "\uFEFFEquipe;Atleta;Presença;Média\nHorizonte;Atleta Demo;Presente;8,0",
                      ],
                      { type: "text/csv;charset=utf-8" },
                    ),
                  );
                  a.download = "webkore-demonstracao.csv";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                }}
              >
                <Download size={16} /> Baixar exemplo CSV
              </button>
            )}
          </div>
        </div>
        <div className="feature-stage">
          <ProductCapture name={['equipes','treinos','avaliacao','evolucao','evolucao'][selected]} label={features[selected].name} />
          <p className="capture-caption">Interface real · cenário demonstrativo de futsal</p>
        </div>
      </div>
    );
  if (index === 5)
    return (
      <div className="architecture-layout">
        <div className="architecture-flow">
          {architecture.map((a, i) => {
            const Icon = icons[i];
            return (
              <motion.button
                layoutId={i===2?"data-structure":undefined}
                transition={{duration:.32}}
                key={a.name}
                className={`architecture-node ${selected === i ? "active" : ""} ${(step===3?i===0:request===i+1) ? "pulse" : ""}`}
                onClick={() => select(i)}
              >
                <Icon size={40} />
                <span>{a.name}</span>
                <small>{a.tech}</small>
                {i < 2 && <i className="connector" />}
              </motion.button>
            );
          })}
        </div>
        <div className="architecture-details">
          <div>
            <span className="eyebrow">{architecture[selected].tech}</span>
            <h3>{architecture[selected].name}</h3>
            <p>{architecture[selected].text}</p>
            <span className="source">{architecture[selected].files}</span>
          </div>
          <div className="request-box">
            <span className="eyebrow">REQUISIÇÃO REAL · SIMULAÇÃO LOCAL</span>
            <code>GET /api/trainings/team/:teamId</code>
            <p role="status">
              {
                [
                  "Cliente envia Bearer token.",
                  "API verifica sessão e escopo da equipe.",
                  "Prisma consulta os treinos e registros permitidos.",
                  "200 · Resposta serializada para a interface.",
                 ][step]
              }
            </p>
            <div className="request-track">
              {["CLIENTE", "API", "MYSQL", "RESPOSTA"].map((x, i) => (
                <span key={x} className={request > i ? "lit" : ""}>
                  {x}
                </span>
              ))}
            </div>
            <div className="simulation-controls"><button onClick={() => setPlaying(v=>!v)}>{playing ? 'Pausar' : 'Reproduzir'}</button><button onClick={() => {setStep(0);setPlaying(false);}}>Repetir</button><label>Tempo por etapa <select aria-label="Tempo por etapa" value={delay} onChange={e=>setDelay(Number(e.target.value))}><option value={2500}>2,5 s</option><option value={3500}>3,5 s</option><option value={5000}>5 s</option></select></label></div>
          </div>
        </div>
      </div>
    );
  if (index === 6)
    return <div className="data-security-layout">
      <motion.div layoutId="data-structure" transition={{duration:.32}} className="data-map"><span className="eyebrow">DADOS · MODELO SIMPLIFICADO</span><div className="relation-row"><div><strong>User</strong><span>Treinador / atleta</span></div><b>1 : N</b><div><strong>Team</strong><span>Equipe do treinador</span></div></div><p className="membership-link">Membership liga atleta e equipe · pendente / aprovado</p>
      <div className={`record-chain reveal-block ${step>=1?'shown':''}`} aria-hidden={step<1}><div><strong>Team</strong><span>1 : N · treinos</span></div><div><strong>Training</strong><span>1 : N · registros</span></div><div><strong>TrainingRecord</strong><span>0..1 · avaliação</span></div><div><strong>Evaluation</strong><span>Critérios preservados</span></div></div>
      <p className={`snapshot-note reveal-block ${step>=1?'shown':''}`}>Snapshots preservam os critérios e a posição usados na avaliação.</p></motion.div>
      <div className={`security-summary reveal-block ${step>=2?'shown':''}`} aria-hidden={step<2}><span className="eyebrow">SEGURANÇA · ACESSO COM CONTEXTO</span><h3>Identificar. Autorizar. Delimitar.</h3>{[['Autenticação','JWT, sessão persistida e senha com hash bcrypt.'],['Autorização e rotas','API verifica perfil, sessão e permissão.'],['Isolamento dos dados','Treinador: suas equipes. Atleta: seus próprios registros.']].map(([t,d])=><div className="security-rule" key={t}><ShieldCheck/><div><strong>{t}</strong><p>{d}</p></div></div>)}<p className="permission-line">401 · sem sessão válida &nbsp; 403 · ação não permitida</p></div>
    </div>;
  if (index === 7)
    return <div className="development-layout"><div className="development-timeline">{methodology.map((m,i)=><div className={`development-phase ${step>=i?'shown':'pending'}`} key={m.name} aria-hidden={step<i}><motion.span layoutId={i===3?"milestone-delivered":undefined} className="phase-marker">{step>i?<Check/>:i+1}</motion.span><h3>{m.name==='Requisitos'?'Levantamento de requisitos':m.name}</h3><p>{['Definir o escopo e as necessidades de treinador e atleta.','Organizar entidades, vínculos e histórico.','Conectar interface, regras e persistência.','Verificar regras de acesso, avaliações e exportações.'][i]}</p></div>)}</div><div className="development-challenges"><span className="eyebrow">DESAFIOS E SOLUÇÕES</span>{challenges.map(([t,d],i)=><div key={t} className={`reveal-block ${step>=Math.min(i+1,3)?'shown':''}`}><GitBranch/><strong>{t}</strong><p>{d}</p></div>)}</div></div>;
  if (index === 8)
    return (
      <div className="results-layout">
        <div className="delivered">
          <motion.span layoutId="milestone-delivered" transition={{duration:.32}} className="badge">IMPLEMENTADO NO CÓDIGO</motion.span>
          <h3>Um ciclo de acompanhamento.</h3>
          <ul>
            {results.map((r) => (
              <li key={r}>
                <Check size={20} />
                {r}
              </li>
            ))}
          </ul>
          <div className="limitations">
            <strong>Limites atuais</strong>
            <p>
              Produto dependente da API e do banco.
              <br />
              Exportação atual em CSV.
            </p>
          </div>
        </div>
        <div className={`roadmap reveal-block ${step ? "shown" : ""}`} aria-hidden={!step}>
          <span className="eyebrow">
            POSSIBILIDADES FUTURAS · SEM PRAZO ASSUMIDO
          </span>
          {future.map(([title, text], i) => (
            <div key={title}>
              <span className="roadmap-node">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}

        </div>
      </div>
    );
  return null;
}

function ProductCapture({name,label}) {
 return <motion.div layoutId="connected-records" transition={{duration:.3}} className={`real-product capture-${name}`}><div className="browser-chrome"><span/><span/><span/><p>WebKore / {label}</p><small>DEMONSTRAÇÃO</small></div><motion.img key={name} initial={{opacity:.5,y:6}} animate={{opacity:1,y:0}} transition={{duration:.2}} src={screens[name]} alt={`Tela real do WebKore: ${label}, com dados fictícios`} /><div className="capture-foot">Captura do sistema local · dados fictícios · sem acesso ao banco</div></motion.div>;
}
