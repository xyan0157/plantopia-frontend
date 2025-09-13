export default async function handler(req, res) {
  // Get the path after /api/v1/
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Construct backend URL
  const backendUrl = `http://34.70.141.84/api/v1/${apiPath}`;
  
  try {
    // Forward the request to backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to connect to backend' });
  }
}