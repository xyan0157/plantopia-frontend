/**
 * Vercel Serverless Function - API Proxy
 * This function proxies requests from the frontend (HTTPS) to the backend (HTTP)
 * to avoid Mixed Content errors in production
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path from query parameters
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';
    
    // Construct the backend URL
    const backendUrl = `http://34.70.141.84/api/v1/${apiPath}`;
    
    console.log(`[Proxy] Forwarding ${req.method} request to: ${backendUrl}`);
    
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward any additional headers if needed
        ...req.headers,
        // Remove host header to avoid conflicts
        host: undefined,
      },
    };
    
    // Add body for POST, PUT, PATCH requests
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // Make request to backend
    const response = await fetch(backendUrl, fetchOptions);
    
    // Get response data
    const data = await response.text();
    
    // Try to parse as JSON, if fails return as text
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch {
      responseData = data;
    }
    
    // Return response with same status code
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      details: 'Failed to connect to backend API'
    });
  }
}

// Vercel configuration for this function
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};