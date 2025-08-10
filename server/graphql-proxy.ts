import { Request, Response } from 'express';

const EXTERNAL_GRAPHQL_ENDPOINT = 'https://pim-grocery-ia64.replit.app/graphql';

export async function graphqlProxyHandler(req: Request, res: Response) {
  try {
    console.log('📡 Proxying GraphQL request to external server...');
    
    // Forward the request to the external GraphQL server
    const response = await fetch(EXTERNAL_GRAPHQL_ENDPOINT, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward user agent and other relevant headers
        'User-Agent': req.get('User-Agent') || 'Musgrave-Client/1.0'
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    
    // Forward the status code and response data
    res.status(response.status).json(data);
    
    if (response.ok) {
      console.log('✅ GraphQL request successful');
    } else {
      console.log('❌ GraphQL request failed:', response.status, data);
    }
    
  } catch (error) {
    console.error('❌ Error proxying GraphQL request:', error);
    res.status(500).json({ 
      errors: [{ 
        message: 'Internal server error while proxying GraphQL request',
        extensions: { code: 'PROXY_ERROR' }
      }] 
    });
  }
}