
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContactData } from '@/types/ContactData';
import { JobSearchService } from '@/services/JobSearchService';
import { Search, Play, Loader2 } from 'lucide-react';

interface HarvestFormProps {
  onDataHarvested: (data: ContactData[]) => void;
}

export const HarvestForm = ({ onDataHarvested }: HarvestFormProps) => {
  const { toast } = useToast();
  const [jobTitles, setJobTitles] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitles.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one job title to search",
        variant: "destructive",
      });
      return;
    }

    const titleList = jobTitles.split('\n').filter(title => title.trim()).map(title => title.trim());
    
    if (titleList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid job titles",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setProgress(0);
    const harvestedData: ContactData[] = [];

    try {
      for (let i = 0; i < titleList.length; i++) {
        const title = titleList[i];
        setCurrentTitle(title);
        setProgress((i / titleList.length) * 100);

        console.log(`Searching for jobs: ${title}`);
        
        try {
          const results = await JobSearchService.searchJobsByTitle(title);
          if (results.success && results.data) {
            harvestedData.push(...results.data);
            toast({
              title: "Success",
              description: `Found ${results.data.length} job postings for "${title}"`,
            });
          } else {
            toast({
              title: "Warning",
              description: `No jobs found for "${title}": ${results.error}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error searching for ${title}:`, error);
          toast({
            title: "Error",
            description: `Failed to search for "${title}"`,
            variant: "destructive",
          });
        }
      }

      setProgress(100);
      
      if (harvestedData.length > 0) {
        onDataHarvested(harvestedData);
        toast({
          title: "Search Complete",
          description: `Successfully found ${harvestedData.length} job postings`,
        });
        setJobTitles('');
      } else {
        toast({
          title: "No Data",
          description: "No job postings were found for the provided titles",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Job search process failed:', error);
      toast({
        title: "Error",
        description: "Job search process failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setCurrentTitle('');
      setProgress(0);
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Search className="h-5 w-5 text-blue-600" />
          Search Job Postings
        </CardTitle>
        <CardDescription>
          Enter job titles to automatically search for job postings and extract contact information. One job title per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobTitles" className="text-gray-700 font-medium">
              Job Titles
            </Label>
            <Textarea
              id="jobTitles"
              value={jobTitles}
              onChange={(e) => setJobTitles(e.target.value)}
              className="min-h-32 resize-none"
              placeholder="Software Engineer&#10;Marketing Manager&#10;Sales Representative&#10;Data Analyst..."
              disabled={isSearching}
            />
            <div className="text-sm text-gray-500">
              The system will automatically search for these job titles across major job sites
            </div>
          </div>

          {isSearching && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Searching for: {currentTitle || 'Preparing...'}
                </span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            type="submit"
            disabled={isSearching || !jobTitles.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching Jobs...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Job Search
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What we search for:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Job postings on major job sites (LinkedIn, Indeed, etc.)</li>
            <li>• Company career pages with matching positions</li>
            <li>• Contact information for hiring managers</li>
            <li>• Email addresses from job descriptions</li>
            <li>• Detailed job requirements and descriptions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
