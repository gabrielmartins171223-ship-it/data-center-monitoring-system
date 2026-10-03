# Data Center Monitoring System

Dashboard responsivo para acompanhar CPU, memória RAM, servidores, armazenamento e alertas de um data center.

## Estrutura do projeto

- `index.html`: estrutura e conteúdo da página.
- `styles.css`: estilos visuais e regras responsivas para computador e celular.
- `app.js`: gráficos Chart.js, navegação entre telas, atualização do menu e interações dos botões. O projeto usa JavaScript no navegador; não contém código Java.

## Navegação e telas

- A navegação usa uma sidebar vertical fixa no computador e um drawer lateral Bootstrap 5.3.8 em telas menores.
- No celular, o botão no cabeçalho abre o menu; selecionar uma seção fecha o drawer e atualiza o endereço (`#overview`, `#servers`, `#storage` ou `#alerts`).
- O cabeçalho mostra o caminho da página, o estado operacional, o atalho para os alertas ativos e o botão de notificações.
- A **Visão geral** reúne indicadores, gráficos, tabela de servidores e alertas.
- As opções **Servidores**, **Armazenamento** e **Alertas** exibem somente o painel selecionado.
- No celular, a Visão geral mantém os mesmos indicadores e painéis do computador, reorganizados em coluna para caber na tela.
- Os alertas usam vermelho para situações críticas, amarelo para avisos e verde para eventos resolvidos.

## Executar localmente

Abra `index.html` em um navegador. Bootstrap e Chart.js são carregados por CDN e precisam de conexão com a internet.

## Versão publicada

Acesse o dashboard no [GitHub Pages](https://gabrielmartins171223-ship-it.github.io/data-center-monitoring-system/#overview).

## Publicar no GitHub Pages

O endereço publicado está na seção acima. Para publicar alterações, envie-as para o GitHub e confira em **Settings > Pages** qual branch e pasta estão configuradas como origem. Este projeto não contém atualmente um workflow de publicação em `.github/workflows`.

Os valores exibidos são demonstrativos e não estão conectados a servidores reais.