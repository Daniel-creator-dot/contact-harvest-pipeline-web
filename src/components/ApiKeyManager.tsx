
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { ApiKeyService } from '@/services/ApiKeyService';

export const ApiKeyManager = () => {
  const { toast } = useToast();
  const [firecrawlKey, setFirecrawlKey] = useState(ApiKeyService.getFirecrawlKey() || '');
  const [isTestingFirecrawl, setIsTestingFirecrawl] = useState(false);
  const [firecrawlStatus, setFirecrawlStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');

  const testFirecrawlKey = async () => {
    if (!firecrawlKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    setIsTestingFirecrawl(true);
    try {
      const isValid = await ApiKeyService.testFirecrawlKey(firecrawlKey);
      setFirecrawlStatus(isValid ? 'valid' : 'invalid');
      
      if (isValid) {
        ApiKeyService.saveFirecrawlKey(firecrawlKey);
        toast({
          title: "Success",
          description: "Firecrawl API key is valid and saved",
        });
      } else {
        toast({
          title: "Invalid Key",
          description: "The Firecrawl API key is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing Firecrawl key:', error);
      setFirecrawlStatus('invalid');
      toast({
        title: "Error",
        description: "Failed to validate API key",
        variant: "destructive",
      });
    } finally {
      setIsTestingFirecrawl(false);
    }
  };

  const getStatusBadge = (status: 'valid' | 'invalid' | 'unknown') => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="secondary">Not tested</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Key className="h-5 w-5 text-blue-600" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure your API keys to enable data harvesting and email services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Firecrawl API Key */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-800">Firecrawl API</h3>
                <p className="text-sm text-gray-600">For web scraping and content extraction</p>
              </div>
              {getStatusBadge(firecrawlStatus)}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firecrawl-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="firecrawl-key"
                  type="password"
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                  placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1"
                />
                <Button 
                  onClick={testFirecrawlKey}
                  disabled={isTestingFirecrawl || !firecrawlKey.trim()}
                  variant="outline"
                >
                  {isTestingFirecrawl ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Get your API key from{' '}
              <a 
                href="https://firecrawl.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                firecrawl.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Email Service Configuration */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Email Services</h3>
              <p className="text-sm text-gray-600">Configure SMTP or email API for outreach campaigns</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">Username</Label>
                <Input id="smtp-user" placeholder="your-email@gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-pass">Password/App Password</Label>
                <Input id="smtp-pass" type="password" placeholder="••••••••" />
              </div>
            </div>
            
            <Button variant="outline" className="w-full" disabled>
              Test Email Configuration (Coming Soon)
            </Button>
          </div>

          {/* Additional API Services */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Additional Services</h3>
              <p className="text-sm text-gray-600">Optional integrations for enhanced functionality</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key (for content analysis)</Label>
                <Input id="openai-key" type="password" placeholder="sk-..." disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin-api">LinkedIn API (for profile enrichment)</Label>
                <Input id="linkedin-api" type="password" placeholder="API credentials" disabled />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              These integrations are planned for future releases
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Recommended APIs & Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Web Scraping APIs:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Firecrawl API</strong> - https://api.firecrawl.dev/v0/crawl</li>
              <li>• <strong>ScrapingBee</strong> - https://app.scrapingbee.com/api/v1/</li>
              <li>• <strong>Bright Data</strong> - https://brightdata.com/products/web-scraper-api</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Email Services:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>SendGrid API</strong> - https://api.sendgrid.com/v3/mail/send</li>
              <li>• <strong>Mailgun API</strong> - https://api.mailgun.net/v3/</li>
              <li>• <strong>Gmail API</strong> - https://gmail.googleapis.com/gmail/v1/</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Contact Enrichment:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Hunter.io API</strong> - https://api.hunter.io/v2/</li>
              <li>• <strong>Clearbit API</strong> - https://person.clearbit.com/v2/</li>
              <li>• <strong>LinkedIn Sales Navigator API</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
