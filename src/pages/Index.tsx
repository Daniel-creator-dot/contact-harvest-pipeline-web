
import { useState } from 'react';
import { HarvestForm } from '@/components/HarvestForm';
import { DataDashboard } from '@/components/DataDashboard';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ContactData } from '@/types/ContactData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Globe, Mail, Users, FileText } from 'lucide-react';

const Index = () => {
  const [harvestedData, setHarvestedData] = useState<ContactData[]>([]);

  const handleDataHarvested = (newData: ContactData[]) => {
    setHarvestedData(prev => [...prev, ...newData]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Automated Job Harvest Pipeline
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Search for job titles and automatically extract contact information, job descriptions, and hiring details from across the web
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{harvestedData.length}</div>
            <div className="text-sm text-gray-600">Job Sources</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {harvestedData.reduce((acc, item) => acc + item.emails.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Emails Found</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {harvestedData.reduce((acc, item) => acc + item.contacts.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Contacts</div>
          </Card>
          <Card className="p-6 text-center bg-white shadow-lg border-0">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {harvestedData.reduce((acc, item) => acc + item.jobPostings.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Job Postings</div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="harvest" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
            <TabsTrigger value="harvest" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Search Jobs
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              API Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="harvest">
            <HarvestForm onDataHarvested={handleDataHarvested} />
          </TabsContent>

          <TabsContent value="dashboard">
            <DataDashboard data={harvestedData} />
          </TabsContent>

          <TabsContent value="settings">
            <ApiKeyManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
