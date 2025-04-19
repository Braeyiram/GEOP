import { storage } from '../storage';
import { SmtpProvider } from '@shared/schema';
import { createTransport, Transporter } from 'nodemailer';

// Cache SMTP connections
class SmtpConnectionPool {
  private connections: Map<number, { transporter: Transporter, lastUsed: Date }>;
  private readonly maxConnectionAge = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    this.connections = new Map();
    
    // Periodic cleanup of old connections
    setInterval(() => {
      const now = new Date();
      for (const [id, { lastUsed }] of this.connections) {
        if (now.getTime() - lastUsed.getTime() > this.maxConnectionAge) {
          this.connections.delete(id);
        }
      }
    }, 60 * 1000); // Check every minute
  }
  
  async getConnection(provider: SmtpProvider): Promise<Transporter> {
    if (this.connections.has(provider.id)) {
      const connection = this.connections.get(provider.id);
      connection!.lastUsed = new Date();
      return connection!.transporter;
    }
    
    // Create new connection
    const transporter = createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.isSecure,
      auth: {
        user: provider.username,
        pass: provider.password
      }
    });
    
    // Verify connection
    await transporter.verify();
    
    // Store in cache
    this.connections.set(provider.id, {
      transporter,
      lastUsed: new Date()
    });
    
    return transporter;
  }
}

const connectionPool = new SmtpConnectionPool();

// Get the appropriate SMTP provider based on volume, region, and provider health
export async function getSmtpProvider(recipientEmail: string, volume: number): Promise<SmtpProvider | null> {
  // Extract region from email domain or use IP geolocation in a real implementation
  // For this example we'll extract from a region tag in the email or default to NA
  let region = 'NA';
  
  if (recipientEmail.includes('+eu@')) {
    region = 'EU';
  } else if (recipientEmail.includes('+apac@')) {
    region = 'APAC';
  }
  
  // Get providers for the region
  const providers = await storage.getSmtpProvidersByRegion(region);
  
  if (providers.length === 0) {
    // Fall back to any active provider if no region-specific providers
    const allProviders = await storage.getSmtpProviders();
    const activeProviders = allProviders.filter(p => p.isActive);
    
    if (activeProviders.length === 0) {
      return null;
    }
    
    // Sort by priority
    return activeProviders.sort((a, b) => a.priority - b.priority)[0];
  }
  
  // For high volume, select providers with sufficient capacity
  if (volume > 1000) {
    const highCapacityProviders = providers.filter(p => p.maxSendsPerHour >= volume);
    
    if (highCapacityProviders.length > 0) {
      return highCapacityProviders[0];
    }
    
    // If no single provider has enough capacity, just return the highest capacity one
    return providers.sort((a, b) => b.maxSendsPerHour - a.maxSendsPerHour)[0];
  }
  
  // For low volume, just use the highest priority provider
  return providers[0];
}

// Send an email through the appropriate SMTP provider
export async function sendEmail(options: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  trackingId: string;
  volume?: number;
}): Promise<{ 
  success: boolean;
  messageId?: string;
  providerId?: number;
  error?: string;
}> {
  try {
    const volume = options.volume || 1;
    const provider = await getSmtpProvider(options.to, volume);
    
    if (!provider) {
      throw new Error('No suitable SMTP provider found');
    }
    
    const transporter = await connectionPool.getConnection(provider);
    
    // Add tracking pixel to HTML content if it doesn't already have one
    let html = options.html;
    if (!html.includes('tracking-pixel')) {
      const trackingPixel = `<img src="http://${process.env.HOST || 'localhost'}:5000/api/tracking/open/${options.trackingId}" alt="" width="1" height="1" style="display:none" class="tracking-pixel" />`;
      html = html.replace('</body>', `${trackingPixel}</body>`);
    }
    
    // Add tracking to all links
    html = html.replace(/<a\s+href="([^"]+)"/gi, (match, url) => {
      const trackingUrl = `http://${process.env.HOST || 'localhost'}:5000/api/tracking/click/${options.trackingId}?url=${encodeURIComponent(url)}`;
      return `<a href="${trackingUrl}"`;
    });
    
    const result = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
      headers: {
        'X-Tracking-ID': options.trackingId
      }
    });
    
    // Log success metrics
    storage.createSystemMetric({
      metricName: 'email_sent',
      metricValue: 'success',
      region: provider.region
    }).catch(console.error);
    
    return {
      success: true,
      messageId: result.messageId,
      providerId: provider.id
    };
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Log failure metrics
    storage.createSystemMetric({
      metricName: 'email_sent',
      metricValue: 'failure',
      region: 'Global'
    }).catch(console.error);
    
    return {
      success: false,
      error: (error as Error).message
    };
  }
}
