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
  
  // Get the path after /api/v1/
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path || '';
  
  // Construct backend URL
  const backendUrl = `http://34.70.141.84/api/v1/${apiPath}`;
  
  console.log(`[PROXY] ${req.method} request to: ${backendUrl}`);
  console.log('[PROXY] Request path:', apiPath);
  console.log('[PROXY] Request body:', req.body);
  console.log('[PROXY] Request headers:', req.headers);
  
  try {
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };
    
    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('[PROXY] Request body JSON:', fetchOptions.body);
    }
    
    console.log('[PROXY] Fetch options:', JSON.stringify(fetchOptions, null, 2));
    
    // Forward the request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    console.log('[PROXY] Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to backend', 
      details: error.message,
      path: apiPath,
      method: req.method
    });
  }
}
