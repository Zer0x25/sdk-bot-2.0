const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

function start() {
    const child = spawn(process.execPath, [path.join(__dirname, '../../scripts/simulator/server.js'), '--port', '0'], {
        env: { PATH: process.env.PATH }, stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    return { child, origin: new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`server did not start: ${output}`)), 5000);
        child.stdout.on('data', chunk => {
            output += chunk;
            const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
            if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
        });
        child.on('error', reject);
        child.on('exit', code => { if (code !== null && code !== 0) reject(new Error(`server exited: ${code}`)); });
    }) };
}

function request(origin, pathname, method = 'GET', body) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${origin}${pathname}`, { method, headers: body ? { 'content-type': 'application/json' } : {} }, res => {
            let raw = ''; res.on('data', chunk => raw += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }));
        });
        req.on('error', reject); req.end(body ? JSON.stringify(body) : undefined);
    });
}

test('serves current React inbox and simulates takeover, incoming, operator send, and release via its public API', async () => {
    const { child, origin } = start();
    try {
        const base = await origin;
        const ui = await request(base, '/inbox/');
        assert.equal(ui.status, 200);
        const bundlePath = ui.body.match(/src="([^"]+\.js)"/)?.[1];
        assert.ok(bundlePath);
        assert.equal((await request(base, bundlePath)).status, 200);
        assert.match((await request(base, '/simulator')).body, /Injectar mensaje entrante/);

        const get = async p => JSON.parse((await request(base, `/api/v1${p}`)).body);
        const post = async (p, data) => request(base, `/api/v1${p}`, 'POST', data);
        const convs = await get('/conversations');
        const id = convs.items[0].id;
        assert.equal(convs.items[0].control.automationMode, 'ai');
        const takeover = await post(`/conversations/${id}/takeover`, { expectedVersion: '1' });
        assert.equal(takeover.status, 200);
        assert.equal(JSON.parse(takeover.body).conversation.control.automationMode, 'human');

        const initialCount = (await get(`/conversations/${id}/messages`)).items.length;
        const rejected = await request(base, '/simulator/incoming', 'POST', { text: '   ' });
        assert.equal(rejected.status, 400);
        assert.equal((await get(`/conversations/${id}/messages`)).items.length, initialCount);
        const incoming = await request(base, '/simulator/incoming', 'POST', { text: 'Mensaje de prueba' });
        assert.equal(incoming.status, 201);
        assert.equal(JSON.parse(incoming.body).message.direction, 'inbound');
        const history = await get(`/conversations/${id}/messages`);
        assert.equal(history.items.at(-1).content.text, 'Mensaje de prueba');

        const sent = await post(`/conversations/${id}/messages`, {
            expectedVersion: '2', clientMessageId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', text: 'Respuesta simulada'
        });
        assert.equal(sent.status, 202);
        assert.equal((await get(`/conversations/${id}/messages`)).items.at(-1).content.text, 'Respuesta simulada');
        const released = await post(`/conversations/${id}/release`, { expectedVersion: '2', resumePolicy: 'future_only' });
        assert.equal(released.status, 200);
        assert.equal(JSON.parse(released.body).conversation.control.automationMode, 'ai');
        assert.equal((await request(base, '/api/v1/')).status, 404);
    } finally {
        child.stdin.end('stop');
        await new Promise(resolve => child.once('exit', resolve));
    }
});
