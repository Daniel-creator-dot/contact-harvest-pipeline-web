
export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  linkedIn?: string;
}

export interface JobPosting {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements?: string[];
  salary?: string;
  type?: string; // full-time, part-time, contract
  postedDate?: string;
}

export interface ContactData {
  id: string;
  url: string;
  scrapedAt: string;
  emails: string[];
  contacts: Contact[];
  jobPostings: JobPosting[];
  metadata: {
    pageTitle: string;
    domain: string;
    totalWords: number;
    processingTime: number;
  };
}
