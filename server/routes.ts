import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { WebSocketServer, WebSocket } from "ws";
import { createRateLimiter, apiRateLimiter, emailRateLimiter, trackingRateLimiter } from "./utils/rate-limiter";

// Import services
import { processEmailSend, sendEmailSchema, getEmailStatistics } from "./services/email";
import { createTemplate, updateTemplate, createTemplateSchema, updateTemplateSchema } from "./services/template";
import { createBlockedRegion, updateBlockedRegionStatus, checkRegionCompliance, createBlockedRegionSchema } from "./services/compliance";
import { trackEmailOpen, trackEmailClick, getEmailTrackingStats, getTrackingStatistics } from "./services/tracking";

// Interfaces for WebSocket messages
interface DashboardUpdate {
  type: 'dashboardUpdate';
  stats: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    regionData: {
      region: string;
      count: number;
      percentage: number;
    }[];
    providerData: {
      provider: string;
      count: number;
      percentage: number;
    }[];
  };
  timestamp: string;
}

interface SystemMetricsUpdate {
  type: 'systemMetricsUpdate';
  metrics: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  timestamp: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Set up WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial dashboard data
    sendDashboardUpdate();
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Helper to broadcast dashboard updates to all connected clients
  function broadcastToAll(data: DashboardUpdate | SystemMetricsUpdate) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Send dashboard updates periodically
  async function sendDashboardUpdate() {
    try {
      const stats = await getEmailStatistics();
      
      const update: DashboardUpdate = {
        type: 'dashboardUpdate',
        stats,
        timestamp: new Date().toISOString()
      };
      
      broadcastToAll(update);
    } catch (error) {
      console.error('Error sending dashboard update:', error);
    }
  }
  
  // Send system metrics updates periodically
  function sendSystemMetricsUpdate() {
    // In a real implementation, these would come from actual system monitoring
    const metrics: SystemMetricsUpdate = {
      type: 'systemMetricsUpdate',
      metrics: {
        cpu: Math.floor(Math.random() * 60) + 10, // Random between 10-70%
        memory: Math.floor(Math.random() * 40) + 30, // Random between 30-70%
        storage: Math.floor(Math.random() * 40) + 10, // Random between 10-50%
        network: Math.floor(Math.random() * 60) + 20, // Random between 20-80%
      },
      timestamp: new Date().toISOString()
    };
    
    broadcastToAll(metrics);
  }
  
  // Set up periodic dashboard updates
  setInterval(sendDashboardUpdate, 10000); // Every 10 seconds
  setInterval(sendSystemMetricsUpdate, 5000); // Every 5 seconds
  
  // API Documentation endpoints
  app.get('/api/docs', (_req, res) => {
    // Convert Zod schemas to JSON Schema for documentation
    const schemas = {
      sendEmail: zodToJsonSchema(sendEmailSchema, 'sendEmail'),
      createTemplate: zodToJsonSchema(createTemplateSchema, 'createTemplate'),
      updateTemplate: zodToJsonSchema(updateTemplateSchema, 'updateTemplate'),
      createBlockedRegion: zodToJsonSchema(createBlockedRegionSchema, 'createBlockedRegion')
    };
    
    res.json({
      name: 'Global Email Orchestration Platform API',
      version: '1.0',
      endpoints: [
        { method: 'POST', path: '/api/email/send', schema: 'sendEmail', description: 'Send an email' },
        { method: 'GET', path: '/api/email/:id', description: 'Get email details' },
        { method: 'GET', path: '/api/email/stats', description: 'Get email statistics' },
        { method: 'POST', path: '/api/template', schema: 'createTemplate', description: 'Create a template' },
        { method: 'PUT', path: '/api/template/:id', schema: 'updateTemplate', description: 'Update a template' },
        { method: 'GET', path: '/api/template/:id', description: 'Get template details' },
        { method: 'GET', path: '/api/template', description: 'List all templates' },
        { method: 'DELETE', path: '/api/template/:id', description: 'Delete a template' },
        { method: 'POST', path: '/api/compliance/region', schema: 'createBlockedRegion', description: 'Block a region' },
        { method: 'PUT', path: '/api/compliance/region/:id', description: 'Update blocked region status' },
        { method: 'GET', path: '/api/compliance/region', description: 'List all blocked regions' },
        { method: 'GET', path: '/api/compliance/check/:regionCode', description: 'Check if a region is allowed' },
        { method: 'GET', path: '/api/tracking/stats', description: 'Get tracking statistics' },
        { method: 'GET', path: '/api/tracking/email/:id', description: 'Get tracking stats for an email' },
        { method: 'GET', path: '/api/tracking/open/:trackingId', description: 'Track an email open' },
        { method: 'GET', path: '/api/tracking/click/:trackingId', description: 'Track an email click' },
      ],
      schemas
    });
  });
  
  // Email endpoints
  app.post('/api/email/send', emailRateLimiter, async (req, res) => {
    try {
      const parseResult = sendEmailSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: parseResult.error.format()
        });
      }
      
      const result = await processEmailSend(parseResult.data);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Email Send Error',
          message: result.message,
          details: result.error
        });
      }
      
      // Trigger a dashboard update
      setTimeout(sendDashboardUpdate, 500);
      
      return res.status(200).json({
        success: true,
        message: result.message,
        emailId: result.emailId,
        trackingId: result.trackingId
      });
    } catch (error) {
      console.error('Email send error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process email request'
      });
    }
  });
  
  app.get('/api/email/stats', apiRateLimiter, async (_req, res) => {
    try {
      const stats = await getEmailStatistics();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get email stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get email statistics'
      });
    }
  });
  
  app.get('/api/email/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email ID'
        });
      }
      
      const email = await storage.getEmail(id);
      
      if (!email) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Email with ID ${id} not found`
        });
      }
      
      return res.status(200).json(email);
    } catch (error) {
      console.error('Get email error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get email'
      });
    }
  });
  
  // Template endpoints
  app.post('/api/template', apiRateLimiter, async (req, res) => {
    try {
      const parseResult = createTemplateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: parseResult.error.format()
        });
      }
      
      const result = await createTemplate(parseResult.data);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Template Creation Error',
          message: result.message,
          details: result.error
        });
      }
      
      return res.status(201).json({
        success: true,
        message: result.message,
        templateId: result.templateId
      });
    } catch (error) {
      console.error('Template creation error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create template'
      });
    }
  });
  
  app.put('/api/template/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID'
        });
      }
      
      const parseResult = updateTemplateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: parseResult.error.format()
        });
      }
      
      const result = await updateTemplate(id, parseResult.data);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Template Update Error',
          message: result.message,
          details: result.error
        });
      }
      
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Template update error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update template'
      });
    }
  });
  
  app.get('/api/template/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID'
        });
      }
      
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Template with ID ${id} not found`
        });
      }
      
      return res.status(200).json(template);
    } catch (error) {
      console.error('Get template error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get template'
      });
    }
  });
  
  app.get('/api/template', apiRateLimiter, async (_req, res) => {
    try {
      const templates = await storage.getTemplates();
      return res.status(200).json(templates);
    } catch (error) {
      console.error('List templates error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list templates'
      });
    }
  });
  
  app.delete('/api/template/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid template ID'
        });
      }
      
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Template with ID ${id} not found`
        });
      }
      
      const success = await storage.deleteTemplate(id);
      
      if (!success) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to delete template'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Delete template error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete template'
      });
    }
  });
  
  // Compliance endpoints
  app.post('/api/compliance/region', apiRateLimiter, async (req, res) => {
    try {
      const parseResult = createBlockedRegionSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: parseResult.error.format()
        });
      }
      
      const result = await createBlockedRegion(parseResult.data);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Region Block Error',
          message: result.message,
          details: result.error
        });
      }
      
      return res.status(201).json({
        success: true,
        message: result.message,
        regionId: result.regionId
      });
    } catch (error) {
      console.error('Block region error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to block region'
      });
    }
  });
  
  app.put('/api/compliance/region/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid region ID'
        });
      }
      
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'isActive must be a boolean'
        });
      }
      
      const result = await updateBlockedRegionStatus(id, isActive);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Region Update Error',
          message: result.message,
          details: result.error
        });
      }
      
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Update region error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update region'
      });
    }
  });
  
  app.get('/api/compliance/region', apiRateLimiter, async (_req, res) => {
    try {
      const regions = await storage.getBlockedRegions();
      return res.status(200).json(regions);
    } catch (error) {
      console.error('List regions error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list regions'
      });
    }
  });
  
  app.get('/api/compliance/check/:regionCode', apiRateLimiter, async (req, res) => {
    try {
      const { regionCode } = req.params;
      
      if (!regionCode || regionCode.length !== 2) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid region code'
        });
      }
      
      const result = await checkRegionCompliance(regionCode.toUpperCase());
      return res.status(200).json(result);
    } catch (error) {
      console.error('Check region error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check region'
      });
    }
  });
  
  // Tracking endpoints
  app.get('/api/tracking/open/:trackingId', trackingRateLimiter, async (req, res) => {
    try {
      const { trackingId } = req.params;
      
      if (!trackingId) {
        return res.status(400).send('Bad Request');
      }
      
      // Track the open event
      await trackEmailOpen(trackingId, req.headers['user-agent'], req.ip);
      
      // Return a 1x1 transparent pixel
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // 1x1 transparent GIF
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.send(pixel);
      
      // Trigger a dashboard update
      setTimeout(sendDashboardUpdate, 500);
    } catch (error) {
      console.error('Track open error:', error);
      // Still return a pixel to avoid errors in email clients
      res.setHeader('Content-Type', 'image/gif');
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.send(pixel);
    }
  });
  
  app.get('/api/tracking/click/:trackingId', trackingRateLimiter, async (req, res) => {
    try {
      const { trackingId } = req.params;
      const { url } = req.query;
      
      if (!trackingId || !url || typeof url !== 'string') {
        return res.status(400).send('Bad Request');
      }
      
      // Track the click event
      const result = await trackEmailClick(trackingId, url, req.headers['user-agent'], req.ip);
      
      // Redirect to the target URL
      res.redirect(result.redirectUrl);
      
      // Trigger a dashboard update
      setTimeout(sendDashboardUpdate, 500);
    } catch (error) {
      console.error('Track click error:', error);
      // Redirect to the URL anyway to avoid disrupting user experience
      res.redirect(typeof req.query.url === 'string' ? req.query.url : '/');
    }
  });
  
  app.get('/api/tracking/stats', apiRateLimiter, async (_req, res) => {
    try {
      const stats = await getTrackingStatistics();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get tracking stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get tracking statistics'
      });
    }
  });
  
  app.get('/api/tracking/email/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email ID'
        });
      }
      
      const stats = await getEmailTrackingStats(id);
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get email tracking stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get email tracking statistics'
      });
    }
  });
  
  // SMTP Provider endpoints
  app.get('/api/smtp', apiRateLimiter, async (_req, res) => {
    try {
      const providers = await storage.getSmtpProviders();
      return res.status(200).json(providers);
    } catch (error) {
      console.error('List SMTP providers error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list SMTP providers'
      });
    }
  });
  
  app.get('/api/smtp/:id', apiRateLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid SMTP provider ID'
        });
      }
      
      const provider = await storage.getSmtpProvider(id);
      
      if (!provider) {
        return res.status(404).json({
          error: 'Not Found',
          message: `SMTP provider with ID ${id} not found`
        });
      }
      
      return res.status(200).json(provider);
    } catch (error) {
      console.error('Get SMTP provider error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get SMTP provider'
      });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        email: 'operational',
        templates: 'operational',
        tracking: 'operational',
        compliance: 'operational'
      }
    });
  });
  
  return httpServer;
}
