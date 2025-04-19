import * as crypto from 'crypto';
import { 
  users, type User, type InsertUser,
  templates, type Template, type InsertTemplate,
  smtpProviders, type SmtpProvider, type InsertSmtpProvider,
  emails, type Email, type InsertEmail,
  blockedRegions, type BlockedRegion, type InsertBlockedRegion,
  systemMetrics, type SystemMetric, type InsertSystemMetric,
  templateVariants, type TemplateVariant, type InsertTemplateVariant,
  routingRules, type RoutingRule, type InsertRoutingRule,
  emailTrackingEvents, type EmailTrackingEvent, type InsertEmailTrackingEvent,
  regionalCompliance, type RegionalCompliance, type InsertRegionalCompliance,
  organizationSchedules, type OrganizationSchedule, type InsertOrganizationSchedule,
  auditLogs, type AuditLog, type InsertAuditLog,
  userRoleEnum, consentStatusEnum
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, isNull, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template methods
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  
  // SMTP Provider methods
  getSmtpProvider(id: number): Promise<SmtpProvider | undefined>;
  getSmtpProviders(): Promise<SmtpProvider[]>;
  getSmtpProvidersByRegion(region: string): Promise<SmtpProvider[]>;
  createSmtpProvider(provider: InsertSmtpProvider): Promise<SmtpProvider>;
  updateSmtpProvider(id: number, provider: Partial<InsertSmtpProvider>): Promise<SmtpProvider | undefined>;
  deleteSmtpProvider(id: number): Promise<boolean>;
  
  // Email methods
  getEmail(id: number): Promise<Email | undefined>;
  getEmailByTrackingId(trackingId: string): Promise<Email | undefined>;
  getEmails(limit?: number, offset?: number): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailStatus(id: number, status: string): Promise<Email | undefined>;
  updateEmailTracking(trackingId: string, type: 'opened' | 'clicked'): Promise<Email | undefined>;
  
  // Blocked Region methods
  getBlockedRegion(id: number): Promise<BlockedRegion | undefined>;
  getBlockedRegions(): Promise<BlockedRegion[]>;
  getBlockedRegionByCode(regionCode: string): Promise<BlockedRegion | undefined>;
  createBlockedRegion(region: InsertBlockedRegion): Promise<BlockedRegion>;
  deleteBlockedRegion(id: number): Promise<boolean>;
  
  // System Metrics methods
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getRecentMetrics(metricName: string, limit?: number): Promise<SystemMetric[]>;
  getMetricsByRegion(region: string, limit?: number): Promise<SystemMetric[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private templates: Map<number, Template>;
  private smtpProviders: Map<number, SmtpProvider>;
  private emails: Map<number, Email>;
  private blockedRegions: Map<number, BlockedRegion>;
  private systemMetrics: Map<number, SystemMetric>;
  
  private userIdCounter: number;
  private templateIdCounter: number;
  private smtpProviderIdCounter: number;
  private emailIdCounter: number;
  private blockedRegionIdCounter: number;
  private systemMetricIdCounter: number;

  constructor() {
    this.users = new Map();
    this.templates = new Map();
    this.smtpProviders = new Map();
    this.emails = new Map();
    this.blockedRegions = new Map();
    this.systemMetrics = new Map();
    
    this.userIdCounter = 1;
    this.templateIdCounter = 1;
    this.smtpProviderIdCounter = 1;
    this.emailIdCounter = 1;
    this.blockedRegionIdCounter = 1;
    this.systemMetricIdCounter = 1;
    
    // Initialize with default SMTP providers
    this.initDefaultData();
  }

  private initDefaultData() {
    // Default SMTP providers
    const defaultProviders: InsertSmtpProvider[] = [
      {
        name: "Amazon SES (NA)",
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 587,
        username: "AKIAXXXXXXXXXXXXXXXX",
        password: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        region: "NA",
        isSecure: true,
        isActive: true,
        priority: 1,
        maxSendsPerHour: 5000
      },
      {
        name: "Mailgun (EU)",
        host: "smtp.eu.mailgun.org",
        port: 587,
        username: "postmaster@mg.example.com",
        password: "XXXXXXXXXXXXXXXX",
        region: "EU",
        isSecure: true,
        isActive: true,
        priority: 1,
        maxSendsPerHour: 3000
      },
      {
        name: "SendGrid (APAC)",
        host: "smtp.sendgrid.net",
        port: 587,
        username: "apikey",
        password: "SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        region: "APAC",
        isSecure: true,
        isActive: true,
        priority: 1,
        maxSendsPerHour: 2000
      }
    ];
    
    defaultProviders.forEach(provider => {
      this.createSmtpProvider(provider);
    });
    
    // Default blocked regions for compliance
    const defaultBlockedRegions: InsertBlockedRegion[] = [
      {
        regionCode: "CU",
        reason: "US Embargo",
        isActive: true
      },
      {
        regionCode: "IR",
        reason: "US Sanctions",
        isActive: true
      },
      {
        regionCode: "KP",
        reason: "US Sanctions",
        isActive: true
      }
    ];
    
    defaultBlockedRegions.forEach(region => {
      this.createBlockedRegion(region);
    });
    
    // Default email template
    this.createTemplate({
      name: "Welcome Email",
      subject: "Welcome to our platform",
      htmlContent: "<h1>Welcome!</h1><p>Thank you for signing up. {{name}}</p>",
      textContent: "Welcome! Thank you for signing up, {{name}}"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Template methods
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }
  
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.templateIdCounter++;
    const now = new Date();
    const template: Template = { 
      ...insertTemplate, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.templates.set(id, template);
    return template;
  }
  
  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existingTemplate = this.templates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate: Template = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date()
    };
    
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }
  
  // SMTP Provider methods
  async getSmtpProvider(id: number): Promise<SmtpProvider | undefined> {
    return this.smtpProviders.get(id);
  }
  
  async getSmtpProviders(): Promise<SmtpProvider[]> {
    return Array.from(this.smtpProviders.values());
  }
  
  async getSmtpProvidersByRegion(region: string): Promise<SmtpProvider[]> {
    return Array.from(this.smtpProviders.values()).filter(
      provider => provider.region === region && provider.isActive
    ).sort((a, b) => a.priority - b.priority);
  }
  
  async createSmtpProvider(insertProvider: InsertSmtpProvider): Promise<SmtpProvider> {
    const id = this.smtpProviderIdCounter++;
    const provider: SmtpProvider = { ...insertProvider, id };
    this.smtpProviders.set(id, provider);
    return provider;
  }
  
  async updateSmtpProvider(id: number, provider: Partial<InsertSmtpProvider>): Promise<SmtpProvider | undefined> {
    const existingProvider = this.smtpProviders.get(id);
    if (!existingProvider) return undefined;
    
    const updatedProvider: SmtpProvider = {
      ...existingProvider,
      ...provider
    };
    
    this.smtpProviders.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async deleteSmtpProvider(id: number): Promise<boolean> {
    return this.smtpProviders.delete(id);
  }
  
  // Email methods
  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }
  
  async getEmailByTrackingId(trackingId: string): Promise<Email | undefined> {
    return Array.from(this.emails.values()).find(
      email => email.trackingId === trackingId
    );
  }
  
  async getEmails(limit: number = 100, offset: number = 0): Promise<Email[]> {
    return Array.from(this.emails.values())
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.emailIdCounter++;
    const now = new Date();
    const email: Email = {
      ...insertEmail,
      id,
      status: 'sent',
      sentAt: now,
      deliveredAt: null,
      openedAt: null,
      clickedAt: null
    };
    this.emails.set(id, email);
    return email;
  }
  
  async updateEmailStatus(id: number, status: string): Promise<Email | undefined> {
    const email = this.emails.get(id);
    if (!email) return undefined;
    
    const updatedEmail: Email = {
      ...email,
      status
    };
    
    // Update delivery timestamp if status is 'delivered'
    if (status === 'delivered') {
      updatedEmail.deliveredAt = new Date();
    }
    
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }
  
  async updateEmailTracking(trackingId: string, type: 'opened' | 'clicked'): Promise<Email | undefined> {
    const email = Array.from(this.emails.values()).find(
      email => email.trackingId === trackingId
    );
    
    if (!email) return undefined;
    
    const updatedEmail: Email = { ...email };
    
    if (type === 'opened' && !updatedEmail.openedAt) {
      updatedEmail.openedAt = new Date();
    } else if (type === 'clicked' && !updatedEmail.clickedAt) {
      updatedEmail.clickedAt = new Date();
    }
    
    this.emails.set(email.id, updatedEmail);
    return updatedEmail;
  }
  
  // Blocked Region methods
  async getBlockedRegion(id: number): Promise<BlockedRegion | undefined> {
    return this.blockedRegions.get(id);
  }
  
  async getBlockedRegions(): Promise<BlockedRegion[]> {
    return Array.from(this.blockedRegions.values());
  }
  
  async getBlockedRegionByCode(regionCode: string): Promise<BlockedRegion | undefined> {
    return Array.from(this.blockedRegions.values()).find(
      region => region.regionCode === regionCode && region.isActive
    );
  }
  
  async createBlockedRegion(insertRegion: InsertBlockedRegion): Promise<BlockedRegion> {
    const id = this.blockedRegionIdCounter++;
    const region: BlockedRegion = { ...insertRegion, id };
    this.blockedRegions.set(id, region);
    return region;
  }
  
  async deleteBlockedRegion(id: number): Promise<boolean> {
    return this.blockedRegions.delete(id);
  }
  
  // System Metrics methods
  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const id = this.systemMetricIdCounter++;
    const metric: SystemMetric = {
      ...insertMetric,
      id,
      timestamp: new Date()
    };
    this.systemMetrics.set(id, metric);
    return metric;
  }
  
  async getRecentMetrics(metricName: string, limit: number = 100): Promise<SystemMetric[]> {
    return Array.from(this.systemMetrics.values())
      .filter(metric => metric.metricName === metricName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async getMetricsByRegion(region: string, limit: number = 100): Promise<SystemMetric[]> {
    return Array.from(this.systemMetrics.values())
      .filter(metric => metric.region === region)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Template methods
  async getTemplate(id: number): Promise<Template | undefined> {
    const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
    return result[0];
  }
  
  async getTemplates(): Promise<Template[]> {
    return db.select().from(templates).orderBy(desc(templates.createdAt));
  }
  
  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }
  
  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.rowCount > 0;
  }
  
  // SMTP Provider methods
  async getSmtpProvider(id: number): Promise<SmtpProvider | undefined> {
    const result = await db.select().from(smtpProviders).where(eq(smtpProviders.id, id)).limit(1);
    return result[0];
  }
  
  async getSmtpProviders(): Promise<SmtpProvider[]> {
    return db.select().from(smtpProviders);
  }
  
  async getSmtpProvidersByRegion(region: string): Promise<SmtpProvider[]> {
    return db
      .select()
      .from(smtpProviders)
      .where(and(
        eq(smtpProviders.region, region),
        eq(smtpProviders.isActive, true)
      ))
      .orderBy(asc(smtpProviders.priority));
  }
  
  async createSmtpProvider(insertProvider: InsertSmtpProvider): Promise<SmtpProvider> {
    const [provider] = await db.insert(smtpProviders).values(insertProvider).returning();
    return provider;
  }
  
  async updateSmtpProvider(id: number, provider: Partial<InsertSmtpProvider>): Promise<SmtpProvider | undefined> {
    const [updatedProvider] = await db
      .update(smtpProviders)
      .set(provider)
      .where(eq(smtpProviders.id, id))
      .returning();
    return updatedProvider;
  }
  
  async deleteSmtpProvider(id: number): Promise<boolean> {
    const result = await db.delete(smtpProviders).where(eq(smtpProviders.id, id));
    return result.rowCount > 0;
  }
  
  // Email methods
  async getEmail(id: number): Promise<Email | undefined> {
    const result = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
    return result[0];
  }
  
  async getEmailByTrackingId(trackingId: string): Promise<Email | undefined> {
    const result = await db
      .select()
      .from(emails)
      .where(eq(emails.trackingId, trackingId))
      .limit(1);
    return result[0];
  }
  
  async getEmails(limit: number = 100, offset: number = 0): Promise<Email[]> {
    return db
      .select()
      .from(emails)
      .orderBy(desc(emails.sentAt))
      .limit(limit)
      .offset(offset);
  }
  
  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const emailData = {
      ...insertEmail,
      status: 'sent',
      fingerprint: generateFingerprint(insertEmail.trackingId)
    };
    const [email] = await db.insert(emails).values(emailData).returning();
    return email;
  }
  
  async updateEmailStatus(id: number, status: string): Promise<Email | undefined> {
    const updateData: Record<string, any> = { status };
    
    // Update delivery timestamp if status is 'delivered'
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    const [updatedEmail] = await db
      .update(emails)
      .set(updateData)
      .where(eq(emails.id, id))
      .returning();
    
    return updatedEmail;
  }
  
  async updateEmailTracking(trackingId: string, type: 'opened' | 'clicked'): Promise<Email | undefined> {
    const updateData: Record<string, any> = {};
    
    if (type === 'opened') {
      updateData.openedAt = new Date();
    } else if (type === 'clicked') {
      updateData.clickedAt = new Date();
    }
    
    const [updatedEmail] = await db
      .update(emails)
      .set(updateData)
      .where(and(
        eq(emails.trackingId, trackingId),
        isNull(type === 'opened' ? emails.openedAt : emails.clickedAt)
      ))
      .returning();
    
    // Log tracking event with more detailed information
    if (updatedEmail) {
      await this.logTrackingEvent(updatedEmail.id, trackingId, type);
    }
    
    return updatedEmail;
  }
  
  // Helper method to log tracking events
  private async logTrackingEvent(emailId: number, trackingId: string, eventType: string): Promise<void> {
    await db.insert(emailTrackingEvents).values({
      emailId,
      trackingId,
      eventType,
      rotatingFingerprint: generateFingerprint(trackingId)
    });
  }
  
  // Blocked Region methods
  async getBlockedRegion(id: number): Promise<BlockedRegion | undefined> {
    const result = await db.select().from(blockedRegions).where(eq(blockedRegions.id, id)).limit(1);
    return result[0];
  }
  
  async getBlockedRegions(): Promise<BlockedRegion[]> {
    return db.select().from(blockedRegions);
  }
  
  async getBlockedRegionByCode(regionCode: string): Promise<BlockedRegion | undefined> {
    const result = await db
      .select()
      .from(blockedRegions)
      .where(and(
        eq(blockedRegions.regionCode, regionCode),
        eq(blockedRegions.isActive, true)
      ))
      .limit(1);
    return result[0];
  }
  
  async createBlockedRegion(insertRegion: InsertBlockedRegion): Promise<BlockedRegion> {
    const [region] = await db.insert(blockedRegions).values(insertRegion).returning();
    return region;
  }
  
  async deleteBlockedRegion(id: number): Promise<boolean> {
    const result = await db.delete(blockedRegions).where(eq(blockedRegions.id, id));
    return result.rowCount > 0;
  }
  
  // System Metrics methods
  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    // Add required fields for saving in the database
    const metricData = {
      ...insertMetric,
      metricUnit: insertMetric.metricUnit || 'count', // Default unit if not provided
      isAnomaly: false, // Default to no anomaly
    };
    const [metric] = await db.insert(systemMetrics).values(metricData).returning();
    return metric;
  }
  
  async getRecentMetrics(metricName: string, limit: number = 100): Promise<SystemMetric[]> {
    return db
      .select()
      .from(systemMetrics)
      .where(eq(systemMetrics.metricName, metricName))
      .orderBy(desc(systemMetrics.timestamp))
      .limit(limit);
  }
  
  async getMetricsByRegion(region: string, limit: number = 100): Promise<SystemMetric[]> {
    return db
      .select()
      .from(systemMetrics)
      .where(eq(systemMetrics.region, region))
      .orderBy(desc(systemMetrics.timestamp))
      .limit(limit);
  }
}

// Generate a secure fingerprint for tracking
function generateFingerprint(trackingId: string): string {
  const timestamp = Date.now();
  // Using a simple timestamp-based UUID for demonstration
  const uuid = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
  return `${uuid}-${hashString(trackingId + timestamp)}`;
}

// Simple hashing function for demonstration purposes
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Default to the Database storage implementation
export const storage = new DatabaseStorage();
