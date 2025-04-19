import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { sendEmail, getSmtpProvider } from '../utils/smtp-router';
import { InsertEmail } from '@shared/schema';
import { z } from 'zod';

// Validation schema for sending an email
export const sendEmailSchema = z.object({
  to: z.string().email(),
  from: z.string().email(),
  subject: z.string().min(1).max(998), // RFC 2822 limits subject to 998 characters
  html: z.string().optional(),
  text: z.string().optional(),
  templateId: z.number().optional(),
  variables: z.record(z.string()).optional(),
  region: z.string().optional().default('Global'),
  metadata: z.record(z.any()).optional(),
  volume: z.number().optional().default(1)
});

export type SendEmailRequest = z.infer<typeof sendEmailSchema>;

// Process variables in a template
function processTemplate(content: string, variables: Record<string, string> = {}): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    return variables[variable.trim()] || match;
  });
}

// Check if the recipient's region is blocked
async function checkRegionCompliance(to: string, region: string): Promise<{ allowed: boolean, reason?: string }> {
  // In a real implementation, this would check the recipient's country
  // against a compliance database or use more sophisticated rules
  
  // Extract country code from email domain or use IP geolocation
  // For this example we'll check for region codes in the email
  const countryMarkers = {
    'cu': 'CU', // Cuba
    'ir': 'IR', // Iran
    'kp': 'KP', // North Korea
    'sy': 'SY', // Syria
    'ua': 'UA'  // Ukraine
  };
  
  for (const [marker, code] of Object.entries(countryMarkers)) {
    if (to.toLowerCase().includes(`+${marker}@`) || to.toLowerCase().includes(`.${marker}`)) {
      const blockedRegion = await storage.getBlockedRegionByCode(code);
      
      if (blockedRegion) {
        return {
          allowed: false,
          reason: blockedRegion.reason
        };
      }
    }
  }
  
  return { allowed: true };
}

// Send an email and record it in the database
export async function processEmailSend(request: SendEmailRequest): Promise<{
  success: boolean;
  emailId?: number;
  trackingId?: string;
  message: string;
  error?: string;
}> {
  try {
    // Check compliance
    const compliance = await checkRegionCompliance(request.to, request.region || 'Global');
    if (!compliance.allowed) {
      return {
        success: false,
        message: 'Recipient is in a blocked region',
        error: `Compliance violation: ${compliance.reason}`
      };
    }
    
    // Generate tracking ID
    const trackingId = uuidv4();
    
    // Process template if templateId is provided
    let html = request.html || '';
    let text = request.text || '';
    
    if (request.templateId) {
      const template = await storage.getTemplate(request.templateId);
      if (!template) {
        return {
          success: false,
          message: 'Template not found',
          error: `Template with ID ${request.templateId} does not exist`
        };
      }
      
      html = processTemplate(template.htmlContent, request.variables);
      text = processTemplate(template.textContent, request.variables);
    }
    
    if (!html && !text) {
      return {
        success: false,
        message: 'Email content is required',
        error: 'Either html, text, or templateId must be provided'
      };
    }
    
    // Get SMTP provider
    const provider = await getSmtpProvider(request.to, request.volume || 1);
    if (!provider) {
      return {
        success: false,
        message: 'No suitable SMTP provider available',
        error: 'Failed to find an active SMTP provider for this request'
      };
    }
    
    // Record the email in the database
    const emailData: InsertEmail = {
      to: request.to,
      from: request.from,
      subject: request.subject,
      templateId: request.templateId || null,
      smtpProviderId: provider.id,
      region: request.region || provider.region,
      metadata: request.metadata || {},
      trackingId
    };
    
    const emailRecord = await storage.createEmail(emailData);
    
    // Send the email
    const sendResult = await sendEmail({
      to: request.to,
      from: request.from,
      subject: request.subject,
      html: html || '<p>This email does not have HTML content</p>',
      text: text || 'This email does not have text content',
      trackingId,
      volume: request.volume
    });
    
    if (!sendResult.success) {
      // Update email status to failed
      await storage.updateEmailStatus(emailRecord.id, 'failed');
      
      return {
        success: false,
        emailId: emailRecord.id,
        trackingId,
        message: 'Failed to send email',
        error: sendResult.error
      };
    }
    
    // Update email status to sent
    await storage.updateEmailStatus(emailRecord.id, 'sent');
    
    return {
      success: true,
      emailId: emailRecord.id,
      trackingId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Email processing error:', error);
    return {
      success: false,
      message: 'Failed to process email request',
      error: (error as Error).message
    };
  }
}

// Get email statistics for dashboard
export async function getEmailStatistics(): Promise<{
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
}> {
  const emails = await storage.getEmails(1000); // Get last 1000 emails
  const providers = await storage.getSmtpProviders();
  
  const totalSent = emails.length;
  const delivered = emails.filter(email => email.status === 'delivered' || email.status === 'opened' || email.status === 'clicked').length;
  const opened = emails.filter(email => email.openedAt !== null).length;
  const clicked = emails.filter(email => email.clickedAt !== null).length;
  
  // Calculate rates
  const deliveryRate = totalSent ? (delivered / totalSent) * 100 : 0;
  const openRate = delivered ? (opened / delivered) * 100 : 0;
  const clickRate = opened ? (clicked / opened) * 100 : 0;
  
  // Group by region
  const regionCounts: Record<string, number> = {};
  for (const email of emails) {
    regionCounts[email.region] = (regionCounts[email.region] || 0) + 1;
  }
  
  const regionData = Object.entries(regionCounts).map(([region, count]) => ({
    region,
    count,
    percentage: (count / totalSent) * 100
  })).sort((a, b) => b.count - a.count);
  
  // Group by provider
  const providerCounts: Record<string, number> = {};
  for (const email of emails) {
    if (email.smtpProviderId) {
      const provider = providers.find(p => p.id === email.smtpProviderId);
      if (provider) {
        providerCounts[provider.name] = (providerCounts[provider.name] || 0) + 1;
      }
    }
  }
  
  const providerData = Object.entries(providerCounts).map(([provider, count]) => ({
    provider,
    count,
    percentage: (count / totalSent) * 100
  })).sort((a, b) => b.count - a.count);
  
  return {
    totalSent,
    deliveryRate,
    openRate,
    clickRate,
    regionData,
    providerData
  };
}
