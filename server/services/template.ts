import { storage } from '../storage';
import { InsertTemplate } from '@shared/schema';
import { z } from 'zod';

// Validation schema for creating a template
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(998),
  htmlContent: z.string(),
  textContent: z.string()
});

export type CreateTemplateRequest = z.infer<typeof createTemplateSchema>;

// Validation schema for updating a template
export const updateTemplateSchema = createTemplateSchema.partial();

export type UpdateTemplateRequest = z.infer<typeof updateTemplateSchema>;

// Create a new email template
export async function createTemplate(request: CreateTemplateRequest): Promise<{
  success: boolean;
  templateId?: number;
  message: string;
  error?: string;
}> {
  try {
    // Basic validation of template variables
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const htmlVariables = [...request.htmlContent.matchAll(variableRegex)].map(match => match[1].trim());
    const textVariables = [...request.textContent.matchAll(variableRegex)].map(match => match[1].trim());
    
    // Make sure all variables in HTML are also in text version
    const missingVariables = htmlVariables.filter(v => !textVariables.includes(v));
    if (missingVariables.length > 0) {
      return {
        success: false,
        message: 'HTML and text template versions have mismatched variables',
        error: `Variables found in HTML but not in text: ${missingVariables.join(', ')}`
      };
    }
    
    // Create the template
    const templateData: InsertTemplate = {
      name: request.name,
      subject: request.subject,
      htmlContent: request.htmlContent,
      textContent: request.textContent
    };
    
    const template = await storage.createTemplate(templateData);
    
    return {
      success: true,
      templateId: template.id,
      message: 'Template created successfully'
    };
  } catch (error) {
    console.error('Template creation error:', error);
    return {
      success: false,
      message: 'Failed to create template',
      error: (error as Error).message
    };
  }
}

// Update an existing template
export async function updateTemplate(id: number, request: UpdateTemplateRequest): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const existingTemplate = await storage.getTemplate(id);
    if (!existingTemplate) {
      return {
        success: false,
        message: 'Template not found',
        error: `Template with ID ${id} does not exist`
      };
    }
    
    // If updating both HTML and text, validate variables
    if (request.htmlContent && request.textContent) {
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const htmlVariables = [...request.htmlContent.matchAll(variableRegex)].map(match => match[1].trim());
      const textVariables = [...request.textContent.matchAll(variableRegex)].map(match => match[1].trim());
      
      // Make sure all variables in HTML are also in text version
      const missingVariables = htmlVariables.filter(v => !textVariables.includes(v));
      if (missingVariables.length > 0) {
        return {
          success: false,
          message: 'HTML and text template versions have mismatched variables',
          error: `Variables found in HTML but not in text: ${missingVariables.join(', ')}`
        };
      }
    }
    
    // Update the template
    const updatedTemplate = await storage.updateTemplate(id, request);
    
    if (!updatedTemplate) {
      return {
        success: false,
        message: 'Failed to update template',
        error: 'Database update operation failed'
      };
    }
    
    return {
      success: true,
      message: 'Template updated successfully'
    };
  } catch (error) {
    console.error('Template update error:', error);
    return {
      success: false,
      message: 'Failed to update template',
      error: (error as Error).message
    };
  }
}
