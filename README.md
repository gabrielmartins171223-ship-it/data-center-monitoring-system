# Data Center Monitoring System

Dashboard responsivo para acompanhar CPU, memória RAM, servidores, armazenamento e alertas de um data center.

## Estrutura do projeto

- `index.html`: estrutura e conteúdo da página.
- `styles.css`: estilos visuais e regras responsivas para computador e celular.
- `app.js`: gráficos Chart.js, navegação, filtros e interações dos botões. O projeto usa JavaScript no navegador; não contém código Java.
- `.github/workflows/pages.yml`: publicação automática no GitHub Pages.

## Navegação e telas

- O cabeçalho mostra o caminho da página, o estado operacional, o atalho para os alertas ativos e o botão de notificações.
- A **Visão geral** reúne indicadores, gráficos, tabela de servidores e alertas.
- As opções **Servidores**, **Armazenamento** e **Alertas** exibem somente o painel selecionado.
- No celular, a Visão geral mantém os mesmos indicadores e painéis do computador, reorganizados em coluna para caber na tela.
- Os alertas usam vermelho para situações críticas, amarelo para avisos e verde para eventos resolvidos.

## Executar localmente

Abra `index.html` em um navegador. Os gráficos usam Chart.js por CDN, portanto precisam de conexão com a internet.

## Publicar no GitHub Pages

O workflow em `.github/workflows/pages.yml` publica o site automaticamente quando houver um push para a branch `main`.

1. Crie o repositório público `data-center-monitoring-system` no GitHub.
2. Envie o conteúdo desta pasta para a branch `main`.
3. Em **Settings > Pages**, escolha **GitHub Actions** como fonte de publicação.
4. Acompanhe a execução em **Actions**. Quando concluir, o site ficará disponível em `https://SEU-USUARIO.github.io/data-center-monitoring-system/`.

Os valores exibidos são demonstrativos e não estão conectados a servidores reais.