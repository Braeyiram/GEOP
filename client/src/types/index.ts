// Email related types
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendEmailRequest {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: number;
  variables?: Record<string, string>;
  region?: string;
  metadata?: Record<string, any>;
  volume?: number;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  emailId?: number;
  trackingId?: string;
  error?: string;
}

export interface EmailStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  regionData: RegionStat[];
  providerData: ProviderStat[];
}

export interface RegionStat {
  region: string;
  count: number;
  percentage: number;
}

export interface ProviderStat {
  provider: string;
  count: number;
  percentage: number;
}

// SMTP Provider related types
export interface SmtpProvider {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  region: string;
  isSecure: boolean;
  isActive: boolean;
  priority: number;
  maxSendsPerHour: number;
}

export interface SmtpProviderFormData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  region: string;
  isSecure: boolean;
  isActive: boolean;
  priority: number;
  maxSendsPerHour: number;
}

// System metrics related types
export interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

// Tracking related types
export interface TrackingStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  clickThroughRate: number;
}

export interface EmailTrackingStats {
  emailId: number;
  sent: boolean;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

// Compliance related types
export interface BlockedRegion {
  id: number;
  regionCode: string;
  reason: string;
  isActive: boolean;
}

export interface BlockedRegionFormData {
  regionCode: string;
  reason: string;
  isActive: boolean;
}

// WebSocket message types
export interface DashboardUpdateMessage {
  type: 'dashboardUpdate';
  stats: EmailStats;
  timestamp: string;
}

export interface SystemMetricsUpdateMessage {
  type: 'systemMetricsUpdate';
  metrics: SystemMetrics;
  timestamp: string;
}

export type WebSocketMessage = DashboardUpdateMessage | SystemMetricsUpdateMessage;
