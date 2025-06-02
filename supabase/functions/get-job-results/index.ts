
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const jobSearchId = url.searchParams.get('jobSearchId');

    if (jobSearchId) {
      // Get specific job search results
      const { data: jobSearch, error: jobSearchError } = await supabase
        .from('job_searches')
        .select('*')
        .eq('id', jobSearchId)
        .single();

      if (jobSearchError) {
        return new Response(
          JSON.stringify({ error: 'Job search not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: contacts, error: contactsError } = await supabase
        .from('harvested_contacts')
        .select('*')
        .eq('job_search_id', jobSearchId)
        .order('scraped_at', { ascending: false });

      if (contactsError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch contacts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          jobSearch,
          contacts: contacts || []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Get all recent job searches with their contact counts
      const { data: jobSearches, error: jobSearchesError } = await supabase
        .from('job_searches')
        .select(`
          *,
          harvested_contacts(count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (jobSearchesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch job searches' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          jobSearches: jobSearches || []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error fetching job results:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch results' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(serve_handler);
