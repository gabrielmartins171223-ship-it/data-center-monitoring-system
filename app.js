const resolveDisplayName = server => {
	const candidate = [
		server?.displayName,
		server?.serverName,
		server?.server_name,
		server?.hostname,
		server?.name,
		server?.serverId
	].find(value => typeof value === 'string' && value.trim());
	return candidate ? candidate.trim() : '—';
};
const DISK_CAPACITY_PER_SERVER_GB = 20;
const METRICS_POLL_INTERVAL_MS = 10_000;
const API_BASE = 'http://192.168.56.20:5000';
const chartColors = { green: '#c6f36b', mint: '#67d6ae', muted: '#7d8a81', grid: 'rgba(134, 150, 139, .13)' };
const performancePeriods = { 1: 60 * 60 * 1000, 6: 6 * 60 * 60 * 1000, 24: 24 * 60 * 60 * 1000 };
const performanceHistory = [];
const performanceChartOptions = {
	maintainAspectRatio: false,
	interaction: { intersect: false, mode: 'index' },
	plugins: {
		legend: { display: false },
		tooltip: {
			backgroundColor: '#222c26',
			borderColor: '#39463d',
			borderWidth: 1,
			titleFont: { family: 'DM Mono', size: 10 },
			bodyFont: { family: 'DM Mono', size: 10 },
			padding: 10,
			callbacks: {
				label: context => ` ${context.dataset.label}: ${context.parsed.y}%`
			}
		}
	},
	scales: {
		x: {
			grid: { display: false },
			border: { display: false },
			ticks: {
				color: chartColors.muted,
				font: { family: 'DM Mono', size: 9 },
				maxRotation: 0,
				autoSkip: true,
				maxTicksLimit: 7
			}
		},
		y: {
			min: 0,
			max: 100,
			border: { display: false, dash: [3, 4] },
			grid: { color: chartColors.grid, drawTicks: false },
			ticks: {
				stepSize: 25,
				padding: 9,
				color: chartColors.muted,
				font: { family: 'DM Mono', size: 9 },
				callback: value => `${value}%`
			}
		}
	}
};
const performanceChart = new Chart(document.getElementById('performanceChart'), {
	type: 'line',
	data: { labels: [], datasets: [
		{
			label: 'CPU',
			data: [],
			borderColor: chartColors.green,
			backgroundColor: 'rgba(198,243,107,.08)',
			borderWidth: 2,
			pointRadius: 0,
			pointHoverRadius: 4,
			fill: true,
			tension: .38
		},
		{
			label: 'Memoria RAM',
			data: [],
			borderColor: chartColors.mint,
			backgroundColor: 'transparent',
			borderWidth: 1.7,
			pointRadius: 0,
			pointHoverRadius: 4,
			fill: false,
			tension: .38
		}
	] },
	options: performanceChartOptions
});
const storageChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	cutout: '82%',
	plugins: {
		legend: { display: false },
		tooltip: {
			backgroundColor: '#222c26',
			borderColor: '#39463d',
			borderWidth: 1,
			titleFont: { family: 'DM Mono', size: 10 },
			bodyFont: { family: 'DM Mono', size: 10 },
			callbacks: {
				label: context => ` ${context.label}: ${context.raw}%`
			}
		}
	}
};
const storageChart = new Chart(document.getElementById('storageChart'), {
	type: 'doughnut',
	data: {
		labels: ['Utilizado', 'Disponivel'],
		datasets: [{
			data: [],
			backgroundColor: [chartColors.green, '#344139'],
			borderWidth: 0,
			hoverOffset: 3,
			spacing: 3,
			borderRadius: 3
		}]
	},
	options: storageChartOptions
});
const formatCapacity = value => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`;
const setStoragePending = (usedCapacity, reportedCapacity) => {
	const storageCard = document.getElementById('storage');
	const storageAlert = document.getElementById('storageAlert');
	storageCard.dataset.storageStatus = 'unknown';
	storageAlert.hidden = true;
	document.getElementById('storagePercentage').textContent = '—';
	document.getElementById('storageStatus').textContent = reportedCapacity !== null ? 'Aguardando capacidade dos servidores' : 'Aguardando telemetria';
	document.getElementById('storageUsed').textContent = usedCapacity === null ? '—' : `${formatCapacity(usedCapacity)} (reportado)`;
	document.getElementById('storageAvailable').textContent = '—';
	document.getElementById('storageCapacity').textContent = reportedCapacity === null ? '—' : formatCapacity(reportedCapacity);
	storageChart.data.datasets[0].data = [];
	storageChart.update();
};
const updateStorageUsage = (usedCapacity, totalCapacity) => {
	if (!Number.isFinite(usedCapacity) || !Number.isFinite(totalCapacity) || usedCapacity < 0 ||
		totalCapacity <= 0 || usedCapacity > totalCapacity) {
		throw new RangeError('Uso e capacidade do disco precisam ser válidos, e o uso não pode exceder a capacidade medida.');
	}

	const usagePercent = (usedCapacity / totalCapacity) * 100;
	const storageStatus = usagePercent > 85
		? { level: 'critical', color: '#f17b72', label: 'Crítico: acima de 85%' }
		: usagePercent >= 70
			? { level: 'warning', color: '#f2bb65', label: 'Atenção: 70%' }
			: { level: 'normal', color: chartColors.green, label: 'Normal' };
	const storageCard = document.getElementById('storage');
	const storageAlert = document.getElementById('storageAlert');

	storageCard.dataset.storageStatus = storageStatus.level;
	storageAlert.hidden = storageStatus.level === 'normal';
	storageAlert.setAttribute('aria-label', storageStatus.label);
	storageAlert.title = storageStatus.label;
	document.getElementById('storagePercentage').textContent = `${usagePercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
	document.getElementById('storageStatus').textContent = storageStatus.label;
	document.getElementById('storageUsed').textContent = formatCapacity(usedCapacity);
	document.getElementById('storageAvailable').textContent = formatCapacity(totalCapacity - usedCapacity);
	document.getElementById('storageCapacity').textContent = formatCapacity(totalCapacity);
	storageChart.data.datasets[0].data = [usagePercent, 100 - usagePercent];
	storageChart.data.datasets[0].backgroundColor = [storageStatus.color, '#344139'];
	storageChart.update();
};
window.updateStorageUsage = updateStorageUsage;

let liveDataActive = false;
const lastTelemetryTimestamps = new Map();
const showCriticalAlertToast = alert => {
	const container = document.getElementById('alertToasts');
	if (!container) return;
	const toast = document.createElement('div');
	toast.className = 'alert-toast';
	toast.setAttribute('role', 'alert');
	const icon = document.createElement('span');
	icon.className = 'alert-toast-icon';
	icon.setAttribute('aria-hidden', 'true');
	icon.textContent = '!';
	const content = document.createElement('div');
	const title = document.createElement('strong');
	title.textContent = alert.title;
	const detail = document.createElement('span');
	detail.textContent = alert.detail;
	content.append(title, detail);
	toast.append(icon, content);
	container.append(toast);
	window.setTimeout(() => toast.remove(), 8000);
};
const createMonitoringService = () => new ServerMonitoringService({
	onAlert: alert => {
		window.dispatchEvent(new CustomEvent('monitoring-alert', { detail: alert }));
		if (alert.level === 'critical') showCriticalAlertToast(alert);
	}
});
let monitoringService = createMonitoringService();
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
	'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const getServerStatus = server => server.offline
	? 'Offline'
	: !server.lastSeenAt
		? 'Aguardando'
		: [server.cpu, server.memory, server.disk].some(value => value > 85)
		? 'Instável'
		: [server.cpu, server.memory, server.disk].some(value => value >= 70)
			? 'Atenção'
		: 'Online';
const getLiveScenario = () => {
	const monitoredServers = monitoringService.getServers();
	const onlineServers = monitoredServers.filter(server => !server.offline);
	const average = metric => onlineServers.length
		? onlineServers.reduce((total, server) => total + server[metric], 0) / onlineServers.length
		: null;
	const alerts = monitoringService.getAlerts().slice(0, 10).map(alert => {
		const elapsedMinutes = Math.floor((Date.now() - alert.createdAt) / 60000);
		return {
			level: alert.level,
			icon: alert.level === 'resolved' ? 'icon-check' : alert.icon || 'icon-server-offline',
			title: alert.title,
			detail: alert.detail,
			time: elapsedMinutes < 1 ? 'agora' : `${elapsedMinutes} min`,
			createdAt: alert.createdAt
		};
	});

	return {
		monitoredServers,
		onlineServers,
		cpu: average('cpu'),
		memory: average('memory'),
		storageUsed: monitoredServers.reduce((total, server) => total + server.diskUsed, 0),
		storageCapacity: monitoredServers.reduce((total, server) => total + server.diskTotal, 0),
		alerts,
		activeAlertCount: monitoringService.getActiveAlertCount()
	};
};
const updatePerformanceChart = () => {
	const period = document.querySelector('.period-btn.active')?.dataset.period || '6';
	const cutoff = Date.now() - performancePeriods[period];
	const records = performanceHistory.filter(record => record.time >= cutoff);
	performanceChart.data.labels = records.map(record => record.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
	performanceChart.data.datasets[0].data = records.map(record => record.cpu);
	performanceChart.data.datasets[1].data = records.map(record => record.memory);
	performanceChart.update();
};
document.querySelectorAll('.period-btn').forEach(button => button.addEventListener('click', () => {
	document.querySelectorAll('.period-btn').forEach(item => item.classList.toggle('active', item === button));
	updatePerformanceChart();
}));
const renderMetric = (id, value, unit = '') => {
	const node = document.getElementById(id);
	if (node) node.innerHTML = `${escapeHtml(value)}${unit ? `<span class="metric-unit">${escapeHtml(unit)}</span>` : ''}`;
};
const renderAlertList = (selector, alerts) => {
	const container = document.querySelector(selector);
	if (!container) return;
	if (!alerts.length) {
		container.innerHTML = '<p class="empty-state">Nenhum alerta recebido. Aguardando telemetria dos servidores.</p>';
		return;
	}
	container.innerHTML = alerts.map(alert => {
		const alertClass = alert.level === 'critical' ? 'critical' : alert.level === 'warning' ? 'warning' : 'resolved';
		return `<div class="alert"><span class="alert-icon ${alertClass}"><svg aria-hidden="true"><use href="#${escapeHtml(alert.icon)}"/></svg></span><div><div class="alert-title">${escapeHtml(alert.title)}</div><div class="alert-detail">${escapeHtml(alert.detail)}</div></div><span class="alert-time" title="${new Date(alert.createdAt).toLocaleString('pt-BR')}"><svg aria-hidden="true"><use href="#icon-clock"/></svg>${escapeHtml(alert.time)}</span></div>`;
	}).join('');
};
const renderDialogAlerts = (alerts, activeCount) => {
	const alertCopy = document.querySelector('#alertsDialog .dialog-header p');
	if (alertCopy) alertCopy.textContent = `${activeCount} alertas ativos`;
	const notificationsNote = document.getElementById('notificationsNote');
	if (notificationsNote) notificationsNote.textContent = 'Alertas críticos e de indisponibilidade também aparecem como notificações na tela.';
	['#notificationsDialog .dialog-list', '#alertsDialog .dialog-list'].forEach(selector => renderAlertList(selector, alerts));
	const topAlertLink = document.querySelector('.topbar-alert-link');
	if (topAlertLink) {
		const badge = topAlertLink.querySelector('.nav-count');
		if (badge) badge.textContent = String(activeCount).padStart(2, '0');
		topAlertLink.setAttribute('aria-label', `Abrir alertas: ${activeCount} ativos`);
	}
	const alertViewButton = document.querySelector('#alerts .view-all');
	if (alertViewButton) alertViewButton.textContent = `${String(activeCount).padStart(2, '0')} ATIVOS`;
	const sidebarAlertLink = document.querySelector('.sidebar-link[href="#alerts"]');
	if (sidebarAlertLink) {
		const badge = sidebarAlertLink.querySelector('.nav-count');
		if (badge) badge.textContent = String(activeCount).padStart(2, '0');
		sidebarAlertLink.setAttribute('aria-label', `Alertas, ${activeCount} ativos`);
	}
	renderMetric('alertsMetric', activeCount);
};
const renderServers = (servers) => {
	const rows = servers.map(server => {
		const status = getServerStatus(server);
		const statusClass = status === 'Offline' ? 'offline' : status === 'Instável' ? 'critical' : status === 'Atenção' ? 'warning' : status === 'Aguardando' ? 'pending' : 'online';
		const statusIcon = status === 'Offline' ? 'icon-server-offline' : status === 'Instável' || status === 'Atenção' ? 'icon-alert' : status === 'Aguardando' ? 'icon-clock' : 'icon-check-circle';
		const usageClass = server.cpu > 85 ? 'bad' : server.cpu >= 75 ? 'warn' : '';
		const value = metric => Number.isFinite(server[metric]) ? `${Math.round(server[metric])}%` : '—';
		const effectiveName = resolveDisplayName(server);
		return `<tr><td><span class="server-name"><span class="status-dot ${statusClass === 'online' ? '' : statusClass}"></span>${escapeHtml(effectiveName)}</span></td><td><span class="table-status ${statusClass}"><svg aria-hidden="true"><use href="#${statusIcon}"/></svg>${status}</span></td><td><span class="usage"><span class="usage-track"><span class="usage-fill ${usageClass}" style="width:${Number.isFinite(server.cpu) ? server.cpu : 0}%"></span></span><span class="mono">${value('cpu')}</span></span></td><td class="mono">${value('memory')}</td><td class="mono">${value('disk')}</td></tr>`;
	}).join('');
	const tableBody = document.querySelector('#servers tbody');
	if (tableBody) tableBody.innerHTML = rows || '<tr><td class="empty-state" colspan="5">Aguardando dados da API/backend.</td></tr>';

	const dialogList = document.getElementById('allServersList');
	if (!dialogList) return;
	dialogList.innerHTML = '';
	const header = document.createElement('div');
	header.className = 'dialog-server header';
	header.innerHTML = '<span>Servidor</span><span>Status</span><span>CPU</span><span>RAM</span><span>Disco</span>';
	dialogList.append(header);
	servers.forEach(server => {
		const row = document.createElement('div');
		row.className = 'dialog-server';
		const status = getServerStatus(server);
		const statusClass = status === 'Offline' ? 'offline' : status === 'Instável' ? 'critical' : status === 'Atenção' ? 'warning' : status === 'Aguardando' ? 'pending' : 'online';
		const statusIcon = status === 'Offline' ? 'icon-server-offline' : status === 'Instável' || status === 'Atenção' ? 'icon-alert' : status === 'Aguardando' ? 'icon-clock' : 'icon-check-circle';
		const value = metric => Number.isFinite(server[metric]) ? `${Math.round(server[metric])}%` : '—';
		const effectiveName = resolveDisplayName(server);
		row.innerHTML = `<span class="server-name"><span class="status-dot ${statusClass === 'online' ? '' : statusClass}"></span>${escapeHtml(effectiveName)}</span><span class="dialog-status ${statusClass}"><svg aria-hidden="true"><use href="#${statusIcon}"/></svg>${status}</span><span class="mono">${value('cpu')}</span><span class="mono">${value('memory')}</span><span class="mono">${value('disk')}</span>`;
		dialogList.append(row);
	});
};
const refreshLiveStatus = scenario => {
	const pill = document.querySelector('.live-pill');
	const sourceFootnote = document.getElementById('dataSourceFootnote');
	const serversSourceSubtitle = document.getElementById('serversSourceSubtitle');
	const sourceStatusDot = document.querySelector('.heading-meta .status-dot');
	if (pill) {
		if (scenario.onlineServers.length) {
			pill.classList.remove('waiting', 'offline');
			pill.lastChild.textContent = 'API CONECTADA · AO VIVO';
		} else {
			pill.classList.remove('waiting');
			pill.classList.add('offline');
			pill.lastChild.textContent = 'SEM SINAL DE TELEMETRIA';
		}
	}
	if (sourceFootnote) sourceFootnote.textContent = 'DADOS RECEBIDOS DA API/BACKEND';
	if (serversSourceSubtitle) serversSourceSubtitle.textContent = 'DADOS RECEBIDOS DA API/BACKEND';
	if (sourceStatusDot) sourceStatusDot.className = `status-dot ${scenario.onlineServers.length ? '' : 'warning'}`;
};
const setApiConnectionError = error => {
	console.error('Falha ao consultar a telemetria da API:', error);
	const pill = document.querySelector('.live-pill');
	const footnote = document.getElementById('dataSourceFootnote');
	if (pill) {
		pill.classList.remove('waiting');
		pill.classList.add('offline');
		pill.lastChild.textContent = 'ERRO NA CONEXÃO COM A API';
	}
	if (footnote) footnote.textContent = 'ERRO AO CONSULTAR API · VERIFIQUE CONEXÃO E CORS';
};
const setApiConnectionSuccess = () => {
	const scenario = getLiveScenario();
	if (liveDataActive) {
		refreshLiveStatus(scenario);
		return;
	}
	const pill = document.querySelector('.live-pill');
	const footnote = document.getElementById('dataSourceFootnote');
	if (pill) {
		pill.classList.remove('offline');
		pill.classList.add('waiting');
		pill.lastChild.textContent = 'API CONECTADA · AGUARDANDO TELEMETRIA';
	}
	if (footnote) footnote.textContent = 'API CONECTADA · AGUARDANDO TELEMETRIA';
};
const extractLatestMetric = payload => {
	if (Array.isArray(payload)) return payload[0] || null;
	if (!payload || typeof payload !== 'object') {
		throw new TypeError('A resposta da API precisa ser um objeto ou uma lista de leituras.');
	}
	if (Array.isArray(payload.metrics)) return payload.metrics[0] || null;
	if (Array.isArray(payload.data)) return payload.data[0] || null;
	if (payload.data && typeof payload.data === 'object') return payload.data;
	return payload;
};
const getMetricsEndpoint = () => {
	const endpoint = new URL('/metrics', API_BASE);
	endpoint.searchParams.set('limit', '10');
	return endpoint;
};
const pollServerTelemetry = async () => {
	try {
		const response = await fetch(getMetricsEndpoint(), {
			headers: { Accept: 'application/json' },
			cache: 'no-store'
		});
		if (!response.ok) throw new Error(`A API respondeu HTTP ${response.status}.`);
		const payload = await response.json();
		const telemetry = extractLatestMetric(payload);
		if (telemetry) window.receiveServerTelemetry(telemetry);
		setApiConnectionSuccess();
	} catch (error) {
		setApiConnectionError(error);
	}
};
const refreshDashboard = () => {
	const scenario = getLiveScenario();
	const knownServerCount = scenario.monitoredServers.length;
	const onlineCount = scenario.onlineServers.length;
	const missingSignalCount = knownServerCount - onlineCount;
	renderMetric('cpuMetric', scenario.cpu === null ? '—' : Math.round(scenario.cpu), scenario.cpu === null ? '' : '%');
	renderMetric('onlineMetric', onlineCount, ` / ${knownServerCount}`);
	renderMetric('offlineMetric', missingSignalCount);
	renderMetric('memoryMetric', scenario.memory === null ? '—' : Math.round(scenario.memory), scenario.memory === null ? '' : '%');

	const latestReading = Math.max(...scenario.monitoredServers.map(server => server.lastSeenAt), 0);
	document.getElementById('updatedAt').textContent = latestReading
		? `ÚLTIMA LEITURA · ${new Date(latestReading).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
		: 'AGUARDANDO DADOS';
	document.getElementById('serversDialogSummary').textContent = `${onlineCount} de ${knownServerCount} servidores com sinal`;
	renderServers(scenario.monitoredServers);
	renderAlertList('#alerts .alert-list', scenario.alerts);
	renderDialogAlerts(scenario.alerts, scenario.activeAlertCount);
	updatePerformanceChart();

	if (!scenario.monitoredServers.length) {
		setStoragePending(null, null);
	} else {
		updateStorageUsage(scenario.storageUsed, scenario.storageCapacity);
	}
	if (liveDataActive) refreshLiveStatus(scenario);
};
const toTelemetryNumber = (value, fieldName) => {
	if ((typeof value !== 'number' && typeof value !== 'string') ||
		(typeof value === 'string' && !value.trim())) {
		throw new TypeError(`${fieldName} precisa ser um número.`);
	}
	const number = Number(value);
	if (!Number.isFinite(number)) throw new TypeError(`${fieldName} precisa ser um número válido.`);
	return number;
};
const mapBackendTelemetry = telemetry => {
	if (!telemetry || typeof telemetry !== 'object') {
		throw new TypeError('A telemetria precisa ser enviada como um objeto.');
	}
	const serverIdValue = telemetry.ip ?? telemetry.serverId ?? telemetry.id ?? telemetry.server_id;
	const serverId = typeof serverIdValue === 'string' || typeof serverIdValue === 'number'
		? String(serverIdValue).trim()
		: '';
	if (!serverId) {
		throw new TypeError('A telemetria precisa incluir ip, serverId ou id para identificar o servidor.');
	}
	const cpu = toTelemetryNumber(telemetry.cpu_percent ?? telemetry.cpu, 'CPU');
	const memory = toTelemetryNumber(telemetry.memory_percent ?? telemetry.memory, 'Memória');
	if (![cpu, memory].every(value => value >= 0 && value <= 100)) {
		throw new RangeError('CPU e memória precisam estar entre 0 e 100%.');
	}
	const diskPercent = telemetry.disk_percent === undefined
		? null
		: toTelemetryNumber(telemetry.disk_percent, 'disk_percent');
	const diskTotal = telemetry.diskTotal === undefined
		? DISK_CAPACITY_PER_SERVER_GB
		: toTelemetryNumber(telemetry.diskTotal, 'diskTotal');
	const diskUsed = telemetry.diskUsed === undefined && diskPercent !== null
		? diskTotal * diskPercent / 100
		: toTelemetryNumber(telemetry.diskUsed, 'diskUsed');
	if (diskPercent !== null && (diskPercent < 0 || diskPercent > 100)) {
		throw new RangeError('disk_percent precisa estar entre 0 e 100%.');
	}
	if (diskUsed < 0) {
		throw new RangeError('diskUsed precisa ser um valor não negativo informado em GB.');
	}
	if (diskTotal <= 0) {
		throw new RangeError('diskTotal precisa ser uma capacidade positiva informada em GB.');
	}
	if (diskUsed > diskTotal) {
		throw new RangeError('diskUsed não pode exceder diskTotal.');
	}
	const timestamp = telemetry.timestamp;
	if ((typeof timestamp !== 'string' && typeof timestamp !== 'number') ||
		(typeof timestamp === 'string' && !timestamp.trim()) ||
		(typeof timestamp === 'number' && !Number.isFinite(timestamp))) {
		throw new TypeError('A telemetria precisa incluir um timestamp válido.');
	}
	const displayNameValue = telemetry.displayName ?? telemetry.name;
	const displayName = typeof displayNameValue === 'string' && displayNameValue.trim()
		? displayNameValue.trim()
		: serverId;
	return {
		serverId,
		displayName,
		ip: telemetry.ip,
		cpu,
		memory,
		diskUsed,
		diskTotal,
		timestamp: String(timestamp).trim()
	};
};
const ingestTelemetry = telemetry => {
	const server = monitoringService.ingest(telemetry);
	liveDataActive = true;
	const current = getLiveScenario();
	if (current.onlineServers.length) {
		performanceHistory.push({ time: new Date(), cpu: current.cpu, memory: current.memory });
		if (performanceHistory.length > 2000) performanceHistory.shift();
	}
	refreshDashboard();
	return server;
};
window.receiveServerTelemetry = telemetry => {
	const mappedTelemetry = mapBackendTelemetry(telemetry);
	if (lastTelemetryTimestamps.get(mappedTelemetry.serverId) === mappedTelemetry.timestamp) return null;
	const server = ingestTelemetry(mappedTelemetry);
	lastTelemetryTimestamps.set(mappedTelemetry.serverId, mappedTelemetry.timestamp);
	return server;
};

const serverList = document.getElementById('allServersList');
if (serverList) {
	[...serverList.querySelectorAll('.dialog-server')].forEach(node => node.remove());
}
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
	document.getElementById(button.dataset.dialog).showModal();
}));
document.getElementById('notificationsButton').addEventListener('click', () => document.getElementById('notificationsDialog').showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
	if (event.target === dialog) dialog.close();
}));
setInterval(() => {
	if (liveDataActive && monitoringService.checkOffline()) refreshDashboard();
}, 5000);
refreshDashboard();
const scheduleMetricsPolling = async () => {
	await pollServerTelemetry();
	window.setTimeout(scheduleMetricsPolling, METRICS_POLL_INTERVAL_MS);
};
scheduleMetricsPolling();

const navigationLinks = document.querySelectorAll('.sidebar-link, .topbar-alert-link');
const sidebarCollapseToggle = document.getElementById('sidebarCollapseToggle');
sidebarCollapseToggle.addEventListener('click', () => {
	const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
	const label = isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
	sidebarCollapseToggle.setAttribute('aria-pressed', String(isCollapsed));
	sidebarCollapseToggle.setAttribute('aria-label', label);
	sidebarCollapseToggle.title = label;
});
document.querySelectorAll('.sidebar-link').forEach(link => link.addEventListener('click', () => {
	if (window.matchMedia('(max-width: 991.98px)').matches) {
		bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('primarySidebar')).hide();
	}
}));
const pageViews = {
	overview: { title: 'Visão geral', subtitle: 'Acompanhe a saúde e o desempenho da sua infraestrutura.' },
	servers: { title: 'Servidores', subtitle: 'Estado e uso dos servidores que enviam telemetria.' },
	storage: { title: 'Armazenamento', subtitle: 'Uso e capacidade informados pela API/backend.' },
	alerts: { title: 'Alertas', subtitle: 'Eventos identificados a partir da telemetria recebida.' }
};
const updateActiveNavigation = () => {
	const requestedView = window.location.hash.slice(1);
	const activeView = Object.hasOwn(pageViews, requestedView) ? requestedView : 'overview';
	const page = pageViews[activeView];
	document.body.dataset.view = activeView;
	document.getElementById('currentTitle').textContent = page.title;
	document.getElementById('currentBreadcrumb').textContent = page.title;
	document.getElementById('currentSubtitle').textContent = page.subtitle;
	navigationLinks.forEach(link => {
		const isActive = link.hash === `#${activeView}`;
		link.classList.toggle('active', isActive);
		if (isActive) link.setAttribute('aria-current', 'page');
		else link.removeAttribute('aria-current');
	});
	window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.addEventListener('hashchange', updateActiveNavigation);
updateActiveNavigation();
