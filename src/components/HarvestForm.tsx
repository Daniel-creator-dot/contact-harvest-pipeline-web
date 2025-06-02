
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { JobSearchService, JobSearchResponse } from '@/services/JobSearchService';
import { Search, Play, Loader2, CheckCircle, ExternalLink } from 'lucide-react';

interface HarvestFormProps {
  onDataHarvested: (data: any) => void;
}

export const HarvestForm = ({ onDataHarvested }: HarvestFormProps) => {
  const { toast } = useToast();
  const [jobTitles, setJobTitles] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<JobSearchResponse | null>(null);

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
    setSearchResult(null);

    try {
      console.log(`Searching for jobs: ${titleList.join(', ')}`);
      
      const results = await JobSearchService.searchJobsByTitle(titleList);
      
      setSearchResult(results);
      
      if (results.success) {
        toast({
          title: "Search Started",
          description: `Job search initiated for ${titleList.length} job titles. Processing ${results.totalSources} sources...`,
        });
        
        // Trigger data refresh in parent component
        onDataHarvested(results);
        setJobTitles('');
      } else {
        toast({
          title: "Search Failed",
          description: results.error || "Failed to start job search",
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
          Enter job titles to automatically search for job postings and extract contact information with deep search. One job title per line.
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
              The system will automatically search for these job titles across major job sites with deep link analysis
            </div>
          </div>

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

        {searchResult && searchResult.success && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 mb-2">Search Initiated Successfully!</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Job Search ID: {searchResult.jobSearchId}</p>
                  <p>• Total Sources: {searchResult.totalSources}</p>
                  <p>• Status: Processing in background</p>
                  <p className="font-medium">{searchResult.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Enhanced Search Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Job postings on major job sites (LinkedIn, Indeed, etc.)</li>
            <li>• Deep search follows external links and redirects</li>
            <li>• Comprehensive email extraction from linked pages</li>
            <li>• Contact information for hiring managers</li>
            <li>• Detailed job requirements and descriptions</li>
            <li>• All processing happens securely in the backend</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
