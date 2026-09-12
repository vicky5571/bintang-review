import {
  Venue,
  SalesAgent,
  ScanLog,
  FeedbackMessage,
  VenueAnalytics,
  SalesAgentSummary,
  PaymentConfirmation,
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
      billing_type: 'subscription',
      subscription_status: 'active',
      subscription_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  private scanLogs: ScanLog[] = [];
  private feedbackMessages: FeedbackMessage[] = [];
  private paymentConfirmations: PaymentConfirmation[] = [];

  reset() {
    this.scanLogs = [];
    this.feedbackMessages = [];
    this.paymentConfirmations = [];
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
    const billing_type = data.billing_type || (data.monthly_retainer_fee === 0 ? 'one_time' : 'subscription');
    const newVenue: Venue = {
      ...data,
      billing_type,
      monthly_retainer_fee: billing_type === 'one_time' ? 0 : data.monthly_retainer_fee,
      subscription_status: data.subscription_status || 'active',
      subscription_until:
        data.subscription_until ||
        (billing_type === 'subscription'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined),
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
    const current = this.venues[index];
    const billing_type = updates.billing_type || current.billing_type || (updates.monthly_retainer_fee === 0 ? 'one_time' : 'subscription');
    this.venues[index] = {
      ...current,
      ...updates,
      billing_type,
      monthly_retainer_fee: billing_type === 'one_time' ? 0 : (updates.monthly_retainer_fee !== undefined ? updates.monthly_retainer_fee : current.monthly_retainer_fee),
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

  async createSalesAgent(data: Omit<SalesAgent, 'id' | 'created_at'>): Promise<SalesAgent> {
    const newAgent: SalesAgent = {
      ...data,
      id: `agent-${Date.now()}`,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
    };
    this.salesAgents.push(newAgent);
    return { ...newAgent };
  }

  async submitPaymentConfirmation(
    data: Omit<PaymentConfirmation, 'id' | 'status' | 'created_at' | 'verified_at' | 'verified_notes'>
  ): Promise<PaymentConfirmation> {
    const confirmation: PaymentConfirmation = {
      ...data,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.paymentConfirmations.unshift(confirmation);

    const venue = this.venues.find((v) => v.id === data.venue_id);
    if (venue) {
      venue.subscription_status = 'pending_verification';
    }

    return { ...confirmation };
  }

  async listPaymentConfirmations(): Promise<PaymentConfirmation[]> {
    return this.paymentConfirmations.map((p) => {
      const v = this.venues.find((venue) => venue.id === p.venue_id);
      return {
        ...p,
        venue_name: v?.name || 'Venue',
        venue_slug: v?.slug || '',
      };
    });
  }

  async verifyPaymentConfirmation(
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<PaymentConfirmation | null> {
    const confirmation = this.paymentConfirmations.find((p) => p.id === id);
    if (!confirmation) return null;

    confirmation.status = status;
    confirmation.verified_at = new Date().toISOString();
    confirmation.verified_notes = notes;

    const venue = this.venues.find((v) => v.id === confirmation.venue_id);
    if (venue) {
      if (status === 'approved') {
        venue.subscription_status = 'active';
        const currentExpiry = venue.subscription_until ? new Date(venue.subscription_until).getTime() : Date.now();
        const baseTime = Math.max(Date.now(), currentExpiry);
        venue.subscription_until = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        venue.subscription_status = 'expired';
      }
    }

    return { ...confirmation };
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
    const billing_type = data.billing_type || (data.monthly_retainer_fee === 0 ? 'one_time' : 'subscription');
    const payload = {
      ...data,
      billing_type,
      monthly_retainer_fee: billing_type === 'one_time' ? 0 : data.monthly_retainer_fee,
      subscription_status: data.subscription_status || 'active',
      subscription_until:
        data.subscription_until ||
        (billing_type === 'subscription'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined),
    };

    const sanitizedPayload = {
      ...payload,
      sales_id: payload.sales_id && String(payload.sales_id).trim() !== '' ? String(payload.sales_id).trim() : null,
      deal_date: payload.deal_date || new Date().toISOString().split('T')[0],
    };

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: created, error } = await client
          .from('venues')
          .insert([sanitizedPayload])
          .select()
          .single();

        if (!error && created) return created as Venue;
        if (error) console.warn('Supabase createVenue error:', error);
      } catch (err) {
        console.warn('Supabase createVenue error, using fallback:', err);
      }
    }
    return this.inMemory.createVenue(sanitizedPayload);
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue | null> {
    const sanitizedUpdates: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if ('sales_id' in updates) {
      sanitizedUpdates.sales_id = updates.sales_id && String(updates.sales_id).trim() !== '' ? String(updates.sales_id).trim() : null;
    }

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: updated, error } = await client
          .from('venues')
          .update(sanitizedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (!error && updated) return updated as Venue;
        if (error) console.warn('Supabase updateVenue error:', error);
      } catch (err) {
        console.warn('Supabase updateVenue error, using fallback:', err);
      }
    }
    return this.inMemory.updateVenue(id, sanitizedUpdates);
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

  async createSalesAgent(data: Omit<SalesAgent, 'id' | 'created_at'>): Promise<SalesAgent> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: created, error } = await client
          .from('sales_agents')
          .insert([
            {
              name: data.name,
              phone_whatsapp: data.phone_whatsapp,
              email: data.email || null,
              commission_type: data.commission_type || 'percentage',
              commission_rate: data.commission_rate || 20,
              is_active: data.is_active !== undefined ? data.is_active : true,
            },
          ])
          .select()
          .single();

        if (!error && created) return created as SalesAgent;
      } catch (err) {
        console.warn('Supabase createSalesAgent error, using fallback:', err);
      }
    }
    return this.inMemory.createSalesAgent(data);
  }

  async submitPaymentConfirmation(
    data: Omit<PaymentConfirmation, 'id' | 'status' | 'created_at' | 'verified_at' | 'verified_notes'>
  ): Promise<PaymentConfirmation> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: created, error } = await client
          .from('payment_confirmations')
          .insert([data])
          .select()
          .single();

        if (!error && created) {
          await client
            .from('venues')
            .update({ subscription_status: 'pending_verification' })
            .eq('id', data.venue_id);

          return created as PaymentConfirmation;
        }
      } catch (err) {
        console.warn('Supabase submitPaymentConfirmation error, using fallback:', err);
      }
    }
    return this.inMemory.submitPaymentConfirmation(data);
  }

  async listPaymentConfirmations(): Promise<PaymentConfirmation[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: confirmations, error } = await client
          .from('payment_confirmations')
          .select('*, venues(name, slug)')
          .order('created_at', { ascending: false });

        if (!error && confirmations) {
          return confirmations.map((c: any) => ({
            ...c,
            venue_name: c.venues?.name || 'Venue',
            venue_slug: c.venues?.slug || '',
          }));
        }
      } catch (err) {
        console.warn('Supabase listPaymentConfirmations error, using fallback:', err);
      }
    }
    return this.inMemory.listPaymentConfirmations();
  }

  async verifyPaymentConfirmation(
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<PaymentConfirmation | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data: updated, error } = await client
          .from('payment_confirmations')
          .update({
            status,
            verified_at: new Date().toISOString(),
            verified_notes: notes,
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && updated) {
          const extensionDays = 30;
          const newExpiry = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000).toISOString();
          await client
            .from('venues')
            .update({
              subscription_status: status === 'approved' ? 'active' : 'expired',
              subscription_until: status === 'approved' ? newExpiry : undefined,
            })
            .eq('id', updated.venue_id);

          return updated as PaymentConfirmation;
        }
      } catch (err) {
        console.warn('Supabase verifyPaymentConfirmation error, using fallback:', err);
      }
    }
    return this.inMemory.verifyPaymentConfirmation(id, status, notes);
  }
}

export const dataStore = new StoreRepository();
