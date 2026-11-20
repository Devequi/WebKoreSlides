# WebKore — ambiente cinematográfico imersivo

## Escopo

Refinamento dos slides 01 e 10 e da cena compartilhada, preservando os dez capítulos, os controles, as demonstrações e o WebKore original. O pedido complementar em prompt_webkore_threejs_fullscreen.md orienta esta versão: o cenário ocupa toda a página e envolve a interface; a arena anterior como maquete foi substituída.

## Estrutura e direção artística

- CourtScene.jsx mantém um canvas WebGL fixo em 100vw × 100dvh, inclusive sob cabeçalho e rodapé. A camada não captura eventos. A interface permanece acima dela.
- createArena.js monta um espaço contínuo. Piso de 120 × 160 unidades, pórticos laterais e de teto, paredes e aletas com faces iluminadas recuam até o horizonte. Os elementos estão distribuídos por ambos os lados e em várias profundidades. A câmera fica dentro desse espaço.
- Referências à quadra aparecem no piso, por shader. Não há borda de pedestal ou maquete flutuando.
- Quatro trajetórias curvas, pontos espaciais, 120 partículas, fachos discretos e três painéis conceituais representam registros conectados. Não há números, percentuais ou resultados reais nos hologramas.
- Materiais metálicos recebem luz ciano/azul e um ambiente de reflexão gerado no próprio dispositivo, com RoomEnvironment e PMREM. Não existem arquivos remotos de ambiente.
- Interface centralizada sobre o cenário. O contraste usa uma máscara radial localizada, preservando ambiente visível também atrás do título e nos lados. Cabeçalho e navegação mantêm suas camadas e eventos.
- Marca em Space Grotesk 600; frase em 500. Fontes e licença estão incluídas localmente. A logo oficial foi preservada.

## Câmera e sequência

Introdução com duração-alvo de 3,4 segundos depois do primeiro quadro de aquecimento (em renderização lenta, o avanço é limitado por quadro para não saltar fases): ambiente, conexões, hologramas e enquadramento definitivo. A câmera se desloca suavemente de (0, 6.1, 26) para (0, 7.2, 20), mirando o espaço adiante, sem deslocamento lateral de viewport. A perspectiva de 62° enquadra as estruturas como um ambiente ao redor do observador.

Enter ou o botão Pular abertura encerram a sequência imediatamente. SPACE, → e Iniciar apresentação avançam a qualquer momento. E repete a demonstração. Voltar ao slide 01 reinicia a entrada sem criar outro renderizador. Durante a permanência, a deriva da câmera é mínima e independente do mouse.

No slide 10, enquadramento, intensidade de luz e velocidade mudam. A interface permanece estável para perguntas. O slide 02 usa a mesma cena de maneira discreta. Os demais capítulos pausam a renderização.

## Desempenho, acessibilidade e descarte

- Um renderizador compartilhado, iniciado apenas quando necessário.
- Estruturas e LEDs em dois InstancedMesh; partículas em um único Points.
- Sem sombras dinâmicas ou texturas de vídeo; materiais e geometrias criados na inicialização, sem reconstrução por quadro.
- DPR limitado a 1–1,35, teto de 30 fps e 12,5 fps no encerramento.
- Bloom com intensidade 0,3 e limiar 1,05. Dispositivos com até quatro processadores lógicos ou quality=low usam renderização direta. A média de custo acima de 35 ms em 8 amostras posteriores ao aquecimento também desativa o pós-processamento.
- Prefers-reduced-motion mostra a composição final e para o loop. A aba oculta e os capítulos intermediários também param o loop.
- ResizeObserver atualiza o canvas e a câmera. A alternativa SVG estática cobre toda a viewport em falhas ou ausência de WebGL; noWebGL força esse caminho.
- Cleanup cancela RAF, desconecta o observador, remove listeners, descarta geometrias, materiais, texturas, render targets e passes, libera o contexto e remove o canvas.

## Reprodução e validação

Abra APRESENTAR.cmd e acesse http://127.0.0.1:4174. O servidor local não precisa de internet, API ou banco.

`npm run build` gera dist. `npm run test:arena` verifica ambiente, fases, canvas de tela inteira, atalhos, retorno, offline, movimento reduzido, fallback e ciclos de descarte. `npm test` verifica os dez capítulos e as funcionalidades gerais. Execute as suítes separadamente, pois compartilham a porta 4189.

Capturas e relatórios da versão imersiva: test-results/arena/. Os testes usam Chrome no Windows com SwiftShader para o WebGL. Eles não comprovam FPS na GPU física do notebook nem leitura em um projetor real. O aviso de chunks acima de 500 kB continua sendo um aviso de tamanho, não uma falha de build.

## Resultado da revisão da cena

As dez verificações da cena foram aprovadas em dois lotes sobre o mesmo build: canvas medido em 100% da viewport nas duas resoluções, fases, fonte local, enquadramento, salto e navegação, retorno, estabilidade após vinte mudanças, encerramento, offline, movimento reduzido, fallback e descarte em três ciclos. Resumo com hashes do build: test-results/arena/verification-final.json. Buffers/texturas e liberação do contexto/canvas foram registrados em lifecycle.json. As últimas cinco amostras de geometria permaneceram estáveis após os carregamentos iniciais por visibilidade.
