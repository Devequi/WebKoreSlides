# Validação final — ambiente full-screen — 19/11/2026

Build de produção concluído com sucesso. As 12 verificações gerais foram aprovadas; os relatórios têm errors, remote e overflow vazios. As dez verificações do ambiente foram concluídas em dois lotes sobre o mesmo build, cujos hashes foram conferidos ao finalizar.

## Evidências

- Regressão geral: test-results/refinement/results.json.
- Cena: test-results/arena/verification-final.json, com fontes dos dois lotes e hashes do build.
- Descarte de buffers/texturas/contexto em três ciclos: test-results/arena/lifecycle.json.
- Capturas finais da abertura e conclusão: test-results/arena/1366-opening-final.png, 1920-opening-final.png, 1366-closing-final.png e 1920-closing-final.png.
- Revisão técnica: docs/ARENA-CINEMATOGRAFICA.md.

## Executado

- Exatamente dez capítulos e 28 estados por resolução, em 1366×768 e 1920×1080: 56 verificações de enquadramento.
- Canvas medido em x=0, y=0, largura e altura iguais às da viewport nas duas resoluções; cena inspecionada visualmente com estruturas, piso e iluminação atravessando a composição inteira.
- Fonte Space Grotesk local carregada; logo oficial preservada. SHA256 do PNG igual ao de Logo/logoWK.png do produto: 8C1B035B3B6D7A5DB1C79666BA8475622075EE0604840077FF2E54325E0E1901.
- Quatro fases da introdução, salto por Enter e botão, navegação durante a sequência e reinício ao retornar ao slide 01.
- Movimento ambiental independente do mouse; renderização pausada nos capítulos intermediários e após o quadro final em movimento reduzido.
- Um renderizador compartilhado; contagens de recursos estáveis nas últimas trocas de uma sequência de vinte mudanças, após os carregamentos iniciais por visibilidade.
- Três montagens e desmontagens com descarte de buffers/texturas, liberação do contexto, remoção do canvas e ausência de RAF pendente.
- Encerramento nas duas resoluções, fallback sem WebGL e por evento de perda de contexto.
- SPACE, setas, Home, End, R, E, botões, retorno de etapas, menu, foco e navegação rápida.
- API didática: reprodução, pausa, repetição e avanço manual.
- Fullscreen: entrada e saída pelo botão.
- Modo do apresentador: janela separada, duas prévias, notas e sincronização local; painel alternativo.
- Navegador offline depois de carregar: dez capítulos, capturas, revelações e download CSV demonstrativo. Zero requisições externas na execução normal.
- Tela de 390×844 sem overflow horizontal.
- Zero erros de execução/console na suíte de produção.
- Projeto WebKore original consultado sem modificações; nenhuma API real, migração ou operação de banco executada.

## Condições e limites

Chrome no Windows com SwiftShader para WebGL. A regressão de layout e controles foi feita com movimento reduzido; a introdução e a cena ativa foram exercitadas separadamente. As esperas dos testes acompanham estados e quadros concluídos para acomodar a renderização por software.

Não foram aferidos FPS na GPU física do notebook, leitura em projetor real ou disposição em dois monitores físicos. A sincronização foi testada entre janelas do navegador.

O build emite aviso de bundles acima de 500 kB; não é falha de compilação. Recursos e fontes são locais. O funcionamento sem internet requer o servidor iniciado por APRESENTAR.cmd; não foi implementado service worker para reabrir a página com todas as conexões do navegador bloqueadas.

As notas e imagens do produto continuam demonstrativas. IA, suporte offline do produto e novos relatórios são possibilidades futuras. Não foi executada a suíte do projeto original nem medido impacto empírico de uso.
