# Monitoramento de VM

Dashboard web responsivo para visualizar telemetria simulada ou recebida por integração de CPU, memória, disco, disponibilidade e alertas.

## Estrutura

- `index.html`: estrutura da interface, indicadores, gráficos e diálogos.
- `styles.css`: tema visual, estados dos componentes e layout responsivo.
- `app.js`: atualização da interface, simulação temporária, gráficos, navegação e integração da telemetria.
- `monitoring.js`: validação das leituras, estado de disponibilidade e ciclo de vida dos alertas.

## Simulação e telemetria

Enquanto a API/backend não estiver conectada, o dashboard cria quatro nomes de servidor aleatórios e dados simulados, atualizando as leituras imediatamente ao abrir a página e depois a cada 20 segundos. A tabela omite IPs e detalhes fixos de recursos:

O total simulado é de 8 núcleos de CPU, 8 GB de RAM e 80 GB de disco (20 GB por servidor). Os usos de CPU, RAM e disco variam para exercitar níveis normais, médios (70% a 85%) e críticos (acima de 85%), incluindo abertura e resolução de alertas. A cada quatro minutos, um dos servidores deixa de enviar leituras por aproximadamente 100 segundos; após 50 segundos sem atualização, ele aparece offline e gera um alerta crítico. Quando as leituras simuladas voltam, o servidor aparece online e o alerta é resolvido. Esse limite reduzido vale apenas para a demonstração; na integração com a API/backend, o limite offline continua sendo de dois minutos. São dados aleatórios de demonstração, não leituras oficiais da infraestrutura. A interface marca claramente o modo de simulação.

O navegador disponibiliza `window.receiveServerTelemetry` como ponto de integração do frontend. O backend/coletor deve enviar um objeto por servidor com um identificador estável, os campos de identificação disponíveis e as métricas medidas. Exemplo ilustrativo:

```js
window.receiveServerTelemetry({
  serverId: '<identificador estável da API>',
  name: '<nome informado pela API>',
  ip: '<IP informado pela API>',
  cpu: 0,        // percentual de 0 a 100
  memory: 0,     // percentual de 0 a 100
  diskUsed: 0,   // GB medidos
  diskTotal: 1   // capacidade positiva medida, em GB
});
```

O nome pode vir em `displayName`, `serverName`, `server_name`, `name` ou `hostname`; se nenhum desses campos vier, a interface usa o identificador recebido. IPs não são exibidos. CPU, memória e disco geram alerta médio quando atingem 70% e crítico quando ultrapassam 85%. Na integração com a API/backend, um servidor que já enviou uma leitura e fica mais de dois minutos sem atualizar é marcado offline. A verificação ocorre a cada cinco segundos enquanto há telemetria. Os alertas (abertura e resolução) aparecem no painel **Alertas recentes**, nas notificações e no histórico em memória da sessão. Os 10 eventos mais recentes são mostrados; o histórico se perde ao recarregar a página.

Ao receber a primeira leitura por `window.receiveServerTelemetry`, o dashboard interrompe a simulação e limpa seus dados e alertas fictícios; a partir daí, exibe somente os dados recebidos pela integração. A capacidade total e o uso do disco são calculados a partir das leituras atuais.

## Prontidão para uso real

**Ainda não está apto, sozinho, para monitoramento operacional real.** A simulação é apenas para demonstração. A função `window.receiveServerTelemetry` é uma função JavaScript local, não um endpoint de rede, coletor ou mecanismo autenticado. O dashboard não se conecta diretamente aos servidores, não persiste dados, não envia notificações externas e deixa de monitorar quando a página é fechada.

Para produção, implante um coletor/backend autenticado e protegido, conecte os servidores, configure persistência, notificações externas e monitoramento do próprio coletor. Não exponha a função do navegador como canal público de ingestão. Os nomes, IPs e capacidades devem ser fornecidos pela API e validados contra o ambiente real.

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