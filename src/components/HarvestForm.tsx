
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContactData } from '@/types/ContactData';
import { HarvestService } from '@/services/HarvestService';
import { Globe, Play, Loader2 } from 'lucide-react';

interface HarvestFormProps {
  onDataHarvested: (data: ContactData[]) => void;
}

export const HarvestForm = ({ onDataHarvested }: HarvestFormProps) => {
  const { toast } = useToast();
  const [urls, setUrls] = useState('');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urls.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one URL to harvest",
        variant: "destructive",
      });
      return;
    }

    const urlList = urls.split('\n').filter(url => url.trim()).map(url => url.trim());
    
    if (urlList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid URLs",
        variant: "destructive",
      });
      return;
    }

    setIsHarvesting(true);
    setProgress(0);
    const harvestedData: ContactData[] = [];

    try {
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        setCurrentUrl(url);
        setProgress((i / urlList.length) * 100);

        console.log(`Harvesting data from: ${url}`);
        
        try {
          const result = await HarvestService.harvestFromUrl(url);
          if (result.success && result.data) {
            harvestedData.push(result.data);
            toast({
              title: "Success",
              description: `Successfully harvested data from ${new URL(url).hostname}`,
            });
          } else {
            toast({
              title: "Warning",
              description: `Failed to harvest from ${url}: ${result.error}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error harvesting ${url}:`, error);
          toast({
            title: "Error",
            description: `Failed to process ${url}`,
            variant: "destructive",
          });
        }
      }

      setProgress(100);
      
      if (harvestedData.length > 0) {
        onDataHarvested(harvestedData);
        toast({
          title: "Harvest Complete",
          description: `Successfully harvested data from ${harvestedData.length} websites`,
        });
        setUrls('');
      } else {
        toast({
          title: "No Data",
          description: "No data was successfully harvested from the provided URLs",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Harvest process failed:', error);
      toast({
        title: "Error",
        description: "Harvest process failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHarvesting(false);
      setCurrentUrl('');
      setProgress(0);
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Globe className="h-5 w-5 text-blue-600" />
          Harvest Contact Data
        </CardTitle>
        <CardDescription>
          Enter recruiting website URLs to extract emails, contacts, and job postings. One URL per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="urls" className="text-gray-700 font-medium">
              Website URLs
            </Label>
            <Textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              className="min-h-32 resize-none"
              placeholder="https://jobs.company.com&#10;https://careers.example.com&#10;https://linkedin.com/jobs/..."
              disabled={isHarvesting}
            />
            <div className="text-sm text-gray-500">
              Supported sites: LinkedIn Jobs, Indeed, company career pages, recruiting sites
            </div>
          </div>

          {isHarvesting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Processing: {currentUrl ? new URL(currentUrl).hostname : 'Preparing...'}
                </span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            type="submit"
            disabled={isHarvesting || !urls.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isHarvesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Harvesting Data...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Harvest
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What we extract:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Email addresses from contact forms and pages</li>
            <li>• Contact information (names, phone numbers, LinkedIn profiles)</li>
            <li>• Job descriptions and requirements</li>
            <li>• Company information and job roles</li>
            <li>• Hiring manager details where available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
