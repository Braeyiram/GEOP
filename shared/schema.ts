import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'operator', 'viewer']);
export const consentStatusEnum = pgEnum('consent_status', ['pending', 'confirmed', 'verified', 'revoked']);
export const encryptionTypeEnum = pgEnum('encryption_type', ['deterministic', 'randomized']);

// Enhanced users table with RBAC and PII protection
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").default('viewer').notNull(),
  consentStatus: consentStatusEnum("consent_status").default('pending').notNull(),
  lastConsentAt: timestamp("last_consent_at"),
  // PII fields (stored as encrypted text representation for demonstration)
  encryptedSsn: text("encrypted_ssn"), // For demonstration of PII field
  encryptedPhoneNumber: text("encrypted_phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resourceTag: text("resource_tag"), // For RBAC ownership tracking
});

// Define the insert schema with the required fields
export const insertUserSchema = createInsertSchema(users);

// Create a more specific insert schema for user registration
export const userRegistrationSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['admin', 'manager', 'operator', 'viewer']).default('viewer'),
});

// Email templates table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SMTP providers table with extended functionality for adaptive routing
export const smtpProviders = pgTable("smtp_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  region: text("region").notNull(),
  isSecure: boolean("is_secure").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(), // For failover sequence
  maxSendsPerHour: integer("max_sends_per_hour").default(1000).notNull(),
  reputationScore: integer("reputation_score").default(100).notNull(), // 0-100 scale
  lastSuccessRate: integer("last_success_rate").default(100).notNull(), // Percentage
  isInFailover: boolean("is_in_failover").default(false).notNull(),
  failoverExpiresAt: timestamp("failover_expires_at"),
  failoverReason: text("failover_reason"),
  usageCategory: text("usage_category").default('default').notNull(), // default, high-volume, backup
  dataCenter: text("data_center"), // For regional compliance
  lastCheckedAt: timestamp("last_checked_at"),
  keyRotationAt: timestamp("key_rotation_at"), // For security compliance
});

export const insertSmtpProviderSchema = createInsertSchema(smtpProviders).omit({
  id: true,
  reputationScore: true,
  lastSuccessRate: true,
  isInFailover: true,
  failoverExpiresAt: true,
  failoverReason: true,
  lastCheckedAt: true,
  keyRotationAt: true,
});

// SMTP provider routing rules table
export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  condition: text("condition").notNull(), // JSON string with routing conditions
  targetProviderId: integer("target_provider_id").notNull(),
  priority: integer("priority").default(0).notNull(), // For rule processing order
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced templates with variants for A/B testing and personalization
export const templateVariants = pgTable("template_variants", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  name: text("name").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  variantType: text("variant_type").notNull(), // header, content, cta, etc.
  selectionLogic: text("selection_logic"), // JavaScript logic for variant selection
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateVariantSchema = createInsertSchema(templateVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced emails table to track sent emails with advanced security and tracking
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  from: text("from").notNull(),
  subject: text("subject").notNull(),
  templateId: integer("template_id"),
  variantId: integer("variant_id"), // For A/B testing
  smtpProviderId: integer("smtp_provider_id"),
  status: text("status").notNull(), // sent, delivered, failed, etc.
  region: text("region").notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  // Enhanced tracking system
  trackingId: text("tracking_id").notNull().unique(),
  fingerprint: text("fingerprint").notNull(), // UUID-timestamp-hmac for rotating fingerprints
  spamScore: integer("spam_score"), // Calculated spam score
  sendTimeScore: integer("send_time_score"), // AI optimization score
  scheduledSendTime: timestamp("scheduled_send_time"), // For AI-optimized send time
  // Security fields
  encryptionVersion: integer("encryption_version").default(1), // For encryption upgrades
  complianceStatus: text("compliance_status"), // For regulatory compliance
  dataSovereignty: text("data_sovereignty"), // Region where the data is stored
  auditTrailHash: text("audit_trail_hash"), // Immutable audit trail hash
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  status: true,
  spamScore: true,
  sendTimeScore: true,
  encryptionVersion: true,
  complianceStatus: true,
  auditTrailHash: true,
});

// Email tracking events for the enhanced tracking system
export const emailTrackingEvents = pgTable("email_tracking_events", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull(),
  trackingId: text("tracking_id").notNull(),
  eventType: text("event_type").notNull(), // open, click, bounce, spam, etc.
  eventTime: timestamp("event_time").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  country: text("country"),
  city: text("city"),
  url: text("url"), // For click events
  botDetection: boolean("bot_detection").default(false), // AI-powered bot detection
  behavioralData: jsonb("behavioral_data"), // For behavioral analysis (mouse movements, etc.)
  rotatingFingerprint: text("rotating_fingerprint"), // For enhanced tracking security
});

export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents).omit({
  id: true,
  eventTime: true,
});

// Regional compliance and data sovereignty
export const regionalCompliance = pgTable("regional_compliance", {
  id: serial("id").primaryKey(),
  regionCode: text("region_code").notNull().unique(),
  displayName: text("display_name").notNull(),
  hasIcpLicense: boolean("has_icp_license").default(false), // For China compliance
  dataCenterLocation: text("data_center_location"), // For specific compliance requirements
  rtlSupport: boolean("rtl_support").default(false), // For right-to-left language support
  specialRequirements: jsonb("special_requirements").default({}), // Additional compliance requirements
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRegionalComplianceSchema = createInsertSchema(regionalCompliance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Blocked regions for compliance
export const blockedRegions = pgTable("blocked_regions", {
  id: serial("id").primaryKey(),
  regionCode: text("region_code").notNull().unique(),
  reason: text("reason").notNull(),
  complianceReference: text("compliance_reference"), // Reference to the compliance regulation
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  effectiveTo: timestamp("effective_to"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertBlockedRegionSchema = createInsertSchema(blockedRegions).omit({
  id: true,
});

// Organization schedules for timezone management
export const organizationSchedules = pgTable("organization_schedules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: text("name").notNull(),
  workingHours: jsonb("working_hours").default({}), // Working hours by day of week
  blackoutDays: jsonb("blackout_days").default([]), // Days when email shouldn't be sent
  timezone: text("timezone").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationScheduleSchema = createInsertSchema(organizationSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced system metrics for observability
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(), // cpu, memory, delivery_latency, etc.
  metricValue: text("metric_value").notNull(),
  metricUnit: text("metric_unit").notNull(), // ms, %, MB, etc.
  region: text("region").notNull(),
  percentile: text("percentile"), // p50, p95, p99, etc. for latency metrics
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isAnomaly: boolean("is_anomaly").default(false), // Flag for anomaly detection
  anomalyScore: integer("anomaly_score"), // LSTM-based anomaly score
  alertGenerated: boolean("alert_generated").default(false), // Whether this metric generated an alert
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
  isAnomaly: true,
  anomalyScore: true,
  alertGenerated: true,
});

// Audit trail for immutable logging
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(), // email_sent, template_edited, user_created, etc.
  userId: integer("user_id"),
  resourceType: text("resource_type").notNull(), // email, template, user, etc.
  resourceId: text("resource_id").notNull(),
  actionDetails: jsonb("action_details").default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  blockchainTxHash: text("blockchain_tx_hash"), // Blockchain transaction hash for immutable audit trail
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
  blockchainTxHash: true,
});

// Export types for usage in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRegistration = z.infer<typeof userRegistrationSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type TemplateVariant = typeof templateVariants.$inferSelect;
export type InsertTemplateVariant = z.infer<typeof insertTemplateVariantSchema>;

export type SmtpProvider = typeof smtpProviders.$inferSelect;
export type InsertSmtpProvider = z.infer<typeof insertSmtpProviderSchema>;

export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
export type InsertEmailTrackingEvent = z.infer<typeof insertEmailTrackingEventSchema>;

export type RegionalCompliance = typeof regionalCompliance.$inferSelect;
export type InsertRegionalCompliance = z.infer<typeof insertRegionalComplianceSchema>;

export type BlockedRegion = typeof blockedRegions.$inferSelect;
export type InsertBlockedRegion = z.infer<typeof insertBlockedRegionSchema>;

export type OrganizationSchedule = typeof organizationSchedules.$inferSelect;
export type InsertOrganizationSchedule = z.infer<typeof insertOrganizationScheduleSchema>;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
