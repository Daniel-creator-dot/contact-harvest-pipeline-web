
import { supabase } from '@/integrations/supabase/client';

export interface JobSearchResponse {
  success: boolean;
  jobSearchId?: string;
  totalSources?: number;
  completedSources?: number;
  contactDataCount?: number;
  message?: string;
  error?: string;
}

export interface JobSearchResult {
  jobSearch: {
    id: string;
    job_titles: string[];
    status: string;
    total_sources: number;
    completed_sources: number;
    created_at: string;
    updated_at: string;
  };
  contacts: Array<{
    id: string;
    source_url: string;
    page_title: string;
    domain: string;
    emails: string[];
    contacts: any[];
    job_postings: any[];
    external_urls: string[];
    processing_time: number;
    scraped_at: string;
    redirect_chain: string[];
  }>;
}

export class JobSearchService {
  static async searchJobsByTitle(jobTitles: string[]): Promise<JobSearchResponse> {
    try {
      console.log('Starting job search for titles:', jobTitles);
      
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: { jobTitles }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { 
          success: false, 
          error: error.message || 'Job search failed' 
        };
      }

      return data;

    } catch (error) {
      console.error('Job search failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Job search failed' 
      };
    }
  }

  static async getJobSearchResults(jobSearchId?: string): Promise<JobSearchResult | JobSearchResult[] | null> {
    try {
      const params = jobSearchId ? `?jobSearchId=${jobSearchId}` : '';
      
      const { data, error } = await supabase.functions.invoke('get-job-results', {
        method: 'GET',
        body: params
      });

      if (error) {
        console.error('Error fetching job results:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('Error fetching job results:', error);
      return null;
    }
  }

  static async getAllJobSearches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('job_searches')
        .select(`
          *,
          harvested_contacts(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching job searches:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching job searches:', error);
      return [];
    }
  }
}
