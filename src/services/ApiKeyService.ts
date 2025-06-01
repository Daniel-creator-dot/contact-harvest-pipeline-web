
export class ApiKeyService {
  private static FIRECRAWL_KEY = 'contact_harvest_firecrawl_key';

  static saveFirecrawlKey(apiKey: string): void {
    localStorage.setItem(this.FIRECRAWL_KEY, apiKey);
    console.log('Firecrawl API key saved');
  }

  static getFirecrawlKey(): string | null {
    return localStorage.getItem(this.FIRECRAWL_KEY);
  }

  static async testFirecrawlKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key');
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown']
        }),
      });

      const data = await response.json();
      console.log('Firecrawl test response:', data);
      
      return response.ok && data.success;
    } catch (error) {
      console.error('Error testing Firecrawl key:', error);
      return false;
    }
  }
}
