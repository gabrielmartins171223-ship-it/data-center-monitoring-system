# Monitoramento de VM

Dashboard web responsivo para visualizar telemetria de CPU, memória, disco, disponibilidade e alertas recebida pela integração.

## Estrutura

- `index.html`: estrutura da interface, indicadores, gráficos e diálogos.
- `styles.css`: tema visual, estados dos componentes e layout responsivo.
- `app.js`: atualização da interface, gráficos, navegação e adaptação da telemetria recebida.
- `monitoring.js`: validação das leituras, estado de disponibilidade e ciclo de vida dos alertas.

## Telemetria

O dashboard não gera dados simulados. A cada 10 segundos, consulta `GET /metrics?limit=1&server_id=1` na mesma origem da página e envia a leitura mais recente para `window.receiveServerTelemetry`. O endpoint pode retornar diretamente uma leitura, uma lista, ou um objeto com `metrics`/`data` contendo a lista:

```js
window.receiveServerTelemetry({
  id: 1,
  name: 'VM 1',
  ip: '10.0.0.1',
  cpu_percent: '30',
  memory_percent: '45',
  disk_percent: '60',
  timestamp: '2026-10-28T22:28:00Z'
});
```

Para uma API hospedada em outra origem, configure `data-api-base-url` no elemento `<html>` com o host e a porta da API, sem o caminho `/metrics` (por exemplo, `https://api.exemplo.com`). O servidor precisa permitir a origem do dashboard via CORS. O valor vazio usa a origem atual; GitHub Pages não hospeda nem encaminha `/metrics`, então a chamada só funcionará lá se houver uma API/proxy acessível nessa mesma origem ou se a URL base for configurada.

O adaptador converte `ip` para `serverId` (usa `serverId`, `id` ou `server_id` como alternativas), `name` para `displayName`, e `cpu_percent`/`memory_percent` para números `cpu`/`memory`. Valores métricos recebidos como texto numérico são convertidos com `Number()`. Cada VM tem capacidade de disco configurada em 20 GB; `disk_percent` é convertido para `diskUsed` e `diskTotal` para manter o contrato usado pelo monitoramento. Leituras com timestamp igual ao último recebido para aquela VM são ignoradas.

CPU, memória e disco geram alerta médio quando atingem 70% e crítico quando ultrapassam 85%. Alertas críticos aparecem em um toast no dashboard. Uma VM que já enviou uma leitura e fica mais de dois minutos sem atualizar é marcada offline e também gera um toast; a verificação ocorre a cada cinco segundos. Os eventos aparecem no painel **Alertas recentes**, nas notificações e no histórico em memória da sessão. Os 10 eventos mais recentes são mostrados; o histórico se perde ao recarregar a página.

## Prontidão para uso real

**Ainda não está apto, sozinho, para monitoramento operacional real.** A função `window.receiveServerTelemetry` é uma função JavaScript local, não um endpoint de rede, coletor ou mecanismo autenticado. O dashboard consulta o endpoint de métricas, mas não há API/backend nem configuração para hospedá-la neste projeto; o GitHub Pages publica somente os arquivos estáticos do dashboard. O frontend não persiste dados, não envia notificações externas e deixa de monitorar quando a página é fechada. Erros de conexão e respostas inválidas aparecem no console e no status da conexão.

Para produção, implante um coletor/backend autenticado e protegido e conecte-o ao frontend quando o endpoint e o contrato de acesso estiverem definidos. Configure persistência, notificações externas e monitoramento do próprio coletor. Não exponha a função do navegador como canal público de ingestão.

## Executar e verificar

Abra `index.html` em um navegador com acesso à internet. Bootstrap e Chart.js são carregados por CDN.

Verifique a sintaxe dos scripts com Node.js:

```powershell
node --check app.js
node --check monitoring.js
```

## Repositório e publicação

- Código-fonte: [GitHub](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system).
- Dashboard no GitHub Pages: [abrir o dashboard](https://gabrielmartins171223-ship-it.github.io/data-center-monitoring-system/#overview).

O GitHub Pages publica somente os arquivos estáticos e não recebe telemetria. Para publicar alterações, faça push para `main`; o workflow [pages.yml](https://github.com/gabrielmartins171223-ship-it/data-center-monitoring-system/blob/main/.github/workflows/pages.yml) publica a interface automaticamente.