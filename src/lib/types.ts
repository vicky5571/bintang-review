export type RedirectMode = 'smart_funnel' | 'direct_google';
export type FeedbackChannel = 'whatsapp' | 'email' | 'both';
export type ActionTaken = 'direct_redirect' | 'funnel_opened' | 'positive_review' | 'negative_feedback';

export type UserRole = 'super_admin' | 'marketing_specialist';

export interface AuthSession {
  authenticated: boolean;
  role?: UserRole;
  specialist_id?: string;
  name?: string;
  email?: string;
  phone_whatsapp?: string;
}

export interface MarketingSpecialist {
  id: string;
  name: string;
  phone_whatsapp: string;
  email?: string;
  access_pin: string;
  commission_type: 'percentage' | 'fixed_amount';
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

// Alias for internal database backwards compatibility
export type SalesAgent = MarketingSpecialist;

export type SubscriptionStatus = 'active' | 'pending_verification' | 'expired';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type BillingType = 'one_time' | 'subscription';

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
  marketing_id?: string | null;
  sales_id?: string | null;
  deal_amount: number;
  monthly_retainer_fee: number;
  deal_date: string;
  billing_type?: BillingType;
  subscription_status?: SubscriptionStatus;
  subscription_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfirmation {
  id: string;
  venue_id: string;
  amount: number;
  payment_method: string;
  sender_name: string;
  proof_url?: string;
  notes?: string;
  status: PaymentStatus;
  verified_at?: string;
  verified_notes?: string;
  created_at: string;
  venue_name?: string;
  venue_slug?: string;
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

export interface MarketingSpecialistSummary extends MarketingSpecialist {
  total_venues: number;
  total_revenue: number;
  earned_commission: number;
}

export type SalesAgentSummary = MarketingSpecialistSummary;
