import { db } from './db';
import { smtpProviders, templates, blockedRegions, systemMetrics } from '@shared/schema';

/**
 * Seeds the database with initial default data
 */
export async function seedDatabase() {
  try {
    console.log('Seeding database with initial data...');
    
    // Check if data already exists
    const existingProviders = await db.select().from(smtpProviders);
    const existingTemplates = await db.select().from(templates);
    const existingBlockedRegions = await db.select().from(blockedRegions);
    
    // Only seed if tables are empty
    if (existingProviders.length === 0) {
      console.log('Seeding SMTP providers...');
      await db.insert(smtpProviders).values([
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
          maxSendsPerHour: 5000,
          reputationScore: 100,
          lastSuccessRate: 99,
          isInFailover: false,
          usageCategory: 'default',
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
          maxSendsPerHour: 3000,
          reputationScore: 100,
          lastSuccessRate: 99,
          isInFailover: false,
          usageCategory: 'default',
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
          maxSendsPerHour: 2000,
          reputationScore: 100,
          lastSuccessRate: 99,
          isInFailover: false,
          usageCategory: 'default',
        }
      ]);
    }
    
    if (existingTemplates.length === 0) {
      console.log('Seeding email templates...');
      await db.insert(templates).values({
        name: "Welcome Email",
        subject: "Welcome to our platform",
        htmlContent: "<h1>Welcome!</h1><p>Thank you for signing up. {{name}}</p>",
        textContent: "Welcome! Thank you for signing up, {{name}}",
      });
    }
    
    if (existingBlockedRegions.length === 0) {
      console.log('Seeding blocked regions...');
      await db.insert(blockedRegions).values([
        {
          regionCode: "CU",
          reason: "US Embargo",
          isActive: true,
          effectiveFrom: new Date(),
        },
        {
          regionCode: "IR",
          reason: "US Sanctions",
          isActive: true,
          effectiveFrom: new Date(),
        },
        {
          regionCode: "KP",
          reason: "US Sanctions",
          isActive: true,
          effectiveFrom: new Date(),
        }
      ]);
    }
    
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}