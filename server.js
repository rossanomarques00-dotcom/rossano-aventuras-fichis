'use strict';
// Servidor multissala do ROSSANO AVENTURA FICHIS.
// O limite configurável protege cada instância; milhões de jogadores exigem
// várias instâncias, balanceador e armazenamento/pub-sub partilhados.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const SAVE_FILE = path.join(ROOT, 'world-data.json');
const MAX_PLAYERS_PER_ROOM = Math.max(2, Math.min(200, Number(process.env.MAX_PLAYERS_PER_ROOM || 50)));
const MAX_TOTAL_PLAYERS = Math.max(MAX_PLAYERS_PER_ROOM, Number(process.env.MAX_TOTAL_PLAYERS || 500));
const MAX_BLOCKS_PER_ROOM = 5000;
const rooms = new Map();
const players = new Map();
function roomName(v) { return String(v || 'aldeia-1').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'aldeia-1'; }
function getRoom(name) {
  if (!rooms.has(name)) rooms.set(name, {name, players: new Map(), blocks: new Map()});
  return rooms.get(name);
}
function safeName(v) { return String(v || 'Player').replace(/[<>\r\n]/g, '').trim().slice(0, 16) || 'Player'; }
function send(ws, obj) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function broadcast(room, obj, except) {
  const data = JSON.stringify(obj);
  for (const ws of room.players.values()) if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(data);
}
function validPos(m) { return [m.x,m.y,m.z,m.yaw].every(Number.isFinite) && Math.abs(m.x)<100000 && Math.abs(m.z)<100000 && m.y>-100 && m.y<200; }
function persist() {
  try {
    const data = {version: 2, rooms: Array.from(rooms.values()).map(r => ({name:r.name, blocks:Array.from(r.blocks.values())}))};
    fs.writeFileSync(SAVE_FILE, JSON.stringify(data));
  } catch (e) { console.error('Não foi possível guardar os mundos:', e.message); }
}
try {
  const saved = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  if (saved && Array.isArray(saved.rooms)) {
    for (const item of saved.rooms) if (item && Array.isArray(item.blocks)) {
      const r = getRoom(roomName(item.name));
      for (const b of item.blocks) if (Array.isArray(b) && b.length === 4) r.blocks.set(`${b[0]},${b[1]},${b[2]}`, b);
    }
  } else if (saved && Array.isArray(saved.blocks)) {
    const r = getRoom('aldeia-1');
    for (const b of saved.blocks) if (Array.isArray(b) && b.length === 4) r.blocks.set(`${b[0]},${b[1]},${b[2]}`, b);
  }
} catch (_) {}
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (pathname === '/health') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true, game:'ROSSANO AVENTURA FICHIS', players:players.size, maxPlayers:MAX_TOTAL_PLAYERS, rooms:rooms.size, maxPlayersPerRoom:MAX_PLAYERS_PER_ROOM}));
  }
  if (pathname !== '/' && pathname !== '/index.html') { res.writeHead(404); return res.end('Não encontrado'); }
  fs.readFile(path.join(ROOT, 'index.html'), (err, data) => {
    if (err) { res.writeHead(500); return res.end('Não foi possível abrir o jogo.'); }
    res.writeHead(200, {'content-type':'text/html; charset=utf-8', 'x-content-type-options':'nosniff', 'referrer-policy':'strict-origin-when-cross-origin'});
    res.end(data);
  });
});
const wss = new WebSocket.Server({server, maxPayload: 4096, perMessageDeflate: false});
wss.on('connection', ws => {
  ws.isAlive = true; ws.joined = false; ws.messageWindow = Date.now(); ws.messageCount = 0;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    const now = Date.now();
    if (now - ws.messageWindow > 1000) { ws.messageWindow = now; ws.messageCount = 0; }
    if (++ws.messageCount > 35) { ws.close(1008, 'Limite de mensagens'); return; }
    let m; try { m = JSON.parse(raw.toString()); } catch (_) { return; }
    if (!m || typeof m.type !== 'string') return;
    if (m.type === 'join' && !ws.joined) {
      if (players.size >= MAX_TOTAL_PLAYERS) { send(ws, {type:'error', code:'SERVER_FULL', message:'Servidor cheio. Tenta novamente mais tarde.'}); return ws.close(1008, 'Servidor cheio'); }
      const rn = roomName(m.room);
      const room = getRoom(rn);
      if (room.players.size >= MAX_PLAYERS_PER_ROOM) { send(ws, {type:'error', code:'ROOM_FULL', message:'Esta sala está cheia. Escolhe outra sala.'}); return ws.close(1008, 'Sala cheia'); }
      const id = crypto.randomUUID();
      ws.playerId = id; ws.roomName = rn; ws.room = room; ws.joined = true;
      ws.player = {id, name:safeName(m.name), color:0x38a6e8, x:8.5, y:20, z:8.5, yaw:0, language:['pt','en','es'].includes(m.language)?m.language:'pt'};
      players.set(id, ws); room.players.set(id, ws);
      send(ws, {type:'welcome', id, room:rn, players:Array.from(room.players.values()).filter(c=>c!==ws).map(c=>c.player), blocks:Array.from(room.blocks.values()), roomPlayers:room.players.size, maxPlayersPerRoom:MAX_PLAYERS_PER_ROOM});
      broadcast(room, {type:'player_join', player:ws.player, roomPlayers:room.players.size}, ws);
      return;
    }
    if (!ws.joined) return;
    const room = ws.room;
    if (m.type === 'move' && validPos(m)) {
      Object.assign(ws.player, {x:m.x,y:m.y,z:m.z,yaw:m.yaw,name:safeName(m.name || ws.player.name)});
      broadcast(room, {type:'player_move', player:ws.player}, ws); return;
    }
    if (m.type === 'chat' && typeof m.text === 'string') {
      const text = m.text.replace(/[<>\r\n]/g, '').trim().slice(0,180);
      if (text) broadcast(room, {type:'chat', name:ws.player.name, text, language:ws.player.language}); return;
    }
    if (m.type === 'block' && Number.isInteger(m.x) && Number.isInteger(m.y) && Number.isInteger(m.z) && Number.isInteger(m.block) && Math.abs(m.x)<100000 && Math.abs(m.z)<100000 && m.y>=-8 && m.y<=60 && m.block>=-1 && m.block<=100) {
      const key = `${m.x},${m.y},${m.z}`;
      if (m.block < 0) room.blocks.delete(key);
      else if (room.blocks.size < MAX_BLOCKS_PER_ROOM || room.blocks.has(key)) room.blocks.set(key, [m.x,m.y,m.z,m.block]);
      persist(); broadcast(room, {type:'block', x:m.x,y:m.y,z:m.z,block:m.block}, ws);
    }
  });
  ws.on('close', () => {
    if (ws.joined) {
      players.delete(ws.playerId); ws.room.players.delete(ws.playerId);
      broadcast(ws.room, {type:'player_leave', id:ws.playerId, roomPlayers:ws.room.players.size});
      if (!ws.room.players.size && !ws.room.blocks.size) rooms.delete(ws.roomName);
    }
  });
  ws.on('error', () => {});
});
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); }
}, 30000);
server.listen(PORT, HOST, () => console.log(`ROSSANO AVENTURA FICHIS em http://localhost:${PORT} — ${MAX_TOTAL_PLAYERS} ligações por instância; ${MAX_PLAYERS_PER_ROOM} por sala.`));
process.on('SIGINT', () => { clearInterval(heartbeat); persist(); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { clearInterval(heartbeat); persist(); server.close(() => process.exit(0)); });
