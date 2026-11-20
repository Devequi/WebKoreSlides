# WebKore — apresentação interativa de TCC

Exatamente 10 slides em React/Vite/Motion, com cena Three.js e demonstrações locais baseadas na interface real do produto.

## Apresentar

Abra `APRESENTAR.cmd` e acesse http://127.0.0.1:4174. O build já está em `dist/`. Node.js 22.12+ é necessário para o servidor local. Não é necessário internet, API ou MySQL para apresentar. Não abrir o HTML diretamente por file://.

- Enter na abertura: pular a introdução e manter o enquadramento final.
- SPACE, → ou botão inferior: próxima etapa; depois da última, próximo slide.
- ← ou botão inferior anterior: volta uma etapa; na primeira, volta ao último estado do capítulo anterior.
- Menu ou barras de progresso: acesso direto, preservando as etapas já visitadas.
- E ou botão de reinício superior: reiniciar a demonstração do slide atual.
- R: reiniciar tudo e zerar relógio.
- Home / End: abertura e conclusão.
- N: abrir/fechar notas na mesma janela.
- Tela cheia: botão superior; Escape sai e reinicia a demonstração atual.

Na arquitetura, a requisição possui quatro etapas. Pode ser percorrida manualmente ou reproduzida com intervalo de 2,5, 3,5 ou 5 segundos; há pausa e repetição.

## Apresentador

O botão **Notas** abre uma janela de controle. Mova essa janela para o monitor do apresentador; deixe a principal no projetor. As janelas devem usar o mesmo navegador, origem e porta. BroadcastChannel sincroniza slide, etapa, tempo e comandos sem serviço remoto. As prévias são cópias estáticas, sem novos renderizadores WebGL. A principal funciona de maneira independente. Se a janela for bloqueada ou o canal não existir, use o painel de notas N.

A prévia da direita mostra o próximo capítulo. A indicação textual informa a próxima revelação dentro do capítulo atual. Notas técnicas explicitam os recortes do modelo e as limitações do produto.

## Fontes e demonstrações

- Marca: `public/logo.png`, idêntica por SHA256 a `../WebKore - Copia/Logo/logoWK.png` e `public/icons/logoWK.png` do produto.
- Tipografia: Space Grotesk 500/600 incluída localmente para a marca e os títulos da abertura/conclusão; Segoe UI/Arial no conteúdo. Sem fontes remotas. Licença em public/space-grotesk-LICENSE.txt.
- Paleta: Midnight Cyan do `src/styles/design-tokens.css` do produto.
- Telas: capturadas do build local existente do WebKore. `tests/capture-product.mjs` serve somente arquivos estáticos do produto e intercepta as respostas da API no navegador com fixtures. Não inicia API nem acessa banco. Dados, nomes, notas e códigos são fictícios.
- Capturas focadas em equipes, solicitações, busca por código, treinos, avaliação e gráfico real. As imagens ficam em `public/screens/`; `src/data/screens.js` incorpora cópias ao bundle para permitir a troca de telas mesmo com a conexão do navegador desativada.
- Para regenerar: `node tests/capture-product.mjs`, depois `npm run build`. A localização do projeto original está explícita no script.
- Relatórios: o exemplo CSV é demonstrativo. A imagem correspondente mostra a tela real de origem dos dados; não representa uma prévia de PDF.
- Conteúdo: verificado no schema Prisma, rotas Express, middleware de autenticação, seletores, páginas e regras compartilhadas do projeto local. Repositório complementar: https://github.com/Devequi/WebKore.

## Museu do Desempenho

A apresentação abre em uma rotunda circular com seis estudos de movimento, um globo cartográfico e anéis suspensos. A introdução dura 5,4 segundos. Enter conclui a revelação. O botão Iniciar apresentação, Espaço ou a seta direita conduzem a câmera por um pórtico até O problema em 3,2 segundos. A seta esquerda percorre a passagem de volta. Com movimento reduzido, a câmera assume diretamente o enquadramento final.

A arquitetura, o globo e o piso refletivo são gerados localmente em Three.js. A rotunda e o pedestal exibem o personagem Ch45 com os quatro movimentos fornecidos em FBX. O navegador carrega uma vez o arquivo local `public/models/webkore-athlete.glb`. Para regenerá-lo a partir dos originais, execute `node scripts/convert-athletes.mjs`. O teste `node tests/athletes.mjs` verifica a deformação da malha de cada atleta e a reprodução determinística das poses. A logo, o título, o subtítulo e o botão são HTML. Os controles secundários continuam acessíveis pelo teclado e pelo mouse. Para conferir a alternativa gráfica sem WebGL, abra `?noWebGL#1`.

Nos capítulos 02 e 03, a instalação fragmentada se recompõe durante a passagem para A solução. Os detalhes técnicos dessas galerias estão em [MUSEU-PROTOTIPO.md](docs/MUSEU-PROTOTIPO.md). A captura da abertura fica em `test-results/opening/opening.png`. Após compilar, execute `node tests/opening.mjs` para verificar a travessia, o retorno e o layout compacto.

## Desenvolvimento e verificação

`npm install`, `npm run dev`, `npm run build`, `npm test`.

A suíte atual é `tests/refinement.mjs`: usa Chrome instalado no caminho indicado no script e servidor exclusivo na porta 4189. Resultado em `test-results/refinement/results.json`; capturas das duas resoluções na mesma pasta. Scripts antigos `browser.mjs` e `states.mjs` pertencem à implementação anterior e não são a suíte atual.

Ver `docs/PLANO.md` e `docs/VALIDACAO.md`. O projeto original é somente fonte de consulta. Não foram executadas migrações nem operações em seu banco.

O ambiente imersivo de tela inteira é detalhado em `docs/ARENA-CINEMATOGRAFICA.md`. Execute `npm run test:arena` para verificar a nova cena, inclusive os ciclos de descarte. Não execute as duas suítes simultaneamente: ambas usam a porta 4189.
