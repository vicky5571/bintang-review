export type RedirectMode = 'smart_funnel' | 'direct_google';
export type FeedbackChannel = 'whatsapp' | 'email' | 'both';
export type ActionTaken = 'direct_redirect' | 'funnel_opened' | 'positive_review' | 'negative_feedback';

export interface SalesAgent {
  id: string;
  name: string;
  phone_whatsapp: string;
  email?: string;
  commission_type: 'percentage' | 'fixed_amount';
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  google_review_url: string;
  redirect_mode: RedirectMode;
  feedback_channels: FeedbackChannel;
  whatsapp_number?: string;
  feedback_email?: string;
  owner_access_pin: string;
  is_active: boolean;
  sales_id?: string;
  deal_amount: number;
  monthly_retainer_fee: number;
  deal_date: string;
  created_at: string;
  updated_at: string;
}

export interface ScanLog {
  id: string;
  venue_id: string;
  scanned_at: string;
  device_type?: string;
  action_taken: ActionTaken;
  rating_selected?: number;
}

export interface FeedbackMessage {
  id: string;
  venue_id: string;
  customer_name?: string;
  customer_contact?: string;
  table_number?: string;
  rating: number;
  message: string;
  created_at: string;
}

export interface VenueAnalytics {
  total_scans: number;
  positive_count: number;
  negative_count: number;
  direct_count: number;
  satisfaction_rate: number;
  today_scans: number;
}

export interface SalesAgentSummary extends SalesAgent {
  total_venues: number;
  total_revenue: number;
  earned_commission: number;
}
