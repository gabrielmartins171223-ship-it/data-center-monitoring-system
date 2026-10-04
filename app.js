const chartColors = { green: '#c6f36b', mint: '#67d6ae', muted: '#7d8a81', grid: 'rgba(134, 150, 139, .13)' };
const performanceCanvas = document.getElementById('performanceChart');
const timeLabels = {
	1: ['-55m', '-50m', '-45m', '-40m', '-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'agora'],
	6: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', 'agora'],
	24: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', 'agora']
};
const chartData = {
	1: { cpu: [42, 47, 44, 53, 49, 62, 57, 68, 62, 72, 66, 68], ram: [61, 62, 60, 64, 65, 66, 64, 68, 69, 71, 70, 72] },
	6: { cpu: [48, 55, 46, 63, 57, 72, 68, 79, 61, 74, 64, 68], ram: [55, 58, 57, 61, 59, 65, 62, 68, 65, 70, 69, 72] },
	24: { cpu: [34, 41, 38, 48, 44, 55, 51, 64, 58, 73, 63, 68], ram: [48, 49, 51, 53, 54, 57, 56, 61, 63, 68, 69, 72] }
};
const performanceChart = new Chart(performanceCanvas, {
	type: 'line',
	data: { labels: timeLabels[6], datasets: [
		{ label: 'CPU', data: chartData[6].cpu, borderColor: chartColors.green, backgroundColor: 'rgba(198,243,107,.08)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: .38 },
		{ label: 'Memoria RAM', data: chartData[6].ram, borderColor: chartColors.mint, backgroundColor: 'transparent', borderWidth: 1.7, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: .38 }
	] },
	options: { maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#222c26', borderColor: '#39463d', borderWidth: 1, titleFont: { family: 'DM Mono', size: 10 }, bodyFont: { family: 'DM Mono', size: 10 }, padding: 10, callbacks: { label: context => ` ${context.dataset.label}: ${context.parsed.y}%` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: chartColors.muted, font: { family: 'DM Mono', size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } }, y: { min: 0, max: 100, border: { display: false, dash: [3, 4] }, grid: { color: chartColors.grid, drawTicks: false }, ticks: { stepSize: 25, padding: 9, color: chartColors.muted, font: { family: 'DM Mono', size: 9 }, callback: value => `${value}%` } } } }
});
const storageChart = new Chart(document.getElementById('storageChart'), {
	type: 'doughnut',
	data: { labels: ['Utilizado', 'Disponivel'], datasets: [{ data: [64, 36], backgroundColor: [chartColors.green, '#344139'], borderWidth: 0, hoverOffset: 3, spacing: 3, borderRadius: 3 }] },
	options: { responsive: true, maintainAspectRatio: false, cutout: '82%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#222c26', borderColor: '#39463d', borderWidth: 1, titleFont: { family: 'DM Mono', size: 10 }, bodyFont: { family: 'DM Mono', size: 10 }, callbacks: { label: context => ` ${context.label}: ${context.raw}%` } } } }
});
const updateStorageUsage = (usedCapacity, totalCapacity) => {
	if (!Number.isFinite(usedCapacity) || !Number.isFinite(totalCapacity) || usedCapacity < 0 || totalCapacity <= 0 || usedCapacity > totalCapacity) {
		throw new RangeError('A ocupacao deve estar entre zero e a capacidade total, que precisa ser maior que zero.');
	}

	const usagePercent = (usedCapacity / totalCapacity) * 100;
	const storageStatus = usagePercent >= 85
		? { level: 'critical', color: '#f17b72', label: 'Critico: 85% ou mais' }
		: usagePercent >= 70
			? { level: 'warning', color: '#f2bb65', label: 'Atencao: 70% ou mais' }
			: { level: 'normal', color: chartColors.green, label: 'Normal' };
	const formatCapacity = value => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} TB`;
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
updateStorageUsage(6.4, 10);
document.querySelectorAll('.period-btn').forEach(button => button.addEventListener('click', () => {
	document.querySelectorAll('.period-btn').forEach(item => item.classList.toggle('active', item === button));
	refreshDashboard();
}));
const updatedAt = document.getElementById('updatedAt');
const onlineServers = [
	{ name: 'srv-prod-01', status: 'Online', cpu: 42, ram: 68, disk: 54 },
	{ name: 'srv-prod-02', status: 'Online', cpu: 81, ram: 84, disk: 71 },
	{ name: 'srv-db-01', status: 'Online', cpu: 56, ram: 72, disk: 63 },
	{ name: 'srv-backup-01', status: 'Instavel', cpu: 96, ram: 91, disk: 88 }
];
for (let index = 1; index <= 20; index += 1) {
	onlineServers.push({ name: `srv-node-${String(index).padStart(2, '0')}`, status: 'Online', cpu: 28 + (index * 13) % 58, ram: 36 + (index * 17) % 52, disk: 31 + (index * 11) % 55 });
}
const offlineServers = ['srv-app-04', 'srv-app-05', 'srv-cache-02', 'srv-worker-03'].map(name => ({ name, status: 'Offline', cpu: 0, ram: 0, disk: 0 }));
const serverList = document.getElementById('allServersList');
const serverHeader = document.createElement('div');
serverHeader.className = 'dialog-server header';
serverHeader.innerHTML = '<span><svg class="table-icon" aria-hidden="true"><use href="#icon-server"/></svg>Servidor</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-check-circle"/></svg>Status</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-cpu"/></svg>CPU</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-memory"/></svg>RAM</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-storage"/></svg>Disco</span>';
serverList.append(serverHeader);
[...onlineServers, ...offlineServers].forEach(server => {
	const row = document.createElement('div');
	row.className = 'dialog-server';
	const statusClass = server.status === 'Offline' ? 'offline' : server.status === 'Instavel' ? 'warning' : '';
	const statusIcon = server.status === 'Offline' ? 'icon-server-offline' : server.status === 'Instavel' ? 'icon-alert' : 'icon-check-circle';
	row.innerHTML = `<span class="server-name"><span class="status-dot ${statusClass}"></span>${server.name}</span><span class="dialog-status ${statusClass || 'online'}"><svg aria-hidden="true"><use href="#${statusIcon}"/></svg>${server.status}</span><span class="mono">${server.cpu}%</span><span class="mono">${server.ram}%</span><span class="mono">${server.disk}%</span>`;
	serverList.append(row);
});
const dashboardScenarios = [
	{
		offline: ['srv-app-04', 'srv-app-05', 'srv-cache-02', 'srv-worker-03'],
		unstable: ['srv-backup-01'],
		cpuOffset: 0, ramOffset: 0, diskOffset: 0, storageUsed: 6.4,
		alerts: [
			{ level: 'critical', icon: 'icon-server-offline', title: 'Servidor offline', detail: 'srv-app-04 nao responde ao ping', time: '2 min' },
			{ level: 'warning', icon: 'icon-cpu', title: 'CPU acima do limite', detail: 'srv-backup-01 atingiu 96% de uso', time: '8 min' },
			{ level: 'critical', icon: 'icon-memory', title: 'Memoria critica', detail: 'srv-prod-02 ultrapassou 80%', time: '14 min' },
			{ level: 'resolved', icon: 'icon-check', title: 'Servidor recuperado', detail: 'srv-api-03 voltou ao funcionamento normal', time: '32 min' }
		]
	},
	{
		offline: ['srv-app-04', 'srv-app-05', 'srv-cache-02'],
		unstable: ['srv-prod-02', 'srv-backup-01', 'srv-node-04'],
		cpuOffset: 10, ramOffset: 7, diskOffset: 4, storageUsed: 7.5,
		alerts: [
			{ level: 'critical', icon: 'icon-server-offline', title: 'Servidor offline', detail: 'srv-app-04 nao responde ao ping', time: '2 min' },
			{ level: 'warning', icon: 'icon-cpu', title: 'CPU acima do limite', detail: 'srv-prod-02 atingiu 88% de uso', time: '5 min' },
			{ level: 'warning', icon: 'icon-storage', title: 'Disco proximo do limite', detail: 'srv-db-02 atingiu 85% de armazenamento', time: '12 min' },
			{ level: 'resolved', icon: 'icon-check', title: 'Servidor estabilizado', detail: 'srv-api-03 voltou ao estado normal', time: '27 min' }
		]
	},
	{
		offline: ['srv-prod-02', 'srv-app-04', 'srv-app-05', 'srv-cache-02', 'srv-worker-03', 'srv-node-01', 'srv-node-05', 'srv-node-09', 'srv-node-13', 'srv-node-17'],
		unstable: ['srv-prod-01', 'srv-db-01', 'srv-backup-01'],
		cpuOffset: 18, ramOffset: 18, diskOffset: 13, storageUsed: 8.7,
		alerts: [
			{ level: 'critical', icon: 'icon-server-offline', title: 'Servidor offline', detail: 'srv-prod-02 nao responde ao ping', time: '1 min' },
			{ level: 'critical', icon: 'icon-memory', title: 'Memoria critica', detail: 'srv-db-01 ultrapassou 90%', time: '3 min' },
			{ level: 'warning', icon: 'icon-cpu', title: 'CPU acima do limite', detail: 'srv-backup-01 atingiu 98% de uso', time: '6 min' },
			{ level: 'warning', icon: 'icon-storage', title: 'Disco proximo do limite', detail: 'srv-db-02 atingiu 87% de armazenamento', time: '11 min' }
		]
	},
	{
		offline: ['srv-app-04', 'srv-app-05'],
		unstable: [],
		cpuOffset: -4, ramOffset: -6, diskOffset: -8, storageUsed: 5.9,
		alerts: [
			{ level: 'resolved', icon: 'icon-check', title: 'Servidor recuperado', detail: 'srv-app-04 voltou ao funcionamento normal', time: '4 min' },
			{ level: 'resolved', icon: 'icon-check', title: 'Alerta encerrado', detail: 'srv-prod-02 estabilizou a memoria', time: '9 min' },
			{ level: 'warning', icon: 'icon-cpu', title: 'Uso elevado', detail: 'srv-db-01 ficou em 72% de CPU', time: '18 min' },
			{ level: 'resolved', icon: 'icon-check', title: 'Disco normalizado', detail: 'srv-db-02 saiu do limite de armazenamento', time: '25 min' }
		]
	}
];
const getDashboardScenario = () => dashboardScenarios[Math.floor(Date.now() / 30000) % dashboardScenarios.length];
const refreshDashboard = () => {
	const scenario = getDashboardScenario();
	const offlineNames = new Set(scenario.offline);
	const unstableNames = new Set(scenario.unstable);
	const servers = [...onlineServers, ...offlineServers].map(server => {
		const offline = offlineNames.has(server.name);
		return {
			...server,
			status: offline ? 'Offline' : unstableNames.has(server.name) ? 'Instavel' : 'Online',
			cpu: offline ? 0 : Math.max(0, Math.min(99, server.cpu + scenario.cpuOffset)),
			ram: offline ? 0 : Math.max(0, Math.min(99, server.ram + scenario.ramOffset)),
			disk: offline ? 0 : Math.max(0, Math.min(99, server.disk + scenario.diskOffset))
		};
	});
	const activeServers = servers.filter(server => server.status !== 'Offline');
	const average = key => Math.round(activeServers.reduce((sum, server) => sum + server[key], 0) / activeServers.length);
	const cpu = average('cpu');
	const ram = average('ram');
	const offlineCount = servers.length - activeServers.length;
	const activeAlerts = scenario.alerts.filter(alert => alert.level !== 'resolved').length;
	const metricValues = [cpu, activeServers.length, offlineCount, activeAlerts, ram];
	document.querySelectorAll('.metric-value').forEach((node, index) => {
		if (index >= metricValues.length) return;
		const suffix = index === 0 || index === 4 ? '%' : index === 1 ? ' / 28' : '';
		node.innerHTML = `${metricValues[index]}${suffix ? `<span class="metric-unit">${suffix}</span>` : ''}`;
	});
	updateStorageUsage(scenario.storageUsed, 10);
	updatedAt.textContent = `ATUALIZADO · ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
	const period = document.querySelector('.period-btn.active')?.dataset.period || '6';
	performanceChart.data.labels = timeLabels[period];
	performanceChart.data.datasets[0].data = [...chartData[period].cpu.slice(0, -1), cpu];
	performanceChart.data.datasets[1].data = [...chartData[period].ram.slice(0, -1), ram];
	performanceChart.update();
	const statusClass = status => status === 'Offline' ? 'offline' : status === 'Instavel' ? 'warning' : 'online';
	const statusIcon = status => status === 'Offline' ? 'icon-server-offline' : status === 'Instavel' ? 'icon-alert' : 'icon-check-circle';
	const serverRows = servers.slice(0, 4).map(server => {
		const usageClass = server.cpu >= 80 ? 'bad' : server.cpu >= 65 ? 'warning' : 'good';
		return `<tr><td><span class="server-name"><span class="status-dot ${statusClass(server.status) === 'online' ? '' : statusClass(server.status)}"></span>${server.name}</span></td><td><span class="table-status ${statusClass(server.status)}"><svg aria-hidden="true"><use href="#${statusIcon(server.status)}"/></svg>${server.status}</span></td><td><span class="usage"><span class="usage-track"><span class="usage-fill ${usageClass}" style="width:${server.cpu}%"></span></span><span class="mono">${server.cpu}%</span></span></td><td class="mono">${server.ram}%</td><td class="mono">${server.disk}%</td></tr>`;
	}).join('');
	document.querySelector('#servers tbody').innerHTML = serverRows;
	const serverHeaderHtml = '<div class="dialog-server header"><span><svg class="table-icon" aria-hidden="true"><use href="#icon-server"/></svg>Servidor</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-check-circle"/></svg>Status</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-cpu"/></svg>CPU</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-memory"/></svg>RAM</span><span><svg class="table-icon" aria-hidden="true"><use href="#icon-storage"/></svg>Disco</span></div>';
	const serverDialogRows = servers.map(server => `<div class="dialog-server"><span class="server-name"><span class="status-dot ${statusClass(server.status) === 'online' ? '' : statusClass(server.status)}"></span>${server.name}</span><span class="dialog-status ${statusClass(server.status)}"><svg aria-hidden="true"><use href="#${statusIcon(server.status)}"/></svg>${server.status}</span><span class="mono">${server.cpu}%</span><span class="mono">${server.ram}%</span><span class="mono">${server.disk}%</span></div>`).join('');
	serverList.innerHTML = `${serverHeaderHtml}${serverDialogRows}`;
	const alertHtml = scenario.alerts.map(alert => `<div class="alert"><span class="alert-icon ${alert.level}"><svg aria-hidden="true"><use href="#${alert.icon}"/></svg></span><div><div class="alert-title">${alert.title}</div><div class="alert-detail">${alert.detail}</div></div><span class="alert-time"><svg aria-hidden="true"><use href="#icon-clock"/></svg>${alert.time}</span></div>`).join('');
	document.querySelector('#alerts .alert-list').innerHTML = alertHtml;
	const dialogAlertHtml = scenario.alerts.map(alert => `<div class="dialog-alert"><span class="alert-icon ${alert.level}"><svg aria-hidden="true"><use href="#${alert.icon}"/></svg></span><div><div class="alert-title">${alert.title}</div><div class="alert-detail">${alert.detail}</div></div><span class="alert-time">${alert.time}</span></div>`).join('');
	document.querySelector('#notificationsDialog .dialog-list').innerHTML = dialogAlertHtml;
	document.querySelector('#alertsDialog .dialog-list').innerHTML = dialogAlertHtml;
	document.querySelector('#alertsDialog .dialog-header p').textContent = `${activeAlerts} eventos aguardam atencao`;
	document.querySelector('#alerts .view-all').textContent = `${String(activeAlerts).padStart(2, '0')} ATIVOS`;
	document.querySelectorAll('.nav-count').forEach(node => { node.textContent = String(activeAlerts).padStart(2, '0'); });
	document.querySelectorAll('.topbar-alert-link').forEach(link => link.setAttribute('aria-label', `Abrir alertas: ${activeAlerts} ativos`));
};
refreshDashboard();
setInterval(refreshDashboard, 30000);
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
	document.getElementById(button.dataset.dialog).showModal();
}));
document.getElementById('notificationsButton').addEventListener('click', () => document.getElementById('notificationsDialog').showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
	if (event.target === dialog) dialog.close();
}));
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
	overview: { title: 'Visao geral', subtitle: 'Acompanhe a saude e o desempenho da sua infraestrutura.' },
	servers: { title: 'Servidores', subtitle: 'Estado e uso dos nos monitorados.' },
	storage: { title: 'Armazenamento', subtitle: 'Uso e capacidade de armazenamento do data center.' },
	alerts: { title: 'Alertas', subtitle: 'Eventos da infraestrutura que precisam de atencao.' }
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
