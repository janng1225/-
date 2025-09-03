import { setPrizes } from './_util.js';
import { checkAdmin } from './_util.js';

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if(!checkAdmin(req)){
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const body = req.body || {};
    const prizes = body.prizes || body || [];
    if(!Array.isArray(prizes)){
      res.status(400).json({ error: 'Invalid payload: expected an array of prizes' });
      return;
    }
    await setPrizes(prizes);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
