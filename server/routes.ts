import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // GraphQL proxy route to avoid CORS issues
  app.post('/api/graphql', async (req, res) => {
    try {
      const response = await fetch('https://pim-grocery-ia64.replit.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('GraphQL proxy error:', error);
      res.status(500).json({ error: 'GraphQL request failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
