# WebKore Performance Universe — plano e implementação

> Registro da implementação anterior. Para o protótipo atual dos slides 02 e 03, consulte [MUSEU-PROTOTIPO.md](MUSEU-PROTOTIPO.md).

## Direção e preservação

A cena da abertura é expandida para uma experiência compartilhada pelos dez capítulos. O domínio visual representa movimento, equipes, treinamento, avaliações e informação, sem quadra ou modalidade dominante. O futsal permanece somente nas capturas reais e nas funcionalidades específicas documentadas do produto, identificado como cenário demonstrativo.

Preservados: React/Vite, Motion, dez slides, conteúdo acadêmico e técnico, screenshots, navegação por teclado e menu, etapas internas, simulação da API, CSV, fullscreen e apresentador. O WebKore original é fonte de consulta e não recebe alterações.

Referências fornecidas: [Noomo](https://noomoagency.com/), [Lando Norris](https://landonorris.com/) e [Bruno Simon](https://bruno-simon.com/). Foram consultadas como referência de narrativa e experiência interativa, sem copiar código ou assets. [Nocturnal Dream](https://nocturnaldream.web.app/) não ficou acessível na ferramenta de pesquisa nesta revisão.

## Mapa narrativo

| Slide | Conteúdo preservado | Transformação espacial |
| --- | --- | --- |
| 01 | Surgimento, marca e identificação do TCC | Nós dispersos convergem em agrupamentos; trajetórias e partículas acendem; dolly de entrada. |
| 02 | Problema de acompanhamento | Nós se dispersam em profundidade, conexões se fragmentam e a câmera viaja lateralmente. |
| 03 | Solução e relação treinador/atleta | Rede se reorganiza em agrupamentos conectados; câmera se aproxima pelo lado oposto. |
| 04 | Jornada real em cinco etapas | Formação temporal espacial; avanço interno move a câmera e destaca grupos. |
| 05 | Equipes, treinos, avaliações, evolução e relatórios | Agrupamentos, sequência, barras volumétricas, superfície de evolução e ramificações. Cada etapa tem pose e câmera próprias. |
| 06 | React/Vite, Express e Prisma/MySQL | Três componentes conectados, plataformas e rótulos da stack; etapas da requisição percorrem os componentes. |
| 07 | Dados e segurança | Nós formam camadas e relações; a câmera desloca-se entre níveis conforme as revelações. |
| 08 | Requisitos, modelagem, implementação e verificação | Quatro marcos em profundidade; travelling acompanha as etapas documentadas. |
| 09 | Resultados e possibilidades futuras | Ecossistema organizado; ramificações representam IA, offline e relatórios, sem datas ou resultados fictícios. |
| 10 | Conclusão, marca e integrantes | Afastamento revela a rede completa; movimento ambiental mais discreto. |

## Arquitetura da experiência

- PerformanceUniverse.jsx: único renderizador, canvas fixo de viewport inteira, ciclo de vida, mouse discreto, preferência de movimento e pós-processamento adaptável.
- universe/presets.js: poses determinísticas de todos os capítulos e etapas, sem aleatoriedade acumulada.
- universe/createPerformanceUniverse.js: os mesmos buffers e objetos interpolam suas posições. Não há troca de cenas nem criação de renderizadores por capítulo.
- App.jsx: transmite slide e etapa ao mundo e preserva o controlador existente. Menu e retorno comandam a mesma transição.
- universe.css: contraste localizado, composição editorial e integração das capturas reais. O HTML continua acessível sem WebGL.
- CourtScene.jsx e createArena.js são nomes legados de compatibilidade e encaminham para o novo universo. Não contêm o antigo modelo de quadra.

Movimentos: dolly, travelling, arco de câmera, mudança de campo de visão e aproximação/afastamento. A transição parte da posição atual, inclusive se outra navegação a interromper. O destino é reproduzível ao retornar. O mouse adiciona um deslocamento pequeno e suavizado; nenhum efeito depende dele para funcionar.

A introdução tem duração-alvo de 3,4 segundos após aquecimento, com avanço limitado por quadro para preservar fases em renderização lenta. Enter ou Pular abertura finalizam a composição; SPACE e setas navegam a qualquer momento. Movimentos reduzidos aplicam o destino diretamente e param o loop.

## Tecnologias e orçamento

Three.js existente, Motion existente, GLSL, InstancedMesh, BufferGeometry, CanvasTexture local e EffectComposer/UnrealBloomPass/OutputPass existentes. Sem novas bibliotecas, GSAP, Lenis ou mudança para React Three Fiber: o renderizador imperativo já permite coordenar câmera e geometria e mantém os controles previsíveis.

144 nós, 12 agrupamentos, quatro trajetórias, 256 partículas e até 36 barras conceituais. Onze geometrias próprias e um atlas local de rótulos. Barras e superfícies não contêm números, eixos ou métricas que representem resultados reais. A iluminação usa luzes e materiais locais, sem gerar mapas de reflexão a cada inicialização.

Pixel ratio limitado, pós-processamento em resolução controlada e redução automática de qualidade após amostras de custo alto. A versão leve não usa bloom. O encerramento reduz a frequência de atualização. Aba oculta pausa a renderização. Prefers-reduced-motion desativa deriva, parallax e loop.

Fallback SVG específico para cada capítulo e etapa. Falha ou perda de contexto descarta os recursos gráficos e mantém conteúdo e controles funcionando. Cleanup também remove observador, eventos, RAF, buffers, materiais, atlas, passes e contexto na desmontagem.

## Validação prevista

Build, 56 estados em duas resoluções, poses e câmeras distintas, continuidade durante a transição, interrupção, retorno determinístico, etapas internas, renderer único, recursos após aquecimento, movimento em todos os capítulos, parallax, offline, fallback, movimento reduzido, tela compacta e três ciclos de descarte. A suíte geral verifica teclado, menu, fullscreen, API, CSV e apresentador. Resultados atuais ficam em test-results/universe/ e test-results/refinement/.
