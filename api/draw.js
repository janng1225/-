import { kv } from '@vercel/kv';
import { getPrizesWithStock, buildPool, pickIndex, logRecord } from './_util.js';

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    let attempts = 0;
    while(attempts < 8){
      attempts++;
      const prizes = await getPrizesWithStock();
      const pool = buildPool(prizes);
      if(!pool.length){
        res.status(409).json({ error: 'SOLD_OUT', message: '所有可抽奖品均已抽完' });
        return;
      }
      const idx = pickIndex(pool);
      const p = prizes[idx];

      if(p.stock === -1){
        await logRecord(p.id, p.name);
        res.status(200).json({ prize: p, soldout: false });
        return;
      }

      // Atomic decrement; if negative, revert and retry
      const key = `stock:${p.id}`;
      const newVal = await kv.decr(key);
      if(Number(newVal) >= 0){
        // success
        await logRecord(p.id, p.name);
        p.stock = Number(newVal);
        res.status(200).json({ prize: p, soldout: false });
        return;
      } else {
        // revert to 0 and retry
        await kv.incr(key);
        continue;
      }
    }
    res.status(423).json({ error: 'BUSY', message: '并发较高，请重试' });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
