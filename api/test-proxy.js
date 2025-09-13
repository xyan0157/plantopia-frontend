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
  
  console.log(`[TEST-PROXY] ${req.method} request received`);
  console.log('[TEST-PROXY] Request body:', req.body);
  console.log('[TEST-PROXY] Request headers:', req.headers);
  
  // Test the actual backend call
  try {
    const backendUrl = 'http://34.70.141.84/api/v1/recommendations';
    const testBody = {
      user_preferences: {
        location: "Richmond",
        location_type: "suburb",
        area_m2: 50,
        sunlight: "partial_shade",
        wind_exposure: "moderate",
        containers: true,
        container_sizes: ["small"],
        goal: "edible",
        edible_types: ["vegetable"],
        ornamental_types: ["flower"],
        maintenance_level: "low",
        budget: "low",
        experience_level: "beginner",
        time_available: "low",
        organic_only: false
      },
      max_recommendations: 5
    };
    
    console.log('[TEST-PROXY] Testing backend call to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testBody),
    });
    
    console.log('[TEST-PROXY] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[TEST-PROXY] Backend response data length:', JSON.stringify(data).length);
    
    res.status(200).json({
      message: 'Proxy test successful',
      backend_status: response.status,
      backend_data_length: JSON.stringify(data).length,
      test_method: req.method
    });
  } catch (error) {
    console.error('[TEST-PROXY] Error:', error);
    res.status(500).json({
      message: 'Proxy test failed',
      error: error.message
    });
  }
}
