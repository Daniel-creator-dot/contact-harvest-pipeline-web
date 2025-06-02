
// This file is deprecated and replaced by backend edge functions
// All harvesting now happens securely in Supabase edge functions
// See: supabase/functions/job-search/index.ts

export class HarvestService {
  static async harvestFromUrl(): Promise<{ success: boolean; error: string }> {
    return { 
      success: false, 
      error: 'This service has been moved to the backend. Use JobSearchService instead.' 
    };
  }
}
