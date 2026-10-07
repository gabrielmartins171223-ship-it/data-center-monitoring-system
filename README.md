# Data Center Monitoring System

Dashboard responsivo para acompanhar CPU, memória RAM, servidores, armazenamento e alertas de um data center.

## Estrutura do projeto

- `index.html`: estrutura, conteúdo e ícones SVG da página.
- `styles.css`: estilos visuais, estados dos alertas e regras responsivas para computador e celular.
- `app.js`: gráficos Chart.js, navegação entre telas e interações dos botões. Também alterna automaticamente entre cenários demonstrativos a cada 30 segundos e atualiza indicadores, servidores, alertas e armazenamento. O projeto usa JavaScript no navegador; não contém código Java.

## Navegação e telas

- A navegação usa uma sidebar Bootstrap 5.3.8 fixa no computador, com modo compacto acionado pelo botão no cabeçalho da barra, e um drawer lateral em telas menores.
- No celular, o botão no cabeçalho abre o menu; selecionar uma seção fecha o drawer e atualiza o endereço (`#overview`, `#servers`, `#storage` ou `#alerts`).
- A interface usa ícones SVG para as seções, indicadores, alertas e ações principais. Eles são decorativos; os controles mantêm rótulos acessíveis.
- O cabeçalho mostra o caminho da página, indica o modo de demonstração, oferece um atalho para alertas e abre as notificações.
- A **Visão geral** reúne indicadores, gráficos, tabela de servidores e alertas.
- As opções **Servidores**, **Armazenamento** e **Alertas** exibem somente o painel selecionado.
- No celular, a Visão geral mantém os mesmos indicadores e painéis do computador, reorganizados em coluna para caber na tela.
- Os alertas usam vermelho para situações críticas, amarelo para avisos e verde para eventos resolvidos, com ícones relacionados ao tipo de evento.

## Estado de prontidao

O dashboard ainda **não está apto para monitoramento operacional**: os indicadores, servidores, alertas e gráficos são cenários demonstrativos (normal, alerta, crítico e recuperação) que alternam a cada 30 segundos. Essa atualização é uma simulação no navegador, não uma coleta de telemetria. Não há backend, autenticação, armazenamento persistente, integração com servidores nem telemetria em tempo real. A interface identifica esse modo para evitar confundir os valores ilustrativos com dados reais.

O indicador de disco usa verde abaixo de 70%, amarelo de 70% a 85% e vermelho acima de 85%. `window.updateStorageUsage(ocupadoTB, capacidadeTotalTB)` atualiza o gráfico, os valores, as cores e o alerta; a função rejeita valores inválidos.

### Integracao de telemetria e alertas

O navegador agora oferece a funcao `window.receiveServerTelemetry` para receber uma leitura validada por servidor:

```js
window.receiveServerTelemetry({
  serverId: 'srv-prod-01',
  cpu: 86.2,       // percentual de 0 a 100
  memory: 78.4,    // percentual de 0 a 100
  diskUsed: 0.86,  // TB; mesma unidade de diskTotal
  diskTotal: 1     // TB
});
```

CPU, memoria e disco disparam um alerta critico quando ultrapassam 85%; exatamente 85% nao dispara. Valores de disco devem ser enviados em TB para corresponder as unidades exibidas pelo painel. O servidor e marcado OFFLINE quando passa mais de 2 minutos sem uma nova leitura, com verificacao a cada 5 segundos; essa deteccao se aplica aos servidores que ja enviaram ao menos uma leitura nesta sessao. Alertas repetidos nao sao duplicados enquanto a condicao persistir; a recuperacao fecha o alerta ativo. O dashboard muda para modo ao vivo na primeira leitura e apresenta medias de CPU/RAM, ocupacao de disco agregada pelas capacidades e estado dos servidores monitorados.

Cada abertura ou resolucao de alerta tambem emite o evento de navegador `monitoring-alert`, com o alerta em `event.detail`, para permitir que uma aplicacao hospedeira encaminhe notificacoes.

**Limite de prontidao operacional:** continua sem backend/coletor de telemetria, autenticacao, persistencia, envio de e-mail/SMS/push ou garantias de entrega. A funcao de integracao precisa ser chamada por um coletor confiavel; o dashboard aberto no navegador sozinho nao coleta dados e nao deve ser tratado como monitoramento de producao. Os testes automatizados cobrem limiares, validacao, deduplicacao, timeout e recuperacao; para uso real ainda e necessario conectar e operar um backend/coletor e um canal de notificacao.

Execute os testes automatizados com `node tests/monitoring.test.js` em um ambiente com Node.js 24. O workflow do GitHub tambem verifica a sintaxe e roda esses testes antes de publicar no Pages.

## Executar localmente

Abra `index.html` em um navegador. Bootstrap e Chart.js são carregados por CDN e precisam de conexão com a internet.

## Repositório e versão publicada

- Código-fonte: [GitHub](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system).
- Dashboard publicado: [abrir no GitHub Pages](https://gabrielmartins171223-ship-it.github.io/data-center-monitoring-system/#overview).

O link do GitHub Pages foi verificado em 4 de outubro de 2026. A publicação pode demorar alguns instantes para refletir alterações feitas no repositório.

## Trabalhar com Git

Clone o projeto e entre na pasta:

```bash
git clone https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system.git
cd data-center-monitoring-system
```

Depois de editar os arquivos, revise e envie suas alterações:

```bash
git status
git add .
git commit -m "Descreva a alteracao"
git push origin main
```

## Publicação no GitHub Pages

O workflow [pages.yml](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system/blob/main/.github/workflows/pages.yml) publica os arquivos da raiz do repositório quando há um push para `main`. Também é possível executá-lo manualmente na aba **Actions** do GitHub. O andamento e eventuais erros ficam registrados nessa aba.

Os valores exibidos são demonstrativos e não estão conectados a servidores reais.