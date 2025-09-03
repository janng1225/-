import { getPrizesWithStock, getRecentRecords } from './_util.js';

export default async function handler(req, res){
  if(req.method !== 'GET'){
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const prizes = await getPrizesWithStock();
    const records = await getRecentRecords(30);
    res.status(200).json({ prizes, records });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Server error' });
  }
}
