import { kv } from '@vercel/kv';
import { DEFAULT_PRIZES } from './_defaults.js';

const KEY_PRIZES = 'PRIZES_v1';
const KEY_RECORDS = 'RECORDS_v1'; // LPUSH JSON, LTRIM to 5000

function isArray(a){ return Array.isArray(a); }

export async function ensureDefaults(){
  const exists = await kv.get(KEY_PRIZES);
  if(!exists){
    await setPrizes(DEFAULT_PRIZES);
  }
}

export async function getPrizesWithStock(){
  await ensureDefaults();
  const prizes = await kv.get(KEY_PRIZES);
  if(!isArray(prizes)) return [];
  // Fetch stock for finite items
  const stockKeys = prizes.filter(p => p.qty !== -1).map(p => `stock:${p.id}`);
  const stocks = stockKeys.length ? await kv.mget(...stockKeys) : [];
  let j = 0;
  return prizes.map(p => {
    if(p.qty === -1) return { ...p, stock: -1 };
    const s = Number(stocks[j++] ?? 0);
    return { ...p, stock: s };
  });
}

export async function setPrizes(prizes){
  // Basic sanitize
  const clean = (prizes || []).map((p, i) => ({
    id: String(p.id || `p${i+1}`),
    name: String(p.name || '未命名'),
    weight: Math.max(0, Number(p.weight)||0),
    qty: Number(p.qty)||0,
    img: String(p.img || '')
  }));
  await kv.set(KEY_PRIZES, clean);
  // init stocks for finite items
  const pipeline = kv.pipeline();
  for(const p of clean){
    if(p.qty !== -1){
      pipeline.set(`stock:${p.id}`, Number(p.qty));
    }
  }
  await pipeline.exec();
}

export function buildPool(prizes){
  const pool = [];
  for(let i=0;i<prizes.length;i++){
    const p = prizes[i];
    const available = (p.stock === -1) || (p.stock > 0);
    if(!available) continue;
    const w = Math.max(0, Number(p.weight)||0);
    for(let k=0;k<w;k++) pool.push(i);
  }
  return pool;
}

export function pickIndex(pool){
  if(!pool.length) return -1;
  const r = Math.floor(Math.random() * pool.length);
  return pool[r];
}

export async function logRecord(prizeId, name){
  const rec = { ts: Date.now(), prizeId, name };
  await kv.lpush(KEY_RECORDS, JSON.stringify(rec));
  await kv.ltrim(KEY_RECORDS, 0, 4999);
}

export async function getRecentRecords(limit=50){
  const rows = await kv.lrange(KEY_RECORDS, 0, Math.max(0, limit - 1));
  return rows.map(x => {
    try { return JSON.parse(x); } catch { return null; }
  }).filter(Boolean);
}

export const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
export function checkAdmin(req){
  const token = (req.query?.token || req.headers['x-admin-token'] || '').toString();
  return ADMIN_TOKEN && token === ADMIN_TOKEN;
}
