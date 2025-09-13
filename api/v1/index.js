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
  
  console.log(`[V1-INDEX] ${req.method} request received`);
  console.log('[V1-INDEX] Request body:', req.body);
  console.log('[V1-INDEX] Request headers:', req.headers);
  console.log('[V1-INDEX] Request URL:', req.url);
  console.log('[V1-INDEX] Request query:', req.query);
  
  // Construct backend URL for root path
  const backendUrl = 'http://34.70.141.84/api/v1/';
  
  try {
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, image/*, text/*',
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };
    
    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('[V1-INDEX] Request body JSON:', fetchOptions.body);
    }
    
    console.log('[V1-INDEX] Fetch options:', JSON.stringify(fetchOptions, null, 2));
    
    // Forward the request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    console.log('[V1-INDEX] Response status:', response.status);
    console.log('[V1-INDEX] Response content-type:', response.headers.get('content-type'));
    
    // Check response content type and handle accordingly
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.startsWith('image/')) {
      // For images, stream the response
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.byteLength);
      res.status(response.status).send(Buffer.from(buffer));
    } else if (contentType && contentType.includes('application/json')) {
      // For JSON responses
      const data = await response.json();
      console.log('[V1-INDEX] Response data:', data);
      res.status(response.status).json(data);
    } else {
      // For text responses
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('[V1-INDEX] Error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to backend', 
      details: error.message,
      method: req.method
    });
  }
}
