'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = {};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '..', 'monitoring.js'), 'utf8'), context);
const { ServerMonitoringService } = context;
let now = 1_000_000;
const events = [];
const monitor = new ServerMonitoringService({ now: () => now, onAlert: alert => events.push(alert) });
const telemetry = (values = {}) => ({
	serverId: 'srv-test-01',
	cpu: 50,
	memory: 50,
	diskUsed: 50,
	diskTotal: 100,
	...values
});

monitor.ingest(telemetry({ cpu: 85, memory: 85, diskUsed: 85 }));
assert.equal(monitor.getAlerts().length, 0, '85% exatos nao devem disparar alerta');

monitor.ingest(telemetry({ cpu: 85.1, memory: 86, diskUsed: 86 }));
assert.equal(monitor.getAlerts().length, 3, 'CPU, memoria e disco acima de 85% devem alertar');
assert.equal(monitor.getActiveAlertCount(), 3);
assert.equal(events.length, 3);
monitor.ingest(telemetry({ cpu: 90, memory: 90, diskUsed: 90 }));
assert.equal(monitor.getAlerts().length, 3, 'um alerta ativo nao deve ser duplicado a cada leitura');

monitor.ingest(telemetry({ cpu: 85, memory: 40, diskUsed: 40 }));
assert.equal(monitor.getAlerts().filter(alert => alert.level === 'resolved').length, 3);
assert.equal(monitor.getActiveAlertCount(), 0);

now += 120_000;
assert.equal(monitor.checkOffline(), false, 'nao deve marcar offline antes de completar 2 minutos');
now += 1;
assert.equal(monitor.checkOffline(), true, 'deve marcar offline apos mais de 2 minutos sem dados');
assert.equal(monitor.getAlerts()[0].type, 'offline');
assert.equal(monitor.checkOffline(), false, 'nao deve duplicar alerta offline');

now += 1;
monitor.ingest(telemetry());
assert.equal(monitor.getAlerts().find(alert => alert.type === 'offline').level, 'resolved');
assert.equal(monitor.getActiveAlertCount(), 0);
assert.equal(monitor.getServers()[0].offline, false);
assert.throws(() => monitor.ingest(telemetry({ cpu: 101 })), error => error.name === 'RangeError');
assert.throws(() => monitor.ingest(telemetry({ diskUsed: 101 })), error => error.name === 'RangeError');
assert.throws(() => monitor.ingest(telemetry({ diskTotal: 0 })), error => error.name === 'RangeError');

console.log('OK: limites de alerta, deduplicacao, timeout offline, recuperacao e validacao.');
