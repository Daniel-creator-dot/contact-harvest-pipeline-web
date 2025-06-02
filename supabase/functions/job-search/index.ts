
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobSearchRequest {
  jobTitles: string[];
}

interface ContactData {
  id: string;
  jobSearchId: string;
  sourceUrl: string;
  pageTitle?: string;
  domain: string;
  emails: string[];
  contacts: any[];
  jobPostings: any[];
  externalUrls: string[];
  processingTime: number;
  scrapedAt: string;
  redirectChain: string[];
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobTitles }: JobSearchRequest = await req.json();
    console.log('Starting job search for titles:', jobTitles);

    // Create job search record
    const { data: jobSearch, error: jobSearchError } = await supabase
      .from('job_searches')
      .insert({
        job_titles: jobTitles,
        status: 'processing',
        total_sources: 0,
        completed_sources: 0
      })
      .select()
      .single();

    if (jobSearchError) {
      console.error('Error creating job search:', jobSearchError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job search' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jobSearchId = jobSearch.id;
    
    // Generate search URLs for all job titles
    const searchUrls: string[] = [];
    for (const title of jobTitles) {
      searchUrls.push(...generateJobSearchUrls(title));
    }

    // Update total sources count
    await supabase
      .from('job_searches')
      .update({ total_sources: searchUrls.length })
      .eq('id', jobSearchId);

    // Process each URL with deep search
    let completedSources = 0;
    const allContactData: ContactData[] = [];

    for (const url of searchUrls) {
      try {
        console.log(`Processing URL: ${url}`);
        const contactData = await processUrlWithDeepSearch(url, jobSearchId, firecrawlApiKey);
        
        if (contactData) {
          // Save to database
          const { error: insertError } = await supabase
            .from('harvested_contacts')
            .insert({
              job_search_id: contactData.jobSearchId,
              source_url: contactData.sourceUrl,
              page_title: contactData.pageTitle,
              domain: contactData.domain,
              emails: contactData.emails,
              contacts: contactData.contacts,
              job_postings: contactData.jobPostings,
              external_urls: contactData.externalUrls,
              processing_time: contactData.processingTime,
              redirect_chain: contactData.redirectChain
            });

          if (!insertError) {
            allContactData.push(contactData);
          }
        }

        completedSources++;
        
        // Update progress
        await supabase
          .from('job_searches')
          .update({ completed_sources: completedSources })
          .eq('id', jobSearchId);

      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        completedSources++;
      }
    }

    // Mark job search as completed
    await supabase
      .from('job_searches')
      .update({ 
        status: 'completed',
        completed_sources: completedSources 
      })
      .eq('id', jobSearchId);

    console.log(`Job search completed. Found ${allContactData.length} sources with contact data`);

    return new Response(
      JSON.stringify({
        success: true,
        jobSearchId,
        totalSources: searchUrls.length,
        completedSources,
        contactDataCount: allContactData.length,
        message: `Job search completed for ${jobTitles.join(', ')}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Job search failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Job search failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

function generateJobSearchUrls(jobTitle: string): string[] {
  const encodedTitle = encodeURIComponent(jobTitle);
  
  return [
    `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
    `https://www.indeed.com/jobs?q=${encodedTitle}`,
    `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedTitle}`,
    `https://stackoverflow.com/jobs?q=${encodedTitle}`,
    `https://jobs.google.com/search?q=${encodedTitle}`,
    `https://www.ziprecruiter.com/Jobs/${encodedTitle}`,
    `https://www.monster.com/jobs/search/?q=${encodedTitle}`,
    `https://www.careerbuilder.com/jobs?keywords=${encodedTitle}`
  ];
}

async function processUrlWithDeepSearch(
  url: string, 
  jobSearchId: string, 
  apiKey: string
): Promise<ContactData | null> {
  const startTime = Date.now();
  const redirectChain: string[] = [url];
  
  try {
    // Scrape the initial URL
    const scrapedData = await scrapeWithFirecrawl(url, apiKey);
    
    if (!scrapedData.success) {
      console.log(`Failed to scrape ${url}: ${scrapedData.error}`);
      return null;
    }

    const content = scrapedData.content || '';
    const metadata = scrapedData.metadata || {};
    
    // Extract emails from main content
    let emails = extractEmails(content);
    
    // Extract external URLs for deep search
    const externalUrls = extractExternalUrls(content, url);
    
    // If no emails found, search external URLs
    if (emails.length === 0 && externalUrls.length > 0) {
      console.log(`No emails found on ${url}, searching ${externalUrls.length} external URLs`);
      
      for (const externalUrl of externalUrls.slice(0, 3)) { // Limit to 3 external URLs
        try {
          const externalData = await scrapeWithFirecrawl(externalUrl, apiKey);
          if (externalData.success && externalData.content) {
            const externalEmails = extractEmails(externalData.content);
            emails.push(...externalEmails);
            redirectChain.push(externalUrl);
          }
        } catch (error) {
          console.error(`Error scraping external URL ${externalUrl}:`, error);
        }
      }
    }

    // Extract contacts and job postings
    const contacts = extractContacts(content);
    const jobPostings = extractJobPostings(content);

    const contactData: ContactData = {
      id: generateId(),
      jobSearchId,
      sourceUrl: url,
      pageTitle: metadata.title || 'Unknown Page',
      domain: new URL(url).hostname,
      emails: [...new Set(emails)], // Remove duplicates
      contacts,
      jobPostings,
      externalUrls,
      processingTime: Date.now() - startTime,
      scrapedAt: new Date().toISOString(),
      redirectChain
    };

    return contactData;

  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    return null;
  }
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{
  success: boolean;
  content?: string;
  metadata?: any;
  error?: string;
}> {
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

function extractEmails(content: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = content.match(emailRegex) || [];
  
  // Filter out common false positives
  return emails.filter(email => 
    !email.includes('example.com') &&
    !email.includes('placeholder') &&
    !email.includes('your-email') &&
    !email.includes('test@') &&
    !email.includes('noreply@') &&
    !email.includes('no-reply@') &&
    email.length > 5
  );
}

function extractExternalUrls(content: string, baseUrl: string): string[] {
  const baseDomain = new URL(baseUrl).hostname;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const urls = content.match(urlRegex) || [];
  
  // Filter to external URLs and remove duplicates
  const externalUrls = urls
    .filter(url => {
      try {
        const domain = new URL(url).hostname;
        return domain !== baseDomain && 
               !url.includes('javascript:') &&
               !url.includes('mailto:') &&
               !url.includes('#');
      } catch {
        return false;
      }
    })
    .slice(0, 10); // Limit to 10 external URLs
    
  return [...new Set(externalUrls)];
}

function extractContacts(content: string): any[] {
  const contacts: any[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (line.includes('contact') || line.includes('recruiter') || line.includes('hiring') || line.includes('manager')) {
      const nameMatch = lines[i].match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
      const emailMatch = lines[i].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const phoneMatch = lines[i].match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
      
      if (nameMatch || emailMatch) {
        const contact: any = {
          name: nameMatch ? nameMatch[1] : 'Unknown',
          email: emailMatch ? emailMatch[1] : undefined,
          phone: phoneMatch ? phoneMatch[1] : undefined,
        };
        
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

function extractJobPostings(content: string): any[] {
  const jobPostings: any[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.match(/^#+\s/) || 
        (line.length > 10 && line.length < 100 && 
         (line.toLowerCase().includes('engineer') ||
          line.toLowerCase().includes('developer') ||
          line.toLowerCase().includes('manager') ||
          line.toLowerCase().includes('analyst') ||
          line.toLowerCase().includes('specialist') ||
          line.toLowerCase().includes('coordinator')))) {
      
      const jobTitle = line.replace(/^#+\s/, '').trim();
      
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
          type: 'full-time'
        });
      }
    }
  }
  
  return jobPostings.slice(0, 10);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

serve(serve_handler);
