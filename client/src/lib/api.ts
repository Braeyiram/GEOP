import { apiRequest } from './queryClient';
import type { 
  SendEmailRequest, 
  SendEmailResponse,
  EmailStats,
  EmailTemplate,
  SmtpProvider,
  BlockedRegion,
  TrackingStats,
  EmailTrackingStats,
  BlockedRegionFormData
} from '../types';

// Email endpoints
export async function sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
  const res = await apiRequest('POST', '/api/email/send', data);
  return res.json();
}

export async function getEmailStats(): Promise<EmailStats> {
  const res = await apiRequest('GET', '/api/email/stats');
  return res.json();
}

export async function getEmail(id: number): Promise<any> {
  const res = await apiRequest('GET', `/api/email/${id}`);
  return res.json();
}

// Template endpoints
export async function createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ templateId: number }> {
  const res = await apiRequest('POST', '/api/template', data);
  return res.json();
}

export async function updateTemplate(id: number, data: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean }> {
  const res = await apiRequest('PUT', `/api/template/${id}`, data);
  return res.json();
}

export async function getTemplate(id: number): Promise<EmailTemplate> {
  const res = await apiRequest('GET', `/api/template/${id}`);
  return res.json();
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  const res = await apiRequest('GET', '/api/template');
  return res.json();
}

export async function deleteTemplate(id: number): Promise<{ success: boolean }> {
  const res = await apiRequest('DELETE', `/api/template/${id}`);
  return res.json();
}

// SMTP Provider endpoints
export async function getSmtpProviders(): Promise<SmtpProvider[]> {
  const res = await apiRequest('GET', '/api/smtp');
  return res.json();
}

export async function getSmtpProvider(id: number): Promise<SmtpProvider> {
  const res = await apiRequest('GET', `/api/smtp/${id}`);
  return res.json();
}

// Compliance endpoints
export async function getBlockedRegions(): Promise<BlockedRegion[]> {
  const res = await apiRequest('GET', '/api/compliance/region');
  return res.json();
}

export async function createBlockedRegion(data: BlockedRegionFormData): Promise<{ regionId: number }> {
  const res = await apiRequest('POST', '/api/compliance/region', data);
  return res.json();
}

export async function updateBlockedRegionStatus(id: number, isActive: boolean): Promise<{ success: boolean }> {
  const res = await apiRequest('PUT', `/api/compliance/region/${id}`, { isActive });
  return res.json();
}

export async function checkRegionCompliance(regionCode: string): Promise<{ allowed: boolean, region?: { code: string, reason: string } }> {
  const res = await apiRequest('GET', `/api/compliance/check/${regionCode}`);
  return res.json();
}

// Tracking endpoints
export async function getTrackingStats(): Promise<TrackingStats> {
  const res = await apiRequest('GET', '/api/tracking/stats');
  return res.json();
}

export async function getEmailTrackingStats(id: number): Promise<EmailTrackingStats> {
  const res = await apiRequest('GET', `/api/tracking/email/${id}`);
  return res.json();
}

// Health check
export async function getHealthStatus(): Promise<{ status: string }> {
  const res = await apiRequest('GET', '/api/health');
  return res.json();
}
