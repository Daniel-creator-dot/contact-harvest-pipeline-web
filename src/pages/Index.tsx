
import { useState, useEffect } from 'react';
import { HarvestForm } from '@/components/HarvestForm';
import { DataDashboard } from '@/components/DataDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Globe, Mail, Users, FileText, Loader2 } from 'lucide-react';
import { JobSearchService } from '@/services/JobSearchService';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [jobSearches, setJobSearches] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const searches = await JobSearchService.getAllJobSearches();
      setJobSearches(searches);
      
      // Aggregate all contacts from all job searches
      const contacts: any[] = [];
      for (const search of searches) {
        const results = await JobSearchService.getJobSearchResults(search.id);
        if (results && 'contacts' in results) {
          contacts.push(...results.contacts);
        }
      }
      setAllContacts(contacts);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load job search data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataHarvested = () => {
    // Refresh data when new search is initiated
    setTimeout(() => {
      loadData();
    }, 2000); // Give the backend time to process
  };

  // Calculate stats
  const totalEmails = allContacts.reduce((acc, contact) => acc + (contact.emails?.length || 0), 0);
  const totalContacts = allContacts.reduce((acc, contact) => acc + (contact.contacts?.length || 0), 0);
  const totalJobPostings = allContacts.reduce((acc, contact) => acc + (contact.job_postings?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Automated Job Harvest Pipeline
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Search for job titles and automatically extract contact information with deep search capabilities. All processing happens securely in our backend.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : allContacts.length}
            </div>
            <div className="text-sm text-gray-600">Job Sources</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : totalEmails}
            </div>
            <div className="text-sm text-gray-600">Emails Found</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : totalContacts}
            </div>
            <div className="text-sm text-gray-600">Contacts</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : totalJobPostings}
            </div>
            <div className="text-sm text-gray-600">Job Postings</div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="harvest" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
            <TabsTrigger value="harvest" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Search Jobs
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="harvest">
            <HarvestForm onDataHarvested={handleDataHarvested} />
          </TabsContent>

          <TabsContent value="dashboard">
            <DataDashboard data={allContacts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
