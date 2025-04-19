import { storage } from '../storage';
import { InsertBlockedRegion } from '@shared/schema';
import { z } from 'zod';

// Validation schema for creating a blocked region
export const createBlockedRegionSchema = z.object({
  regionCode: z.string().length(2).toUpperCase(),
  reason: z.string().min(1).max(255),
  isActive: z.boolean().default(true)
});

export type CreateBlockedRegionRequest = z.infer<typeof createBlockedRegionSchema>;

// Create a new blocked region
export async function createBlockedRegion(request: CreateBlockedRegionRequest): Promise<{
  success: boolean;
  regionId?: number;
  message: string;
  error?: string;
}> {
  try {
    // Check if region already exists
    const existingRegion = await storage.getBlockedRegionByCode(request.regionCode);
    if (existingRegion) {
      return {
        success: false,
        message: 'Region already blocked',
        error: `Region code ${request.regionCode} is already in the blocked list`
      };
    }
    
    // Create the blocked region
    const regionData: InsertBlockedRegion = {
      regionCode: request.regionCode,
      reason: request.reason,
      isActive: request.isActive
    };
    
    const region = await storage.createBlockedRegion(regionData);
    
    return {
      success: true,
      regionId: region.id,
      message: 'Region blocked successfully'
    };
  } catch (error) {
    console.error('Blocked region creation error:', error);
    return {
      success: false,
      message: 'Failed to block region',
      error: (error as Error).message
    };
  }
}

// Update an existing blocked region status
export async function updateBlockedRegionStatus(id: number, isActive: boolean): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const existingRegion = await storage.getBlockedRegion(id);
    if (!existingRegion) {
      return {
        success: false,
        message: 'Blocked region not found',
        error: `Blocked region with ID ${id} does not exist`
      };
    }
    
    // Update the region
    const updatedRegion = await storage.updateSmtpProvider(id, { isActive });
    
    if (!updatedRegion) {
      return {
        success: false,
        message: 'Failed to update blocked region',
        error: 'Database update operation failed'
      };
    }
    
    return {
      success: true,
      message: `Region ${isActive ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    console.error('Blocked region update error:', error);
    return {
      success: false,
      message: 'Failed to update blocked region',
      error: (error as Error).message
    };
  }
}

// Check if sending email to a region is allowed
export async function checkRegionCompliance(regionCode: string): Promise<{
  allowed: boolean;
  region?: {
    code: string;
    reason: string;
  };
}> {
  try {
    const blockedRegion = await storage.getBlockedRegionByCode(regionCode);
    
    if (blockedRegion && blockedRegion.isActive) {
      return {
        allowed: false,
        region: {
          code: blockedRegion.regionCode,
          reason: blockedRegion.reason
        }
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Region compliance check error:', error);
    // Default to blocking on error for safety
    return {
      allowed: false,
      region: {
        code: regionCode,
        reason: 'System error during compliance check'
      }
    };
  }
}
