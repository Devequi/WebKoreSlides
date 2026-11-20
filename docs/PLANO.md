# Plano de refinamento — 19/11/2026

Preservar React, Vite, Motion, componentes reutilizáveis e exatamente dez capítulos.

1. Marca: aplicar public/logo.png (SHA256 igual a Logo/logoWK.png do produto), lettering Segoe UI/Arial, peso moderado e espaçamento aberto; manter Midnight Cyan do design-tokens.css.
2. Ambiente: uma cena Three.js compartilhada nos capítulos 1, 2 e 10, com SVG estático, redução de movimento, pausa fora dos capítulos e descarte dos recursos.
3. Navegação: controlador único de etapas para teclado, botões e controle remoto; retorno previsível, proteção contra key repeat e reinício.
4. Conteúdo: relação treinador/produto/atleta; jornada e funcionalidades com capturas locais; API em quatro etapas; dados/segurança sem cliques; timeline cumulativa; roadmap IA/offline/relatórios.
5. Apresentador: janela local sincronizada, prévias, notas, relógio e alternativa em painel.
6. Verificação: build e testes do navegador de todos os estados nas duas resoluções, offline, fallback, movimento reduzido, fullscreen e sincronização.

Fontes locais: src/App.jsx, src/slides/Scenes.jsx, src/data/content.js, src/components/Visuals.jsx e src/styles.css. Produto consultado em ../WebKore - Copia: src/App.jsx, services/api.js e session.js, navigation.js, selectors.js, páginas de treinador e atleta, server/src/rotas/treinamentos.rotas.js, autenticacao.js e prisma/schema.prisma. Repositório complementar consultado: https://github.com/Devequi/WebKore. Nenhuma modificação no produto original.

Diagnóstico: símbolos WK artificiais apesar do asset oficial disponível; SVG sem WebGL; fontes secundárias menores que 16px; API automática em 450ms; somente jornada reage a etapas e botão global as pula; entidades e desenvolvimento exigem mouse; composição final densa. Corrigir conservando a estrutura e reaproveitando estilos, layout e dados úteis.
