
import { ContactData, Contact, JobPosting } from '@/types/ContactData';
import { ApiKeyService } from './ApiKeyService';

export class HarvestService {
  static async harvestFromUrl(url: string): Promise<{ success: boolean; data?: ContactData; error?: string }> {
    const apiKey = ApiKeyService.getFirecrawlKey();
    
    if (!apiKey) {
      return { success: false, error: 'Firecrawl API key not configured' };
    }

    try {
      console.log('Starting harvest for URL:', url);
      const startTime = Date.now();

      // Use Firecrawl to scrape the website
      const scrapedData = await this.scrapeWithFirecrawl(url, apiKey);
      
      if (!scrapedData.success) {
        return { success: false, error: scrapedData.error };
      }

      const content = scrapedData.content;
      const metadata = scrapedData.metadata;

      // Extract emails
      const emails = this.extractEmails(content);
      
      // Extract contacts
      const contacts = this.extractContacts(content);
      
      // Extract job postings
      const jobPostings = this.extractJobPostings(content);

      const contactData: ContactData = {
        id: this.generateId(),
        url,
        scrapedAt: new Date().toISOString(),
        emails: [...new Set(emails)], // Remove duplicates
        contacts,
        jobPostings,
        metadata: {
          pageTitle: metadata.title || 'Unknown Page',
          domain: new URL(url).hostname,
          totalWords: content.split(/\s+/).length,
          processingTime: Date.now() - startTime
        }
      };

      console.log('Harvest completed:', contactData);
      return { success: true, data: contactData };

    } catch (error) {
      console.error('Harvest failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private static async scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ success: boolean; content?: string; metadata?: any; error?: string }> {
    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a', 'div', 'span'],
          excludeTags: ['script', 'style', 'nav', 'header', 'footer'],
          waitFor: 2000
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: `Firecrawl API error: ${response.status} - ${errorData.error || 'Unknown error'}` 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error || 'Scraping failed' };
      }

      return {
        success: true,
        content: data.data?.markdown || data.data?.html || '',
        metadata: data.data?.metadata || {}
      };

    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return { 
        success: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private static extractEmails(content: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex) || [];
    
    // Filter out common false positives
    return emails.filter(email => 
      !email.includes('example.com') &&
      !email.includes('placeholder') &&
      !email.includes('your-email') &&
      !email.includes('test@') &&
      email.length > 5
    );
  }

  private static extractContacts(content: string): Contact[] {
    const contacts: Contact[] = [];
    const lines = content.split('\n');
    
    // Look for patterns that might indicate contact information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Look for names near email or contact keywords
      if (line.includes('contact') || line.includes('recruiter') || line.includes('hiring') || line.includes('manager')) {
        const nameMatch = lines[i].match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        const emailMatch = lines[i].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const phoneMatch = lines[i].match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
        
        if (nameMatch || emailMatch) {
          const contact: Contact = {
            name: nameMatch ? nameMatch[1] : 'Unknown',
            email: emailMatch ? emailMatch[1] : undefined,
            phone: phoneMatch ? phoneMatch[1] : undefined,
          };
          
          // Try to find position/title in nearby lines
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 3); j++) {
            const nearbyLine = lines[j];
            if (nearbyLine.toLowerCase().includes('manager') || 
                nearbyLine.toLowerCase().includes('director') || 
                nearbyLine.toLowerCase().includes('recruiter') ||
                nearbyLine.toLowerCase().includes('coordinator')) {
              contact.position = nearbyLine.trim();
              break;
            }
          }
          
          contacts.push(contact);
        }
      }
    }
    
    return contacts;
  }

  private static extractJobPostings(content: string): JobPosting[] {
    const jobPostings: JobPosting[] = [];
    const lines = content.split('\n');
    
    // Look for job posting patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for job titles (lines that might be headers)
      if (line.match(/^#+\s/) || // Markdown headers
          (line.length > 10 && line.length < 100 && 
           (line.toLowerCase().includes('engineer') ||
            line.toLowerCase().includes('developer') ||
            line.toLowerCase().includes('manager') ||
            line.toLowerCase().includes('analyst') ||
            line.toLowerCase().includes('specialist') ||
            line.toLowerCase().includes('coordinator')))) {
        
        const jobTitle = line.replace(/^#+\s/, '').trim();
        
        // Look for company name in nearby lines
        let company = 'Unknown Company';
        let description = '';
        let location = '';
        
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const nearbyLine = lines[j].toLowerCase();
          
          if (nearbyLine.includes('company') || nearbyLine.includes('corp') || nearbyLine.includes('inc')) {
            company = lines[j].trim();
          }
          
          if (nearbyLine.includes('location') || nearbyLine.includes('remote') || nearbyLine.includes('city')) {
            location = lines[j].trim();
          }
          
          if (lines[j].length > 50 && !description) {
            description = lines[j].trim();
          }
        }
        
        if (jobTitle.length > 5 && jobTitle.length < 100) {
          jobPostings.push({
            title: jobTitle,
            company,
            location: location || undefined,
            description: description || 'No description available',
            type: 'full-time' // Default
          });
        }
      }
    }
    
    return jobPostings.slice(0, 10); // Limit to first 10 jobs found
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
