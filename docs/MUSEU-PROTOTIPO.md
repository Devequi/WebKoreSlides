# Museu do Desempenho — protótipo dos capítulos 02 e 03

## Escopo

Reinterpretação de **O problema** e **A solução**, mantendo os dez capítulos, suas informações e controles. Os outros oito capítulos conservam o ambiente e a composição anteriores. As quatro referências orientam arquitetura, escala, enquadramento e iluminação; nenhuma delas é carregada pelo aplicativo como fundo ou textura. Não há modelos externos nem novas dependências.

## Construção do espaço

`src/components/universe/createMuseum.js` constrói um átrio com aproximadamente 48 metros de largura, 90 de profundidade e abóbadas de 21 metros de raio. Pilares, paredes, galerias elevadas, guarda-corpos, claraboia, pedestais, anéis estruturais e expositores existem em coordenadas tridimensionais. A câmera vê superfícies próximas, intermediárias e distantes. O fundo não consiste em partículas ou wireframes.

A instalação central é um estudo escultórico procedural de movimento humano, cercado por estratos sólidos de informação, três painéis de dados conceituais e dois anéis suspensos. A escultura tem fragmentos de superfícies anatômicas com posições e orientações próprias. Os painéis não apresentam percentuais, datas ou resultados fictícios como dados do WebKore. A figura representa movimento e treinamento, sem quadra ou esporte de bola dominante.

O problema separa os fragmentos no espaço, inclina os painéis e rompe a continuidade dos anéis. A solução reorganiza **os mesmos objetos**, recompõe a escultura e fecha os anéis. A luz e o material da escultura passam gradualmente para ciano. A arquitetura permanece a mesma, revelada de outra perspectiva.

Os materiais usam textura procedural local de pedra, rugosidade, relevo e iluminação PBR. Uma luz principal projeta sombras; luzes de recorte ciano e apoios quentes diferenciam as superfícies. Um cone com shader transparente sugere luz da claraboia. O piso tem reflexão planar real com render target de 512×256, misturada à pedra; não é uma imagem pré-renderizada. A escultura é estilizada, não um modelo humano fotogramétrico.

## Câmera e transição

Um único canvas, renderer e cena raiz permanecem montados. `createPresentationWorld.js` coordena os objetos do museu e os objetos anteriores, estes preservados para os outros capítulos. Os capítulos 02 e 03 nunca trocam de cenário entre si.

O controlador do museu interpola câmera, ponto de interesse, posições, quaternions, materiais e intensidade de luz por 2,6 segundos. O percurso combina travelling lateral e dolly, com avanço adicional em profundidade no meio da passagem. Os enquadramentos são assimétricos para reservar espaço ao HTML. O cursor acrescenta parallax pequeno; não existe órbita infinita.

Uma nova navegação captura a pose corrente e redefine o destino. As metas são fixas, sem aleatoriedade durante a reprodução. Voltar e saltar diretamente chegam ao mesmo estado. A aleatoriedade de construção tem semente fixa. Da solução, o próximo comando de avanço abre a Jornada do usuário.

## Interface e acessibilidade

`Scenes.jsx` conserva o conteúdo do problema e os objetivos da solução em HTML. A composição usa introdução lateral, anotações distribuídas pelo espaço e perfis conectados. A logo continua sendo `public/logo.png`. `museum.css` limita as alterações aos dois capítulos. Em telas compactas, o conteúdo ganha fluxo vertical com rolagem interna, sem depender da navegação por scroll.

Teclado, botões, barras de progresso, menu, notas e passos continuam sob o controlador existente em `App.jsx`. Movimento reduzido aplica imediatamente as metas e encerra o loop. Sem WebGL ou após perda de contexto, uma vista SVG esquemática identifica a arquitetura e mantém todo o texto HTML utilizável; ela é uma alternativa explícita, não a implementação 3D principal.

## Recursos e desempenho

- Malhas arquitetônicas estáticas unidas por material; 34 blocos e suas faixas luminosas em instâncias.
- Geometrias e materiais reutilizados durante as transições, sem criação por quadro.
- Sombras atualizadas na transformação; reflexão recalculada quando câmera ou instalação mudam. Em repouso, o render target é reutilizado.
- DPR limitado a 1,25; qualidade baixa até 1; redução automática adicional em dispositivos lentos.
- Pós-processamento existente somente na qualidade equilibrada; `quality=low` renderiza diretamente.
- Aba oculta suspende o loop. Desmontagem descarta malhas instanciadas, geometrias, materiais, texturas, reflexão, sombra, compositor, renderer e contexto.
- Fonte, logo, telas e textura procedural funcionam localmente, sem download durante a apresentação.

O FPS do projetor/computador de apresentação deve ser conferido nesse equipamento. A automação usa Chrome com SwiftShader, que mede renderização por software e não representa uma GPU dedicada. As amostras disponíveis no JSON informam custo e recursos sem equivaler a uma garantia de 30/60 FPS. O build ainda emite o aviso conhecido de bundles maiores que 500 kB.

Na verificação isolada do build, os nove grupos do protótipo passaram, sem erros de console. As 12 amostras após estabilizar a solução registraram 92 chamadas de desenho, 67 geometrias e cinco texturas. O intervalo de 1,7–3,9 ms (média 2,48 ms) mede a chamada de renderização na CPU, não a conclusão dos comandos na GPU. Capturas de entrada incluem o custo adicional de sombra e reflexão; esses passes são reutilizados quando a cena fica parada.

## Arquivos alterados

- `src/components/universe/createMuseum.js`: arquitetura, instalação, iluminação, câmera e transformação.
- `src/components/universe/createPresentationWorld.js`: coordenação persistente do museu com os capítulos preservados.
- `src/components/PerformanceUniverse.jsx`: integração do controlador, métricas e fallback do museu.
- `src/slides/Scenes.jsx`: composição HTML dos capítulos 02 e 03.
- `src/museum.css` e `src/main.jsx`: estilos isolados e importação.
- `tests/museum.mjs` e `package.json`: validação visual e comando `npm run test:museum`.
- `tests/museum-travel.mjs`: verificação específica do percurso em profundidade, retorno e interrupção no build.
- `tests/universe.mjs`: orçamento de chamadas atualizado para os dois ambientes sólidos; os demais capítulos conservam o limite anterior.
- `tests/refinement.mjs`: limite de espera ampliado para renderização por software, mantendo as verificações funcionais existentes.
- `docs/PERFORMANCE-UNIVERSE.md`: identificação do registro anterior como histórico.
- `README.md` e este relatório: instruções atualizadas.
- `dist/`: build local para apresentação.

Tecnologias: React, Three.js, MeshStandardMaterial, InstancedMesh, BufferGeometry, Reflector, shader GLSL, CSS e Motion já existentes. Não foram acrescentados React Three Fiber, GSAP ou outras bibliotecas.

## Como verificar

1. Execute `APRESENTAR.cmd` e abra `http://127.0.0.1:4174/#2`.
2. Observe abóbadas, galerias e instalação fragmentada. Mova suavemente o cursor.
3. Avance para #3: acompanhe o travelling e a reconstrução dos fragmentos; avance novamente para revelar os recursos.
4. Volte, salte pelas barras inferiores e interrompa uma transição. A composição final deve permanecer reproduzível.
5. Use `?quality=low#2`, a opção de reduzir efeitos e `?noWebGL#2` para verificar as alternativas.
6. Confira as capturas `test-results/museum/*scene-2*.png` e `*scene-3*.png`. O sufixo `-world` remove HTML e a máscara de contraste, expondo somente o mundo 3D.

`npm run build` compila o projeto. `npm run test:museum` verifica o protótipo no servidor Vite local da porta 4193. Para testar o build, execute em PowerShell `$env:MUSEUM_DIST='1'; npm run test:museum`. `npm test` verifica a navegação e as funcionalidades gerais na porta 4189. Ambos encerram seus servidores e navegadores ao terminar. Evidências e verificações concluídas ficam nos respectivos `results.json`; execuções históricas não substituem a verificação da versão atual.

## Resultado da verificação — 19/11/2026

- Build concluído; permanece o aviso de tamanho dos bundles descrito acima.
- Protótipo: nove grupos aprovados, duas resoluções de apresentação, capturas com e sem HTML, pose reproduzível, interrupção, canvas persistente, movimento reduzido, alternativa sem WebGL e tela de 390 px. `test-results/museum/results.json`.
- Regressão: 12 grupos aprovados, dez capítulos e todas as etapas em 1366×768 e 1920×1080, teclado, botões, menu, foco, API manual/automática, pausa/repetição, perda de contexto, fullscreen, notas e sincronização, navegação offline e CSV. Nenhum erro de console, requisição externa ou overflow nos casos verificados. `test-results/refinement/results.json`.
- Após aprofundar o percurso da câmera entre 02 e 03, `node tests/museum-travel.mjs` passou no build final: amostragem dentro da região frontal dos fragmentos, chegada à profundidade correta, retorno e interrupção determinísticos. Evidência: `test-results/museum/travel.json`. O script usa a porta 4194 e encerra o servidor ao terminar.
- Os testes foram executados em sequência após uma tentativa simultânea atingir o limite de tempo da renderização por software. A execução isolada concluiu as verificações. Não foi realizado teste presencial no projetor.
