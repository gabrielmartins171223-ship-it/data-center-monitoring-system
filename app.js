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
	const period = button.dataset.period;
	document.querySelectorAll('.period-btn').forEach(item => item.classList.toggle('active', item === button));
	performanceChart.data.labels = timeLabels[period];
	performanceChart.data.datasets[0].data = chartData[period].cpu;
	performanceChart.data.datasets[1].data = chartData[period].ram;
	performanceChart.update();
}));
const updatedAt = document.getElementById('updatedAt');
setInterval(() => { updatedAt.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }, 30000);
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
