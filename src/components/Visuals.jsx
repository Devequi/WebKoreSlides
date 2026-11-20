import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Check,
  Users,
  CalendarDays,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { demoSeries, demoCriteria } from "../data/content";

export class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fallback">
        <h3>Visualização indisponível</h3>
        <p>
          {this.props.description ||
            "Reinicie esta experiência pelo botão superior ou continue usando a navegação."}
        </p>
        <button onClick={() => this.setState({ error: false })}>
          Tentar novamente
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function Chart() {
  return (
    <Boundary description="Dados demonstrativos: T1 6,1; T2 6,8; T3 6,5; T4 7,4; T5 7,8; T6 8,2. A navegação permanece disponível.">
      <div
        className="chart"
        role="img"
        aria-label="Dados demonstrativos: notas dos treinos T1 a T6: 6,1; 6,8; 6,5; 7,4; 7,8; 8,2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={demoSeries}
            margin={{ top: 18, right: 20, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#263247" />
            <XAxis
              dataKey="treino"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 5, 10]}
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#131a25",
                border: "1px solid #263247",
                borderRadius: 8,
              }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="nota"
              name="Nota"
              stroke="#22d3ee"
              strokeWidth={3}
              fill="url(#chartFill)"
              dot={{ r: 4, fill: "#22d3ee" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Boundary>
  );
}
export function Court({ final = false }) {
  return (
    <div className={`court ${final ? "final-court" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 700 500">
        <path d="M60 70H640V430H60Z M350 70V430" />
        <circle cx="350" cy="250" r="70" />
        <circle cx="350" cy="250" r="5" />
        <path d="M60 155H140V345H60 M640 155H560V345H640 M60 195H95V305H60 M640 195H605V305H640" />
        <path className="route" d="M125 330L240 285L350 250L455 180L575 220" />
        {[
          [125, 330],
          [240, 285],
          [350, 250],
          [455, 180],
          [575, 220],
        ].map(([x, y], i) => (
          <g key={x}>
            <circle className="player-halo" cx={x} cy={y} r="23" />
            <circle className="player" cx={x} cy={y} r="7" />
            <text x={x + 18} y={y - 15}>
              {
                ["REGISTRO", "PRESENÇA", "AVALIAÇÃO", "HISTÓRICO", "EVOLUÇÃO"][
                  i
                ]
              }
            </text>
          </g>
        ))}
      </svg>
      <span className="court-label">A EVOLUÇÃO TEM UM PONTO DE PARTIDA.</span>
    </div>
  );
}
export function DemoTag() {
  return (
    <span className="demo-tag">Dados demonstrativos · simulação local</span>
  );
}
export function ProductPanel({ mode = 0, step = 4, score = 8, onScore }) {
  return (
    <div className={`product product-mode-${mode}`}>
      <div className="product-bar">
        <span className="mini-brand">
          W<span>K</span>
        </span>
        <span>
          WebKore <span className="dim">/ Equipe Horizonte</span>
        </span>
        <span className="avatar">D</span>
      </div>
      <div className="product-body">
        <aside className="product-side">
          <Users />
          <CalendarDays />
          <Activity />
          <ShieldCheck />
        </aside>
        <div className="product-content">
          <div className="product-heading">
            <div>
              <span className="eyebrow">FUTSAL · EQUIPE DEMONSTRATIVA</span>
              <h3>
                {
                  [
                    "Visão da equipe",
                    "Histórico de treinos",
                    "Avaliação por perfil",
                    "Evolução do atleta",
                    "Relatório da equipe",
                  ][mode]
                }
              </h3>
            </div>
            <span className="badge">{step < 1 ? "Pendente" : "Aprovado"}</span>
          </div>
          {mode === 0 ? (
            <>
              <div className="team-hero">
                <Users size={38} />
                <div>
                  <h3>Equipe Horizonte</h3>
                  <p>Treinador Demo · Futsal</p>
                </div>
                <code>WK-DEMO</code>
              </div>
              <div className="table-row">
                <span className="avatar">AD</span>
                <div>
                  <strong>Atleta Demo</strong>
                  <small>Jogador de linha · Ala</small>
                </div>
                <span className={`badge ${step === 0 ? "warning" : ""}`}>
                  {step === 0 ? (
                    "Aguardando aprovação"
                  ) : (
                    <>
                      <Check size={14} /> Vínculo aprovado
                    </>
                  )}
                </span>
              </div>
              <div className="mini-stats">
                <div>
                  <b>{step >= 2 ? "1" : "0"}</b>
                  <span>treino registrado</span>
                </div>
                <div>
                  <b>{step >= 3 ? "8,0" : "—"}</b>
                  <span>nota demonstrativa</span>
                </div>
              </div>
            </>
          ) : mode === 1 ? (
            <>
              <div className="table-head">
                <span>DATA / TIPO</span>
                <span>PRESENÇA</span>
                <span>AVALIAÇÃO</span>
              </div>
              {(step === 2 ? ["18 NOV"] : ["18 NOV", "16 NOV", "13 NOV"]).map(
                (date, i) => (
                  <div className="table-row" key={date}>
                    <CalendarDays />
                    <div>
                      <strong>{date} · Treino misto</strong>
                      <small>Fundamentos e jogo coletivo</small>
                    </div>
                    <span className="badge">Presente</span>
                    <b>{[8, 7, 6][i]},0</b>
                  </div>
                ),
              )}
            </>
          ) : mode === 2 ? (
            <>
              <div className="profile-tabs">
                <span className="badge">Linha</span>
                <span>Goleiro possui perfil próprio</span>
              </div>
              {demoCriteria.map((c, i) => (
                <div className="criterion" key={c.name}>
                  <span>
                    {c.name} <small>Peso {c.weight}%</small>
                  </span>
                  {i === 0 && onScore ? (
                    <input
                      aria-label="Nota de posicionamento"
                      type="range"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => onScore(+e.target.value)}
                    />
                  ) : (
                    <div className="meter">
                      <i style={{ width: `${c.score * 10}%` }} />
                    </div>
                  )}
                  <b>{i === 0 ? score : c.score}</b>
                </div>
              ))}
              <p className="score">
                Média aritmética{" "}
                <strong>
                  {((score * 25 + 7 * 25 + 9 * 25 + 8 * 25) / 100)
                    .toFixed(1)
                    .replace(".", ",")}
                </strong>
              </p>
            </>
          ) : mode === 3 ? (
            <>
              <div className="mini-stats">
                <div>
                  <b>6</b>
                  <span>treinos de exemplo</span>
                </div>
                <div>
                  <b>8,2</b>
                  <span>última nota</span>
                </div>
              </div>
              <Chart />
            </>
          ) : (
            <>
              <div className="file-preview">
                <span>.CSV</span>
                <h3>Histórico exportável</h3>
                <p>Equipe; Atleta; Data; Presença; Média</p>
              </div>
              <div className="table-row">
                <span>Horizonte</span>
                <span>Atleta Demo</span>
                <span>Presente</span>
                <b>8,0</b>
              </div>
              <p className="dim">
                O produto exporta CSV. Esta prévia usa apenas dados locais.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="product-foot">
        <DemoTag />
        <span>Representação da interface</span>
      </div>
    </div>
  );
}
