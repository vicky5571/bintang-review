import {
  Venue,
  SalesAgent,
  ScanLog,
  FeedbackMessage,
  VenueAnalytics,
  SalesAgentSummary,
} from './types';

// In-Memory Data Store with default mock venue for local development & testing
class InMemoryStore {
  private salesAgents: SalesAgent[] = [
    {
      id: 'agent-1',
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
      id: 'venue-1',
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
      sales_id: 'agent-1',
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

export const dataStore = new InMemoryStore();
