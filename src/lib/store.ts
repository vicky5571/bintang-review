import {
  Venue,
  SalesAgent,
  ScanLog,
  FeedbackMessage,
  VenueAnalytics,
  SalesAgentSummary,
} from './types';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase/client';

// In-Memory Data Store fallback
class InMemoryStore {
  private salesAgents: SalesAgent[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Budi Santoso (Partner BD)',
      phone_whatsapp: '628123456789',
      email: 'budi@bintangreview.id',
      commission_type: 'percentage',
      commission_rate: 20,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  private venues: Venue[] = [
    {
      id: '00000000-0000-0000-0000-000000000002',
      slug: 'kopi-senja',
      name: 'Kopi Senja Utama',
      logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      redirect_mode: 'smart_funnel',
      feedback_channels: 'both',
      whatsapp_number: '628123456789',
      feedback_email: 'manager@kopisenja.com',
      owner_access_pin: '1234',
      is_active: true,
      sales_id: '00000000-0000-0000-0000-000000000001',
      deal_amount: 599000,
      monthly_retainer_fee: 49000,
      deal_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  private scanLogs: ScanLog[] = [];
  private feedbackMessages: FeedbackMessage[] = [];

  reset() {
    this.scanLogs = [];
    this.feedbackMessages = [];
  }

  async getVenueBySlug(slug: string): Promise<Venue | null> {
    const venue = this.venues.find((v) => v.slug.toLowerCase() === slug.toLowerCase());
    return venue ? { ...venue } : null;
  }

  async getVenueById(id: string): Promise<Venue | null> {
    const venue = this.venues.find((v) => v.id === id);
    return venue ? { ...venue } : null;
  }

  async listVenues(): Promise<Venue[]> {
    return [...this.venues];
  }

  async createVenue(data: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue> {
    const newVenue: Venue = {
      ...data,
      id: `venue-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.venues.push(newVenue);
    return { ...newVenue };
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
    const index = this.venues.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.venues[index] = {
      ...this.venues[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...this.venues[index] };
  }

  async logScan(data: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog> {
    const log: ScanLog = {
      ...data,
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      scanned_at: new Date().toISOString(),
    };
    this.scanLogs.push(log);
    return { ...log };
  }

  async saveFeedback(data: Omit<FeedbackMessage, 'id' | 'created_at'>): Promise<FeedbackMessage> {
    const feedback: FeedbackMessage = {
      ...data,
      id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    this.feedbackMessages.push(feedback);
    return { ...feedback };
  }

  async listFeedback(venueId: string): Promise<FeedbackMessage[]> {
    return this.feedbackMessages
      .filter((f) => f.venue_id === venueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getVenueAnalytics(venueId: string): Promise<VenueAnalytics> {
    const logs = this.scanLogs.filter((l) => l.venue_id === venueId);
    const today = new Date().toISOString().split('T')[0];

    const total_scans = logs.length;
    const positive_count = logs.filter((l) => l.action_taken === 'positive_review').length;
    const negative_count = logs.filter((l) => l.action_taken === 'negative_feedback').length;
    const direct_count = logs.filter((l) => l.action_taken === 'direct_redirect').length;
    const today_scans = logs.filter((l) => l.scanned_at.startsWith(today)).length;

    const rated_total = positive_count + negative_count;
    const satisfaction_rate = rated_total > 0 ? Math.round((positive_count / rated_total) * 100) : 100;

    return {
      total_scans,
      positive_count,
      negative_count,
      direct_count,
      satisfaction_rate,
      today_scans,
    };
  }

  async listSalesAgents(): Promise<SalesAgentSummary[]> {
    return this.salesAgents.map((agent) => {
      const agentVenues = this.venues.filter((v) => v.sales_id === agent.id);
      const total_venues = agentVenues.length;
      const total_revenue = agentVenues.reduce((sum, v) => sum + (Number(v.deal_amount) || 0), 0);
      const earned_commission =
        agent.commission_type === 'percentage'
          ? (total_revenue * agent.commission_rate) / 100
          : total_venues * agent.commission_rate;

      return {
        ...agent,
        total_venues,
        total_revenue,
        earned_commission,
      };
    });
  }
}

// Unified Store with live Supabase client and local fallback
class StoreRepository {
  private inMemory = new InMemoryStore();

  reset() {
    this.inMemory.reset();
  }

  async getVenueBySlug(slug: string): Promise<Venue | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('slug', slug.toLowerCase())
          .maybeSingle();

        if (!error && data) return data as Venue;
      } catch (err) {
        console.warn('Supabase getVenueBySlug error, using fallback:', err);
      }
    }
    return this.inMemory.getVenueBySlug(slug);
  }

  async getVenueById(id: string): Promise<Venue | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) return data as Venue;
      } catch (err) {
        console.warn('Supabase getVenueById error, using fallback:', err);
      }
    }
    return this.inMemory.getVenueById(id);
  }

  async listVenues(): Promise<Venue[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from('venues')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) return data as Venue[];
      } catch (err) {
        console.warn('Supabase listVenues error, using fallback:', err);
      }
    }
    return this.inMemory.listVenues();
  }

  async createVenue(data: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: created, error } = await client
          .from('venues')
          .insert([data])
          .select()
          .single();

        if (!error && created) return created as Venue;
      } catch (err) {
        console.warn('Supabase createVenue error, using fallback:', err);
      }
    }
    return this.inMemory.createVenue(data);
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: updated, error } = await client
          .from('venues')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (!error && updated) return updated as Venue;
      } catch (err) {
        console.warn('Supabase updateVenue error, using fallback:', err);
      }
    }
    return this.inMemory.updateVenue(id, updates);
  }

  async logScan(data: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: logged, error } = await supabase
          .from('scan_logs')
          .insert([data])
          .select()
          .single();

        if (!error && logged) return logged as ScanLog;
      } catch (err) {
        console.warn('Supabase logScan error, using fallback:', err);
      }
    }
    return this.inMemory.logScan(data);
  }

  async saveFeedback(data: Omit<FeedbackMessage, 'id' | 'created_at'>): Promise<FeedbackMessage> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: saved, error } = await supabase
          .from('feedback_messages')
          .insert([data])
          .select()
          .single();

        if (!error && saved) return saved as FeedbackMessage;
      } catch (err) {
        console.warn('Supabase saveFeedback error, using fallback:', err);
      }
    }
    return this.inMemory.saveFeedback(data);
  }

  async listFeedback(venueId: string): Promise<FeedbackMessage[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from('feedback_messages')
          .select('*')
          .eq('venue_id', venueId)
          .order('created_at', { ascending: false });

        if (!error && data) return data as FeedbackMessage[];
      } catch (err) {
        console.warn('Supabase listFeedback error, using fallback:', err);
      }
    }
    return this.inMemory.listFeedback(venueId);
  }

  async getVenueAnalytics(venueId: string): Promise<VenueAnalytics> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: logs, error } = await client
          .from('scan_logs')
          .select('*')
          .eq('venue_id', venueId);

        if (!error && logs) {
          const today = new Date().toISOString().split('T')[0];
          const total_scans = logs.length;
          const positive_count = logs.filter((l: ScanLog) => l.action_taken === 'positive_review').length;
          const negative_count = logs.filter((l: ScanLog) => l.action_taken === 'negative_feedback').length;
          const direct_count = logs.filter((l: ScanLog) => l.action_taken === 'direct_redirect').length;
          const today_scans = logs.filter((l: ScanLog) => l.scanned_at?.startsWith(today)).length;
          const rated_total = positive_count + negative_count;
          const satisfaction_rate = rated_total > 0 ? Math.round((positive_count / rated_total) * 100) : 100;

          return {
            total_scans,
            positive_count,
            negative_count,
            direct_count,
            satisfaction_rate,
            today_scans,
          };
        }
      } catch (err) {
        console.warn('Supabase getVenueAnalytics error, using fallback:', err);
      }
    }
    return this.inMemory.getVenueAnalytics(venueId);
  }

  async listSalesAgents(): Promise<SalesAgentSummary[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: agents } = await client.from('sales_agents').select('*');
        const { data: allVenues } = await client.from('venues').select('sales_id, deal_amount');

        if (agents && agents.length > 0) {
          return agents.map((agent: any) => {
            const agentVenues = (allVenues || []).filter((v: any) => v.sales_id === agent.id);
            const total_venues = agentVenues.length;
            const total_revenue = agentVenues.reduce((sum: number, v: any) => sum + (Number(v.deal_amount) || 0), 0);
            const earned_commission =
              agent.commission_type === 'percentage'
                ? (total_revenue * Number(agent.commission_rate)) / 100
                : total_venues * Number(agent.commission_rate);

            return {
              ...agent,
              total_venues,
              total_revenue,
              earned_commission,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase listSalesAgents error, using fallback:', err);
      }
    }
    return this.inMemory.listSalesAgents();
  }
}

export const dataStore = new StoreRepository();
