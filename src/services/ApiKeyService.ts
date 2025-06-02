
// API keys are now managed securely in Supabase Edge Function Secrets
// This service is kept for backward compatibility but is no longer used

export class ApiKeyService {
  static saveFirecrawlKey(apiKey: string): void {
    console.warn('API keys are now managed in Supabase Edge Function Secrets. This method is deprecated.');
  }

  static getFirecrawlKey(): string | null {
    console.warn('API keys are now managed in Supabase Edge Function Secrets. This method is deprecated.');
    return null;
  }

  static async testFirecrawlKey(apiKey: string): Promise<boolean> {
    console.warn('API keys are now managed in Supabase Edge Function Secrets. This method is deprecated.');
    return false;
  }
}
