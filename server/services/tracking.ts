import { storage } from '../storage';

// Track email opens
export async function trackEmailOpen(trackingId: string, userAgent?: string, ip?: string): Promise<{
  success: boolean;
  alreadyTracked: boolean;
  emailId?: number;
}> {
  try {
    const email = await storage.getEmailByTrackingId(trackingId);
    
    if (!email) {
      return {
        success: false,
        alreadyTracked: false
      };
    }
    
    // Check if already opened
    if (email.openedAt) {
      return {
        success: true,
        alreadyTracked: true,
        emailId: email.id
      };
    }
    
    // Update email tracking state
    const updatedEmail = await storage.updateEmailTracking(trackingId, 'opened');
    
    if (!updatedEmail) {
      return {
        success: false,
        alreadyTracked: false
      };
    }
    
    // Record metrics
    await storage.createSystemMetric({
      metricName: 'email_opened',
      metricValue: '1',
      region: email.region
    });
    
    return {
      success: true,
      alreadyTracked: false,
      emailId: email.id
    };
  } catch (error) {
    console.error('Email open tracking error:', error);
    return {
      success: false,
      alreadyTracked: false
    };
  }
}

// Track email link clicks
export async function trackEmailClick(trackingId: string, url: string, userAgent?: string, ip?: string): Promise<{
  success: boolean;
  alreadyTracked: boolean;
  emailId?: number;
  redirectUrl: string;
}> {
  try {
    const email = await storage.getEmailByTrackingId(trackingId);
    
    // Default to the provided URL even if tracking fails
    const redirectUrl = url || '/';
    
    if (!email) {
      return {
        success: false,
        alreadyTracked: false,
        redirectUrl
      };
    }
    
    // Always update click status on open
    const updatedEmail = await storage.updateEmailTracking(trackingId, 'clicked');
    
    // Check if already clicked
    const alreadyTracked = !!email.clickedAt;
    
    if (updatedEmail && !alreadyTracked) {
      // Record metrics
      await storage.createSystemMetric({
        metricName: 'email_clicked',
        metricValue: '1',
        region: email.region
      });
    }
    
    return {
      success: !!updatedEmail,
      alreadyTracked,
      emailId: email.id,
      redirectUrl
    };
  } catch (error) {
    console.error('Email click tracking error:', error);
    return {
      success: false,
      alreadyTracked: false,
      redirectUrl: url || '/'
    };
  }
}

// Get tracking statistics for a specific email
export async function getEmailTrackingStats(emailId: number): Promise<{
  emailId: number;
  sent: boolean;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
}> {
  const email = await storage.getEmail(emailId);
  
  if (!email) {
    throw new Error(`Email with ID ${emailId} not found`);
  }
  
  return {
    emailId: email.id,
    sent: true,
    delivered: email.status === 'delivered' || !!email.deliveredAt,
    opened: !!email.openedAt,
    clicked: !!email.clickedAt,
    sentAt: email.sentAt,
    deliveredAt: email.deliveredAt || undefined,
    openedAt: email.openedAt || undefined,
    clickedAt: email.clickedAt || undefined
  };
}

// Get overall tracking statistics
export async function getTrackingStatistics(): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  clickThroughRate: number;
}> {
  const emails = await storage.getEmails(1000); // Get last 1000 emails
  
  const totalSent = emails.length;
  const totalOpened = emails.filter(email => email.openedAt !== null).length;
  const totalClicked = emails.filter(email => email.clickedAt !== null).length;
  
  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
  const clickThroughRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  
  return {
    totalSent,
    totalOpened,
    totalClicked,
    openRate,
    clickRate,
    clickThroughRate
  };
}
