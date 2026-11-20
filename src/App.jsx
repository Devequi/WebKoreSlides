import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Grid2X2,
  Maximize,
  Minimize,
  Sparkles,
  RotateCcw,
  X,
  Clock3,
} from "lucide-react";
import { PerformanceUniverse } from "./components/PerformanceUniverse";
import { Presenter } from "./components/Presenter";
import { stages } from "./data/presenter";
import { slides } from "./data/content";
import { Scene } from "./slides/Scenes";
import { Boundary } from "./components/Visuals";
const fromHash = () =>
  Math.max(0, Math.min(9, (Math.trunc(Number(location.hash.replace("#", ""))) || 1) - 1));
export default function App() {
  const presenterWindow = new URLSearchParams(location.search).has("presenter");
  const embedded = new URLSearchParams(location.search).has("preview");
  const [arenaPhase, setArenaPhase] = useState(0), [arenaSkip, setArenaSkip] = useState(0);
  const [presenterPanel, setPresenterPanel] = useState(false);
  const travelLock=useRef(false);
  const [travelling,setTravelling]=useState(false);
  const onTravel=useCallback((moving, galleryFlight=false)=>{
    travelLock.current=moving;
    setTravelling(galleryFlight);
  },[]);
  const channel = useRef(null), steps = useRef(Array(10).fill(0));
  const [index, setIndex] = useState(fromHash),
    [step, setStep] = useState(() => Math.min(stages[fromHash()], Math.max(0, Math.trunc(Number(new URLSearchParams(location.search).get("step"))) || 0))),
    [menu, setMenu] = useState(false),
    [reduced, setReduced] = useState(false),
    [resetKey, setResetKey] = useState(0),
    [fullscreen, setFullscreen] = useState(false),
    [seconds, setSeconds] = useState(0),
    [notice, setNotice] = useState("");
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const menuRef = useRef(null),
    menuTrigger = useRef(null),
    heading = useRef(null),
    started = useRef(Date.now());
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const go = useCallback((n) => {
    if (travelLock.current && n === snapshot.current?.index) return;
    setIndex(Math.max(0, Math.min(9, n)));
    setStep(steps.current[Math.max(0, Math.min(9, n))]);
    setMenu(false);
    setResetKey((k) => k + 1);
  }, []);
  const restart = useCallback(() => {
    steps.current = Array(10).fill(0);
    go(0);
    setStep(0);
    started.current = Date.now();
    setSeconds(0);
  }, [go]);
  const reset = useCallback(() => {
    if(travelLock.current)return;
    setStep(0);
    setResetKey((k) => k + 1);
  }, []);
  useEffect(() => { steps.current[index] = step; }, [index, step]);
  const advance = useCallback((event) => {
    if(travelLock.current || event?.detail > 1)return;
    if (step < stages[index]) setStep(s => Math.min(stages[index], s + 1));
    else go(index + 1);
  }, [index, step, go]);
  const back = useCallback((event) => {
    if(travelLock.current || event?.detail > 1)return;
    if (step > 0) setStep(s => Math.max(0, s - 1));
    else if (index > 0) { const n = index - 1; steps.current[n] = stages[n]; go(n); }
  }, [index, step, go]);
  const snapshot = useRef(null);
  snapshot.current = { index, step, seconds, reduced: reduced || systemReduced };
  const commands = useRef(null);
  commands.current = { next: advance, back, reset, restart, go };
  useEffect(() => {
    if (embedded || presenterWindow || !('BroadcastChannel' in window)) return;
    const bus = new BroadcastChannel('webkore-presentation-v2'); channel.current = bus;
    bus.onmessage = ({data}) => {
      if (data.type === 'hello') bus.postMessage({type:'state', ...snapshot.current});
      if (data.type === 'command') { if (data.name === 'go') commands.current.go(data.index); else commands.current[data.name]?.(); }
    };
    return () => {bus.close();channel.current=null;};
  }, [embedded, presenterWindow]);
  useEffect(() => { channel.current?.postMessage({ type:'state', index, step, seconds, reduced: reduced || systemReduced }); }, [index, step, seconds, reduced, systemReduced]);
  function openPresenter() {
    if (!('BroadcastChannel' in window)) {setPresenterPanel(true);setNotice('Notas abertas nesta janela; sincronização não disponível.');return;}
    const url = new URL(location.href); url.search = '?presenter';
    const win = window.open(url, 'webkore-presenter', 'popup,width=1280,height=850');
    if (!win || !('BroadcastChannel' in window)) { setPresenterPanel(true); setNotice('Use o painel de notas nesta janela.'); }
  }
  useEffect(() => {
    history.replaceState(null, "", `#${index + 1}`);
    heading.current?.focus({ preventScroll: true });
  }, [index]);
  useEffect(() => {
    const handle = () => go(fromHash());
    addEventListener("hashchange", handle);
    return () => removeEventListener("hashchange", handle);
  }, [go]);
  useEffect(() => {
    const t = setInterval(
      () => setSeconds(Math.floor((Date.now() - started.current) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const fn = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector("button")?.focus();
    return () => menuTrigger.current?.focus();
  }, [menu]);
  useEffect(() => {
    function key(e) {
      if (presenterWindow || embedded) return;
      if (e.repeat) return;
      if (menu) {
        if (e.key === "Escape") {
          e.preventDefault();
          setMenu(false);
        }
        if (e.key === "Tab") {
          const items = [...menuRef.current.querySelectorAll("button")];
          if (e.shiftKey && document.activeElement === items[0]) {
            e.preventDefault();
            items.at(-1).focus();
          } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
            e.preventDefault();
            items[0].focus();
          }
        }
        return;
      }
      if (e.key === "Escape") {
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
        reset();
        return;
      }
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.target.closest('input,textarea,select,[contenteditable="true"]') ||
        (e.key === " " && e.target.closest("button,a"))
      )
        return;
      if (e.key === "Enter" && index === 0 && !e.target.closest("button,a")) {
        e.preventDefault();setArenaSkip(v => v + 1);return;
      }
      const keys = [
        "ArrowRight",
        "ArrowLeft",
        " ",
        "Home",
        "End",
        "r",
        "R",
        "e",
        "E",
        "n",
        "N",
      ];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Home") go(0);
      else if (e.key === "End") go(9);
      else if (e.key.toLowerCase() === "r") restart();
      else if (e.key.toLowerCase() === "e") reset();
      else if (e.key.toLowerCase() === "n") setPresenterPanel(v=>!v);
      else if (e.key === "ArrowLeft") {
        back();
      } else {
        advance();
      }
    }
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [index, step, menu, go, reset, restart, advance, back, presenterWindow, embedded]);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else setNotice("Utilize F11 para ativar tela cheia neste navegador.");
    } catch {
      setNotice("Tela cheia indisponível. Utilize F11 no navegador.");
    }
  }
  if (presenterWindow) return <Presenter />;
  return (
    <MotionConfig reducedMotion={reduced || systemReduced ? "always" : "never"}>
      <div
        data-gallery-flight={travelling ? index : undefined}
        data-arena-phase={arenaPhase}
        data-universe-chapter={index}
        className={`presentation ${embedded ? "embedded" : ""} ${reduced || systemReduced ? "reduced" : ""}`}
      >
        <PerformanceUniverse index={index} step={step} reduced={reduced || systemReduced || embedded} introSkip={arenaSkip} restartToken={resetKey} onPhase={setArenaPhase} onTravel={onTravel} />
        <header className="topbar">
          <a
            href="#1"
            onClick={(e) => {
              e.preventDefault();
              go(0);
            }}
            className="brand"
            aria-label="WebKore, primeiro slide"
          >
            <img src="./logo.png" alt="" /> <small>WEBKORE</small>
          </a>
          <span className="top-context">
            TRABALHO DE CONCLUSÃO DE CURSO <i /> {slides[index].name}
          </span>
          <div className="toolbar">
            <button title="Abrir controle em outra janela" aria-label="Modo do apresentador" onClick={openPresenter}>Notas</button>
            <button title="Notas nesta janela" aria-label="Notas nesta janela" onClick={()=>setPresenterPanel(v=>!v)}>N</button>
            <span className="timer" aria-label="Tempo decorrido">
              <Clock3 size={14} />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
            <button
              title="Reiniciar experiência (E)"
              aria-label="Reiniciar experiência"
              onClick={reset}
            >
              <RotateCcw size={17} />
            </button>
            <button
              title="Reduzir efeitos"
              aria-label="Reduzir efeitos"
              aria-pressed={reduced}
              onClick={() => setReduced((v) => !v)}
            >
              <Sparkles size={17} />
            </button>
            <button
              title="Tela cheia"
              aria-label="Tela cheia"
              aria-pressed={fullscreen}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              ref={menuTrigger}
              title="Menu dos 10 slides"
              aria-label="Menu dos 10 slides"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Grid2X2 size={18} />
            </button>
          </div>
        </header>
        <main>
          <AnimatePresence mode="sync" initial={false}>
            <motion.section
              key={index}
              inert={travelling || undefined}
              className={`slide slide-${index}`}
              aria-label={`Slide ${index + 1}: ${slides[index].name}`}
              initial={{ opacity: 0, x: index === 2 ? 0 : 24, y: [3,6,8].includes(index) ? 18 : 0, scale: index === 9 ? 0.97 : 1 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: index === 1 ? -32 : -12, y: index === 8 ? -14 : 0 }}
              transition={{ duration: reduced || systemReduced ? 0 : 0.24 }}
            >
              {index !== 0 && index !== 9 && (
                <div className="slide-heading">
                  <span className="eyebrow">
                    <span>{String(index + 1).padStart(2, "0")}</span> /{" "}
                    {slides[index].name.toUpperCase()}
                  </span>
                  <h2 ref={heading} tabIndex={-1}>
                    {slides[index].title}
                  </h2>
                </div>
              )}
              <Boundary key={`${index}-${resetKey}`}>
                <Scene
                  index={index}
                  introPhase={arenaPhase}
                  skipIntro={() => setArenaSkip(v => v + 1)}
                  step={step}
                  setStep={setStep}
                  resetKey={resetKey}
                  next={advance}
                />
              </Boundary>
            </motion.section>
          </AnimatePresence>
        </main>
        <footer className="bottom-bar">
          <div className="footer-left">
            <span className="slide-number" aria-live="polite">
              {String(index + 1).padStart(2, "0")}
              <span> / 10</span>
            </span>
            <button className="chapter-button" onClick={() => setMenu(true)}>
              {slides[index].name}
              <Grid2X2 size={14} />
            </button>
          </div>
          <nav className="progress" aria-label="Acesso direto aos slides">
            {slides.map((s) => (
              <button
                key={s.id}
                className={
                  index === s.id ? "active" : index > s.id ? "visited" : ""
                }
                aria-label={`Ir ao slide ${s.id + 1}: ${s.name}`}
                aria-current={index === s.id ? "step" : undefined}
                onClick={() => go(s.id)}
              >
                <i />
              </button>
            ))}
          </nav>
          <div className="footer-right">
            <span className="key-hint">
              {stages[index] ? `${step + 1}/${stages[index] + 1} · SPACE avança` : "← → · navegar"}
            </span>
            <button
              aria-label="Slide anterior"
              disabled={index === 0 && step === 0}
              onClick={back}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="next-slide"
              aria-label="Próximo slide"
              disabled={index === 9}
              onClick={advance}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </footer>
        {presenterPanel && <aside className="inline-notes"><button aria-label="Fechar notas" onClick={()=>setPresenterPanel(false)}>Fechar</button><Presenter inline state={{index,step,seconds}} command={(name)=>commands.current[name]?.()} /></aside>}
        {notice && (
          <button
            className="notice"
            role="status"
            onClick={() => setNotice("")}
          >
            {notice} <X size={14} />
          </button>
        )}
        {menu && (
          <div className="menu-backdrop" onClick={() => setMenu(false)}>
            <div
              ref={menuRef}
              className="chapter-menu"
              role="dialog"
              aria-modal="true"
              aria-labelledby="menu-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="menu-heading">
                <div>
                  <span className="eyebrow">A APRESENTAÇÃO</span>
                  <h2 id="menu-title">Dez capítulos. Uma trajetória.</h2>
                </div>
                <button aria-label="Fechar menu" onClick={() => setMenu(false)}>
                  <X />
                </button>
              </div>
              <div className="chapter-grid">
                {slides.map((s) => (
                  <button
                    className={index === s.id ? "active" : ""}
                    key={s.id}
                    onClick={() => go(s.id)}
                  >
                    <span>{String(s.id + 1).padStart(2, "0")}</span>
                    <strong>{s.name}</strong>
                    <small>{s.title}</small>
                  </button>
                ))}
              </div>
              <p>
                ← → / SPACE: navegar · HOME / END: início e fim · R: reiniciar ·
                E: reiniciar experiência · ESC: fechar
              </p>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
