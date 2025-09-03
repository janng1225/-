import { setPrizes } from './_util.js';
import { DEFAULT_PRIZES } from './_defaults.js';
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
    await setPrizes(DEFAULT_PRIZES);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
