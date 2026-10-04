# Data Center Monitoring System

Dashboard responsivo para acompanhar CPU, memória RAM, servidores, armazenamento e alertas de um data center.

## Estrutura do projeto

- `index.html`: estrutura e conteúdo da página.
- `styles.css`: estilos visuais e regras responsivas para computador e celular.
- `app.js`: gráficos Chart.js, navegação entre telas, atualização do menu e interações dos botões. Também atualiza o indicador de armazenamento. O projeto usa JavaScript no navegador; não contém código Java.

## Navegação e telas

- A navegação usa uma sidebar Bootstrap 5.3.8 fixa no computador, com modo compacto acionado pelo botão no cabeçalho da barra, e um drawer lateral em telas menores.
- No celular, o botão no cabeçalho abre o menu; selecionar uma seção fecha o drawer e atualiza o endereço (`#overview`, `#servers`, `#storage` ou `#alerts`).
- Ícones SVG consistentes identificam as seções, métricas, gráficos, status dos servidores, alertas e ações nos painéis e diálogos.
- O cabeçalho mostra o caminho da página, o estado operacional, o atalho para os alertas ativos e o botão de notificações.
- A **Visão geral** reúne indicadores, gráficos, tabela de servidores e alertas.
- As opções **Servidores**, **Armazenamento** e **Alertas** exibem somente o painel selecionado.
- No celular, a Visão geral mantém os mesmos indicadores e painéis do computador, reorganizados em coluna para caber na tela.
- Os alertas usam vermelho para situações críticas, amarelo para avisos e verde para eventos resolvidos.
- O armazenamento muda para amarelo a partir de 70% de ocupação e vermelho a partir de 85%.

## Executar localmente

Abra `index.html` em um navegador. Bootstrap e Chart.js são carregados por CDN e precisam de conexão com a internet.

## Versão publicada

Acesse o dashboard no [GitHub Pages](https://gabrielmartins171223-ship-it.github.io/data-center-monitoring-system/#overview).

## Publicar no GitHub Pages

O workflow [pages.yml](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system/blob/main/.github/workflows/pages.yml) publica os arquivos da raiz do repositório quando há um push para `main`. Também é possível executá-lo manualmente na aba **Actions** do GitHub.

Os valores exibidos são demonstrativos e não estão conectados a servidores reais. `window.updateStorageUsage(ocupadoTB, capacidadeTotalTB)` atualiza o gráfico, os valores, as cores e o alerta de armazenamento; a função rejeita valores inválidos.