
import { useState } from 'react';
import { ContactData } from '@/types/ContactData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, User, MapPin, Download, Search, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface DataDashboardProps {
  data: ContactData[];
}

export const DataDashboard = ({ data }: DataDashboardProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item =>
    item.metadata.pageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.metadata.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.emails.some(email => email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.contacts.some(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportToCSV = () => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = [];
    csvData.push(['URL', 'Domain', 'Email', 'Contact Name', 'Position', 'Company', 'Phone', 'LinkedIn', 'Job Title', 'Job Company', 'Job Location']);

    data.forEach(item => {
      item.emails.forEach(email => {
        csvData.push([item.url, item.metadata.domain, email, '', '', '', '', '', '', '', '']);
      });
      
      item.contacts.forEach(contact => {
        csvData.push([
          item.url,
          item.metadata.domain,
          contact.email || '',
          contact.name,
          contact.position || '',
          contact.company || '',
          contact.phone || '',
          contact.linkedIn || '',
          '',
          '',
          ''
        ]);
      });

      item.jobPostings.forEach(job => {
        csvData.push([
          item.url,
          item.metadata.domain,
          '',
          '',
          '',
          '',
          '',
          '',
          job.title,
          job.company,
          job.location || ''
        ]);
      });
    });

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-harvest-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Data exported successfully to CSV",
    });
  };

  if (data.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Data Yet</h3>
          <p className="text-gray-500">Start harvesting data from recruiting websites to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Export */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-gray-800">Harvested Data</CardTitle>
              <CardDescription>
                {data.length} websites processed, {data.reduce((acc, item) => acc + item.emails.length + item.contacts.length, 0)} contacts found
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by domain, email, name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      <div className="space-y-6">
        {filteredData.map((item) => (
          <Card key={item.id} className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    {item.metadata.pageTitle}
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>{item.metadata.domain}</span>
                    <span>•</span>
                    <span>Scraped: {new Date(item.scrapedAt).toLocaleDateString()}</span>
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {item.emails.length + item.contacts.length} contacts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="emails" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="emails">Emails ({item.emails.length})</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts ({item.contacts.length})</TabsTrigger>
                  <TabsTrigger value="jobs">Jobs ({item.jobPostings.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="emails" className="space-y-2">
                  {item.emails.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.emails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{email}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No emails found</p>
                  )}
                </TabsContent>
                
                <TabsContent value="contacts" className="space-y-3">
                  {item.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {item.contacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">{contact.name}</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.position && (
                              <div>
                                <span className="font-medium">Position:</span> {contact.position}
                              </div>
                            )}
                            {contact.company && (
                              <div>
                                <span className="font-medium">Company:</span> {contact.company}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No contacts found</p>
                  )}
                </TabsContent>
                
                <TabsContent value="jobs" className="space-y-3">
                  {item.jobPostings.length > 0 ? (
                    <div className="space-y-3">
                      {item.jobPostings.map((job, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">{job.title}</h4>
                            {job.type && <Badge variant="outline">{job.type}</Badge>}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><span className="font-medium">Company:</span> {job.company}</div>
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{job.location}</span>
                              </div>
                            )}
                            {job.salary && (
                              <div><span className="font-medium">Salary:</span> {job.salary}</div>
                            )}
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No job postings found</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
