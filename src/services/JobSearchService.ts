
import { ContactData } from '@/types/ContactData';
import { HarvestService } from './HarvestService';
import { ApiKeyService } from './ApiKeyService';

export class JobSearchService {
  static async searchJobsByTitle(jobTitle: string): Promise<{ success: boolean; data?: ContactData[]; error?: string }> {
    try {
      console.log('Starting job search for title:', jobTitle);
      
      // Generate search URLs for major job sites
      const searchUrls = this.generateJobSearchUrls(jobTitle);
      const harvestedData: ContactData[] = [];

      for (const url of searchUrls) {
        try {
          console.log(`Scraping job listings from: ${url}`);
          const result = await HarvestService.harvestFromUrl(url);
          
          if (result.success && result.data) {
            // Filter the data to only include relevant job postings
            const filteredData = this.filterRelevantJobs(result.data, jobTitle);
            if (filteredData) {
              harvestedData.push(filteredData);
            }
          }
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          // Continue with other URLs even if one fails
        }
      }

      if (harvestedData.length > 0) {
        console.log(`Found ${harvestedData.length} relevant job postings for "${jobTitle}"`);
        return { success: true, data: harvestedData };
      } else {
        return { success: false, error: `No relevant job postings found for "${jobTitle}"` };
      }

    } catch (error) {
      console.error('Job search failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Job search failed' 
      };
    }
  }

  private static generateJobSearchUrls(jobTitle: string): string[] {
    const encodedTitle = encodeURIComponent(jobTitle);
    
    return [
      `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
      `https://www.indeed.com/jobs?q=${encodedTitle}`,
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedTitle}`,
      `https://stackoverflow.com/jobs?q=${encodedTitle}`,
      `https://angel.co/jobs#find/f!%7B%22keywords%22%3A%5B%22${encodedTitle}%22%5D%7D`,
      `https://jobs.google.com/search?q=${encodedTitle}`,
    ];
  }

  private static filterRelevantJobs(data: ContactData, searchTitle: string): ContactData | null {
    // Filter job postings to only include those relevant to the search title
    const relevantJobs = data.jobPostings.filter(job => 
      job.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTitle.toLowerCase())
    );

    // If no relevant jobs found, return null
    if (relevantJobs.length === 0) {
      return null;
    }

    // Return a new ContactData object with only relevant jobs
    return {
      ...data,
      jobPostings: relevantJobs,
      metadata: {
        ...data.metadata,
        pageTitle: `${searchTitle} Jobs - ${data.metadata.pageTitle}`,
      }
    };
  }

  static async searchWithGoogleAPI(jobTitle: string): Promise<string[]> {
    // This would require Google Custom Search API key
    // For now, return the standard job site URLs
    console.log('Google API search not yet implemented, using standard job sites');
    return this.generateJobSearchUrls(jobTitle);
  }
}
