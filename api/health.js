export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log(`[HEALTH] ${req.method} request received`);
  console.log('[HEALTH] Request body:', req.body);
  console.log('[HEALTH] Request headers:', req.headers);
  
  res.status(200).json({
    message: 'Vercel function is working',
    method: req.method,
    timestamp: new Date().toISOString(),
    body: req.body
  });
}
