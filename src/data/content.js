export const slides = [
  ["Abertura", "Cada treino conta. Cada evolução importa."],
  ["O problema", "O desafio não é apenas registrar. É acompanhar a evolução."],
  ["A solução", "Do registro à decisão."],
  ["Jornada do usuário", "Uma equipe. Um fluxo conectado."],
  ["Funcionalidades", "O produto, de perto."],
  ["Arquitetura", "Cada camada tem um propósito."],
  ["Dados e segurança", "Conectar dados. Delimitar acessos."],
  ["Desenvolvimento", "Da modelagem à experiência."],
  ["Resultados e futuro", "Uma base concreta. Novos caminhos."],
  ["Conclusão", "Informação que acompanha a evolução."],
].map(([name, title], id) => ({ id, name, title }));
export const problems = [
  {
    title: "Dados fragmentados",
    text: "Registros espalhados dificultam a consulta e a comparação.",
    icon: "files",
  },
  {
    title: "Evolução pouco visível",
    text: "Sem histórico organizado, identificar tendências exige mais esforço.",
    icon: "chart",
  },
];
export const journey = [
  {
    name: "Entrada",
    role: "ATLETA",
    title: "Um código conecta a equipe.",
    text: "O atleta busca a equipe pelo código e envia sua solicitação.",
    status: "PENDING",
    action: "Enviar solicitação",
  },
  {
    name: "Aprovação",
    role: "TREINADOR",
    title: "O treinador autoriza o vínculo.",
    text: "A solicitação passa de pendente para aprovada.",
    status: "APPROVED",
    action: "Aprovar atleta",
  },
  {
    name: "Treinamento",
    role: "TREINADOR",
    title: "O treino ganha um registro.",
    text: "Data, tipo, descrição e presença ficam associados à equipe.",
    status: "PRESENTE",
    action: "Registrar treino",
  },
  {
    name: "Avaliação",
    role: "TREINADOR",
    title: "Critérios transformam observações.",
    text: "Notas e medidas respeitam o perfil esportivo do atleta.",
    status: "AVALIADO",
    action: "Salvar avaliação",
  },
  {
    name: "Acompanhamento",
    role: "ATLETA",
    title: "O histórico revela a evolução.",
    text: "O atleta consulta seus próprios registros e indicadores.",
    status: "DISPONÍVEL",
    action: "Concluir demonstração",
  },
];
export const features = [
  {
    name: "Equipes",
    title: "Organização desde a entrada.",
    text: "Código de acesso, solicitações e vínculos aprovados. Cada treinador gerencia suas próprias equipes.",
    source:
      "src/paginas/treinador/LobbyTreinador.jsx · server/src/rotas/times.rotas.js",
  },
  {
    name: "Treinos",
    title: "O registro de cada treinamento.",
    text: "Treinos físicos, coletivos, mistos e jogos. Controle de presença e histórico expansível.",
    source:
      "src/paginas/treinador/treinamentosPagina.jsx · server/src/rotas/treinamentos.rotas.js",
  },
  {
    name: "Avaliações",
    title: "Perfis diferentes. Critérios próprios.",
    text: "No futsal, linha e goleiro possuem perfis de avaliação. Critérios são configuráveis; novas avaliações usam média aritmética.",
    source: "shared/evaluations.js · src/componentes/ui/AvaliacaoPosicao.jsx",
  },
  {
    name: "Evolução",
    title: "Uma trajetória que pode ser consultada.",
    text: "Gráficos individuais e da equipe, médias e histórico. O atleta consulta apenas seus próprios registros.",
    source:
      "src/componentes/charts/GraficoEvolucaoEquipe.jsx · src/utils/individualEvolution.js",
  },
  {
    name: "Relatórios",
    title: "Do histórico para uma planilha.",
    text: "Exportação CSV com presença, notas e critérios registrados. Campos são escapados para reduzir execução de fórmulas.",
    source: "src/services/reports.js · downloadTeamReport",
  },
];
export const architecture = [
  {
    name: "Interface",
    tech: "React 19 · Vite 7 · Recharts",
    text: "Páginas de treinador e atleta, componentes reutilizáveis e gráficos. Serviços HTTP conectam a interface à API.",
    files: "src/hooks/useWebKoreData.js · src/services/api.js",
  },
  {
    name: "API",
    tech: "Node.js · Express 4",
    text: "Rotas de autenticação, equipes e treinos. Middlewares verificam a sessão, validam entradas e aplicam limites de requisição.",
    files: "server/src/aplicativo.js · server/src/rotas/",
  },
  {
    name: "Dados",
    tech: "Prisma 6 · MySQL",
    text: "Modelos relacionais preservam vínculos, treinos e avaliações. Snapshots mantêm os critérios históricos independentes da configuração atual.",
    files: "prisma/schema.prisma · server/src/lib/avaliacoes.js",
  },
];
export const models = [
  {
    name: "User",
    fields: "id · role · passwordHash · authVersion",
    text: "Conta de treinador ou atleta. Possui sessões e vínculos; o treinador é proprietário das equipes.",
    related: ["Team", "Membership"],
    relation: "User 1:N Team (coach) · User 1:N Membership",
  },
  {
    name: "Team",
    fields: "id · coachId · code · modality",
    text: "Agrupa treinos, vínculos e perfis de avaliação sob a responsabilidade de um treinador.",
    related: ["User", "Membership", "Training"],
    relation: "Team 1:N Membership · Team 1:N Training",
  },
  {
    name: "Membership",
    fields: "teamId · athleteId · status · position",
    text: "Relaciona atleta e equipe; combinação única de teamId e athleteId. Estados PENDING, APPROVED e REJECTED.",
    related: ["User", "Team"],
    relation: "User 1:N Membership N:1 Team",
  },
  {
    name: "Training",
    fields: "id · teamId · date · type",
    text: "Treino de uma equipe, composto pelos registros individuais de presença e desempenho.",
    related: ["Team", "TrainingRecord"],
    relation: "Team 1:N Training · Training 1:N TrainingRecord",
  },
  {
    name: "TrainingRecord",
    fields: "trainingId · athleteId · present",
    text: "Registro único por treino e atleta. Contém snapshots de posição/perfil, medidas e avaliação opcional. athleteId é escalar sem FK para User.",
    related: ["Training", "Evaluation"],
    relation: "Training 1:N TrainingRecord · TrainingRecord 1:0..1 Evaluation",
  },
  {
    name: "Evaluation",
    fields: "recordId · finalScore · criteria",
    text: "Avaliação com critérios registrados como snapshots: nome, nota e peso são preservados.",
    related: ["TrainingRecord"],
    relation: "Evaluation 1:N EvaluationCriterion",
  },
];
export const methodology = [
  {
    name: "Requisitos",
    title: "Definir a finalidade.",
    text: "Escopo, requisitos funcionais e não funcionais, análises SWOT e PESTEL constam na documentação.",
    source: "Documentação/engenharia/ · Documentação/analise-mercado/",
  },
  {
    name: "Modelagem",
    title: "Preservar a história.",
    text: "Schema e migrations expressam a modelagem. Snapshots separam avaliações antigas de critérios que podem mudar.",
    source: "prisma/schema.prisma · prisma/migrations/",
  },
  {
    name: "Implementação",
    title: "Separar responsabilidades.",
    text: "Páginas e componentes React, serviços HTTP, regras compartilhadas e rotas Express organizam o sistema.",
    source: "src/ · shared/ · server/src/",
  },
  {
    name: "Verificação",
    title: "Tornar regras verificáveis.",
    text: "Há testes de sessão, CSV, avaliações, posições e acesso, além de um harness Playwright. Sua existência não comprova aprovação de toda a suíte.",
    source: "tests/ · qa/ct20/",
  },
];
export const challenges = [
  ["Histórico confiável", "Snapshots de critérios e posição."],
  ["Privacidade por perfil", "Filtros por proprietário, vínculo e atleta."],
  ["Regras de avaliação", "Perfis de linha/goleiro e critérios configuráveis."],
];
export const results = [
  "Equipes e vínculos com aprovação",
  "Treinos, presença e avaliações",
  "Gráficos individuais e da equipe",
  "Perfis de linha e goleiro no futsal",
  "Exportação de relatórios CSV",
];
export const future = [
  [
    "Integração com inteligência artificial",
    "Possibilidade futura para apoiar a interpretação dos registros.",
  ],
  [
    "Suporte a funcionamento offline",
    "Possível evolução que exige planejamento de sincronização e consistência dos dados.",
  ],
  [
    "Evolução dos relatórios",
    "Avaliar PDF e relatórios adicionais conforme a necessidade.",
  ],
];
export const demoSeries = [6.1, 6.8, 6.5, 7.4, 7.8, 8.2].map((nota, i) => ({
  treino: `T${i + 1}`,
  nota,
}));
export const demoCriteria = [
  { name: "Posicionamento", score: 8, weight: 25 },
  { name: "Tomada de decisão", score: 7, weight: 25 },
  { name: "Trabalho em equipe", score: 9, weight: 25 },
  { name: "Disciplina tática", score: 8, weight: 25 },
];
export const conclusion = [
  "Organizar o acompanhamento esportivo",
  "Conectar treinador e atleta com permissões próprias",
  "Transformar registros em histórico e visualizações",
];
