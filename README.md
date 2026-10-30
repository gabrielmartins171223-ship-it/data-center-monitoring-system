# Monitoramento de VM

Dashboard web responsivo para visualizar telemetria de CPU, memória, disco, disponibilidade e alertas recebida pela integração.

## Estrutura

- `index.html`: estrutura da interface, indicadores, gráficos e diálogos.
- `styles.css`: tema visual, estados dos componentes e layout responsivo.
- `app.js`: atualização da interface, gráficos, navegação e adaptação da telemetria recebida.
- `monitoring.js`: validação das leituras, estado de disponibilidade e ciclo de vida dos alertas.

## Telemetria

O dashboard não gera dados simulados. A cada 10 segundos, consulta `GET /servidores` e, para cada servidor, `GET /metricas?server_id=<ID>&limit=1` na URL definida pela constante `API_BASE`, no início de `app.js`. Assim, monitora todos os servidores cadastrados e processa a leitura mais recente de cada um. A API deve retornar uma lista de servidores em `/servidores` e uma lista de métricas em `/metricas`.

```js
window.receiveServerTelemetry({
  server_id: 1,
  name: 'VM 1',
  ip: '10.0.0.1',
  cpu_percent: '30',
  memory_percent: '45',
  disk_total_gb: '100',
  disk_used_gb: '60',
  timestamp: '2026-10-28T22:28:00Z'
});
```

`server_id` é a identidade estável do servidor; `id` pode identificar apenas uma leitura. O adaptador também aceita `serverId`, `ip` ou `id` como alternativas, converte `name` para `displayName` e `cpu_percent`/`memory_percent` para números `cpu`/`memory`. `disk_total_gb` e `disk_used_gb` são convertidos em capacidades em GB; se a capacidade não vier, o dashboard usa 20 GB por servidor, e `disk_percent` pode ser usado para calcular o espaço ocupado. Leituras com timestamp igual ao último recebido para aquela VM são ignoradas.

`API_BASE` está configurada para `http://127.0.0.1:5000`. O frontend consulta somente essa API; cabe ao backend buscar os dados das VMs pela porta 80 e disponibilizá-los em `/servidores` e `/metricas`. O backend precisa permitir a origem do dashboard via CORS. `127.0.0.1` é a máquina onde o navegador está sendo executado, portanto a API deve estar acessível nessa máquina; para um dashboard aberto em outra máquina, configure `API_BASE` com o endereço de rede da máquina da API. GitHub Pages hospeda somente os arquivos estáticos e não fornece acesso à API local.

CPU, memória e disco geram alerta médio quando atingem 70% e crítico quando atingem 85% ou mais. Alertas críticos aparecem em um toast no dashboard. Uma VM que já enviou uma leitura e fica mais de dois minutos sem atualizar é marcada offline e também gera um toast; a verificação ocorre a cada cinco segundos. Os eventos aparecem no painel **Alertas recentes**, nas notificações e no histórico em memória da sessão. Os 10 eventos mais recentes são mostrados; o histórico se perde ao recarregar a página.

## Prontidão para uso real

**Ainda não está apto, sozinho, para monitoramento operacional real.** A função `window.receiveServerTelemetry` é uma função JavaScript local, não um endpoint de rede, coletor ou mecanismo autenticado. O backend não está incluído neste projeto; as rotas `GET /servidores` e `GET /metricas` precisam estar disponíveis e protegidas pelo backend. As rotas `POST /monitoramento` e `GET /alertas` ainda não estão integradas. O GitHub Pages publica somente os arquivos estáticos. O frontend não persiste dados, não envia notificações externas e deixa de monitorar quando a página é fechada. Erros de conexão e respostas inválidas aparecem no console e no status da conexão.

Para produção, implante um coletor/backend autenticado e protegido e conecte-o ao frontend quando o endpoint e o contrato de acesso estiverem definidos. Configure persistência, notificações externas e monitoramento do próprio coletor. Não exponha a função do navegador como canal público de ingestão.

## Executar e verificar

Abra `index.html` em um navegador com acesso à internet. Bootstrap, Chart.js e as fontes são carregados por CDN; a demonstração precisa de internet para carregá-los.

Verifique a sintaxe dos scripts com Node.js:

```powershell
node --check app.js
node --check monitoring.js
```

## Repositório e publicação

- Código-fonte: [GitHub](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system).
- Dashboard no GitHub Pages: [abrir o dashboard](https://gabrielmartins171223-ship-it.github.io/data-center-monitoring-system/#overview).

O GitHub Pages publica somente os arquivos estáticos e não recebe telemetria. Para publicar alterações, faça push para `main`; o workflow [pages.yml](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system/blob/main/.github/workflows/pages.yml) publica a interface automaticamente.