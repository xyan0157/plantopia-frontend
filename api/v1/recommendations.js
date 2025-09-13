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
  
  console.log(`[RECOMMENDATIONS] ${req.method} request received`);
  console.log('[RECOMMENDATIONS] Request body:', req.body);
  console.log('[RECOMMENDATIONS] Request headers:', req.headers);
  
  // Construct backend URL
  const backendUrl = 'http://34.70.141.84/api/v1/recommendations';
  
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
      console.log('[RECOMMENDATIONS] Request body JSON:', fetchOptions.body);
    }
    
    console.log('[RECOMMENDATIONS] Fetch options:', JSON.stringify(fetchOptions, null, 2));
    
    // Forward the request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    console.log('[RECOMMENDATIONS] Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('[RECOMMENDATIONS] Response data length:', JSON.stringify(data).length);
    
    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[RECOMMENDATIONS] Error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to backend', 
      details: error.message,
      method: req.method
    });
  }
}
