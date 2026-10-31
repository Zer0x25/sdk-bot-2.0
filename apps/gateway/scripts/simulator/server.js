#!/usr/bin/env node
'use strict';
// Standalone mock API for the actual React panel. Intentionally imports no gateway code.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

const DIST = path.resolve(__dirname, '../../../panel/web/dist');
const ACCOUNT = '33333333-3333-4333-8333-333333333333';
const CONVERSATION = '11111111-1111-4111-8111-111111111111';
const CONTACT = '22222222-2222-4222-8222-222222222222';
const ACTOR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EPOCH = '44444444-4444-4444-8444-444444444444';
const epochTime = '2026-10-20T12:00:00.000Z';
const capabilities = { attachments: false, deliveryReceipt: false, edit: false, historySync: false, readReceipt: false, reply: true };
const conversation = {
    id: CONVERSATION, accountId: ACCOUNT, contactId: CONTACT, canonicalIdentityId: CONTACT,
    aggregateVersion: '1', displayName: 'Contacto simulado', lastActivityAt: epochTime, unreadCount: 0, requiresReview: false,
    historyCoverage: { kind: 'capturing_since', capturingSince: epochTime },
    control: { accessPolicy: 'allowed', automationMode: 'ai', contextVersion: '1', controlVersion: '1',
        handoffReason: null, lifecycle: 'open', ownerId: null, profileKey: null, requiresReview: false,
        reviewReasons: [], status: 'confirmed', takenAt: null }
};
const messages = [];
let sequence = 1;
const clients = new Set();
function snapshot() { return { dataEpoch: EPOCH, seq: String(sequence) }; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function message(text, direction, authorKind) {
    const timestamp = new Date().toISOString();
    const inbound = direction === 'inbound';
    return { id: randomUUID(), conversationId: CONVERSATION, actorId: inbound ? null : ACTOR,
        authorKind, clientMessageId: null, content: { type: 'text', text }, deduplicationQuality: 'unknown',
        deliveryStatus: inbound ? 'received' : 'sent', direction, inboundSeq: inbound ? String(++sequence) : null,
        ingestedAt: timestamp, occurredAt: timestamp, providerMessageId: null, replyToId: null,
        source: inbound ? 'live' : 'panel' };
}
messages.push(message('Hola, quiero hacer una consulta.', 'inbound', 'customer'));
function json(res, status, value) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
        'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(value));
}
function broadcast(type, data) {
    const frame = `event: ${type}\ndata: ${JSON.stringify({ schemaVersion: 1, cursor: snapshot(), type, occurredAt: new Date().toISOString(), data })}\n\n`;
    for (const client of clients) client.write(frame);
}
function sendMessage(msg) {
    messages.push(msg); sequence += 1; conversation.aggregateVersion = String(Number(conversation.aggregateVersion) + 1);
    conversation.lastActivityAt = msg.occurredAt;
    if (msg.direction === 'inbound') conversation.unreadCount += 1;
    broadcast('message.created', { conversationId: CONVERSATION, messageId: msg.id, aggregateVersion: conversation.aggregateVersion });
    broadcast('conversation.updated', { conversationId: CONVERSATION, aggregateVersion: conversation.aggregateVersion });
}
function controlResponse(res) {
    json(res, 200, { conversation: clone(conversation), snapshot: snapshot() });
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 8192) { reject(new Error('body too large')); req.destroy(); } });
        req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid JSON')); } });
        req.on('error', reject);
    });
}
const controlPage = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Control del simulador</title><style>body{font:16px system-ui;max-width:650px;margin:3rem auto;padding:0 1rem;color:#17212b}form{display:flex;gap:.5rem;margin:1rem 0}input,button{font:inherit;padding:.7rem}input{flex:1}a{color:#174fc3}</style><h1>Control del inbox simulado</h1><p>Este control inyecta mensajes sintéticos en el API mock que usa el <a href="/inbox/">inbox React real</a>. No inicia el gateway ni conecta proveedores.</p><form id="incoming"><input name="text" required maxlength="4000" placeholder="Mensaje sintético entrante"><button>Injectar mensaje entrante</button></form><p id="status" role="status"></p><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();const text=new FormData(e.target).get('text');const r=await fetch('/simulator/incoming',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text})});document.querySelector('#status').textContent=r.ok?'Mensaje entrante inyectado en el inbox.':'No se pudo inyectar el mensaje.';if(r.ok)e.target.reset()}</script></html>`;
async function route(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/simulator') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(controlPage);
    }
    if (req.method === 'GET' && url.pathname.startsWith('/inbox')) return servePanel(url.pathname, res);
    if (url.pathname === '/api/v1/events' && req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(': simulated local event stream\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/session') return json(res, 200, {
        actor: { id: ACTOR, displayName: 'Operador simulado', capabilities: ['conversations:read', 'messages:send', 'control:write', 'conversations:write'] },
        policy: { globalMode: 'allowed_all', globalPaused: false, policyVersion: '1' }, snapshot: snapshot()
    });
    if (req.method === 'GET' && url.pathname === '/api/v1/accounts') return json(res, 200, { items: [
        { id: ACCOUNT, channel: 'whatsapp', displayName: 'Canal simulado', status: 'connected', capabilities }
    ] });
    if (req.method === 'GET' && url.pathname === '/api/v1/conversations') return json(res, 200, {
        items: [clone(conversation)], nextCursor: null, snapshot: snapshot()
    });
    if (req.method === 'GET' && url.pathname === `/api/v1/conversations/${CONVERSATION}`) return json(res, 200, {
        conversation: clone(conversation), channelCapabilities: capabilities, snapshot: snapshot()
    });
    if (req.method === 'GET' && url.pathname === `/api/v1/conversations/${CONVERSATION}/messages`) return json(res, 200, {
        items: [...messages], nextCursor: null, snapshot: snapshot()
    });
    if (req.method === 'POST' && url.pathname === `/api/v1/conversations/${CONVERSATION}/read`) {
        conversation.unreadCount = 0; return json(res, 200, { throughInboundSeq: String(sequence) });
    }
    if (req.method === 'POST' && url.pathname === '/simulator/incoming') {
        let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid JSON' }); }
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000) return json(res, 400, { error: 'text required (max 4000 characters)' });
        const incoming = message(body.text.trim(), 'inbound', 'customer'); sendMessage(incoming); return json(res, 201, { message: incoming });
    }
    const action = url.pathname.match(new RegExp(`^/api/v1/conversations/${CONVERSATION}/(takeover|release|messages)$`));
    if (action && req.method === 'POST') {
        let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid JSON' }); }
        if (action[1] === 'takeover') {
            conversation.control.automationMode = 'human'; conversation.control.ownerId = ACTOR;
            conversation.control.controlVersion = String(Number(conversation.control.controlVersion) + 1);
            conversation.control.takenAt = new Date().toISOString(); broadcast('control.changed', { conversationId: CONVERSATION, controlVersion: conversation.control.controlVersion, aggregateVersion: conversation.aggregateVersion });
            return controlResponse(res);
        }
        if (action[1] === 'release') {
            conversation.control.automationMode = 'ai'; conversation.control.ownerId = null;
            conversation.control.controlVersion = String(Number(conversation.control.controlVersion) + 1);
            conversation.control.takenAt = null; broadcast('control.changed', { conversationId: CONVERSATION, controlVersion: conversation.control.controlVersion, aggregateVersion: conversation.aggregateVersion });
            return controlResponse(res);
        }
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000 || body.expectedVersion !== conversation.control.controlVersion || conversation.control.automationMode !== 'human') {
            return json(res, 409, { error: { code: 'CONTROL_VERSION_CONFLICT', message: 'Control no disponible.' } });
        }
        const outgoing = { ...message(body.text.trim(), 'outbound', 'operator'), clientMessageId: body.clientMessageId || null };
        sendMessage(outgoing); return json(res, 202, { clientMessageId: outgoing.clientMessageId, messageId: outgoing.id });
    }
    json(res, 404, { error: { code: 'NOT_FOUND', message: 'Not found' } });
}
function servePanel(pathname, res) {
    let relative = pathname.slice('/inbox'.length);
    if (!relative || relative === '/') relative = '/index.html';
    let file = path.resolve(DIST, `.${relative}`);
    if (file !== DIST && !file.startsWith(`${DIST}${path.sep}`)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (path.extname(file)) { res.writeHead(404); return res.end('Not found'); }
        file = path.join(DIST, 'index.html');
    }
    let real; try { real = fs.realpathSync(file); } catch { res.writeHead(503); return res.end('Build panel no disponible; ejecuta npm --prefix apps/panel run build'); }
    if (!real.startsWith(`${DIST}${path.sep}`)) { res.writeHead(403); return res.end(); }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'content-type': types[path.extname(real)] || 'application/octet-stream', 'cache-control': path.extname(real) === '.html' ? 'no-cache' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
    fs.createReadStream(real).pipe(res);
}
const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 4179 : Number(process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
const server = http.createServer((req, res) => { void route(req, res).catch(() => { if (!res.headersSent) json(res, 500, { error: 'simulator error' }); else res.destroy(); }); });
server.listen(port, '127.0.0.1', () => console.log(`Inbox simulado: http://127.0.0.1:${server.address().port}/inbox/ · control: /simulator`));
process.stdin.on('data', chunk => { if (chunk.toString().trim() === 'stop') server.close(() => process.exit(0)); });
