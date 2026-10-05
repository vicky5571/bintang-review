import { HppBearer, RemittanceStatus } from '@/lib/types';

export type HppPayerType = 'marketing' | 'platform' | 'split';
export type DeveloperFeeRecipient = 'vicky' | 'natan' | 'split';

export interface DeveloperFeeDistribution {
  developer_fee_10: number;
  developer_fee_vicky: number;
  developer_fee_natan: number;
  developer_fee_recipient: DeveloperFeeRecipient;
  developer_fee_recipient_notes: string;
}

export interface BearerSummary {
  bearer: HppBearer;
  amount: number; // HPP modal contributed
  ratio: number; // Percentage of total HPP (0-100)
  reimburse: number; // HPP modal reimbursement
  transport: number; // Flat transport (only if closing marketing specialist)
  final_share: number; // Proportional share of net_split_profit
  total_payout: number; // reimburse + transport + final_share
  net_income: number; // total_payout - reimburse (pure profit)
}

export interface ProfitDistributionParams {
  deal_amount: number;
  hpp: number;
  hpp_payer?: HppPayerType;
  hpp_marketing_ratio?: number; // 0 to 100 (percentage borne by marketing)
  hpp_marketing_amount?: number; // Exact Rupiah nominal borne by marketing
  hpp_bearers?: HppBearer[];
  closing_specialist_id?: string | null;
  closing_specialist_name?: string | null;
  transport_fee?: number; // Default flat Rp 20.000 jika HPP fisik > 0, Rp 0 jika langganan / HPP = 0
}

export interface ProfitDistributionResult {
  deal_amount: number;
  hpp: number;
  hpp_payer: HppPayerType;
  hpp_marketing_ratio: number;
  hpp_platform_ratio: number;
  hpp_marketing_amount: number;
  hpp_platform_amount: number;

  // Step 1: Reimburse HPP
  reimburse_marketing: number;
  reimburse_platform: number;

  // Step 2: Sisa Profit Kotor (deal_amount - hpp)
  gross_profit: number;

  // Step 3: Distribusi Developer Fee (10% dari gross_profit)
  platform_fee_10: number; // Backward compatibility alias
  developer_fee_10: number; // 10% dari gross_profit
  developer_fee_vicky: number; // Hak Developer Fee Vicky
  developer_fee_natan: number; // Hak Developer Fee Natan
  developer_fee_recipient: DeveloperFeeRecipient;
  developer_fee_recipient_notes: string;

  marketing_transport: number; // Flat (default 20.000 jika HPP > 0, 0 jika subscription)
  net_split_profit: number; // gross_profit - developer_fee_10 - marketing_transport

  // Pembagian Sisa Profit sesuai porsi penanggung HPP
  marketing_final_share: number;
  platform_final_share: number;

  // Total Nominal Diterima Masing-Masing Pihak
  marketing_total_payout: number; // reimburse_marketing + marketing_transport + marketing_final_share
  platform_total_payout: number; // reimburse_platform + platform_fee_10 + platform_final_share

  // Laba Bersih Murni (Net profit di atas modal HPP yang dikeluarkan)
  marketing_net_income: number; // marketing_total_payout - reimburse_marketing
  platform_net_income: number; // platform_total_payout - reimburse_platform

  // Field Remittance (Arus Kas Terbalik)
  marketing_retained: number; // Hak bersih yang langsung diambil marketing di lapangan
  platform_remittance_due: number; // Nominal wajib disetor ke kas platform

  // Multi-Bearer Breakdown
  bearers_summary: BearerSummary[];
}

export function getDeveloperFeeDistribution(
  fee: number,
  specialistNameOrId?: string | null
): DeveloperFeeDistribution {
  const norm = (specialistNameOrId || '').toLowerCase().trim();
  const feeAmount = Math.max(0, Math.round(fee));

  // If deal closed by Vicky -> 100% Developer Fee to Natan
  const isVicky = norm.includes('vicky') || norm.includes('galih');
  // If deal closed by Natan -> 100% Developer Fee to Vicky
  const isNatan = norm.includes('natan') || norm.includes('setyo');

  if (isVicky && !isNatan) {
    return {
      developer_fee_10: feeAmount,
      developer_fee_vicky: 0,
      developer_fee_natan: feeAmount,
      developer_fee_recipient: 'natan',
      developer_fee_recipient_notes: '100% dialokasikan ke Natan Setyo Agung (deal dicapai oleh Vicky Galih Pamungkas)',
    };
  }

  if (isNatan && !isVicky) {
    return {
      developer_fee_10: feeAmount,
      developer_fee_vicky: feeAmount,
      developer_fee_natan: 0,
      developer_fee_recipient: 'vicky',
      developer_fee_recipient_notes: '100% dialokasikan ke Vicky Galih Pamungkas (deal dicapai oleh Natan Setyo Agung)',
    };
  }

  // If external specialist (e.g. Budi Santoso or others), or partner not specifically identified:
  // Split 50:50 between Vicky & Natan
  const vickyShare = Math.round(feeAmount * 0.5);
  const natanShare = feeAmount - vickyShare;

  return {
    developer_fee_10: feeAmount,
    developer_fee_vicky: vickyShare,
    developer_fee_natan: natanShare,
    developer_fee_recipient: 'split',
    developer_fee_recipient_notes: 'Dibagi rata 50:50 antara Vicky Galih Pamungkas & Natan Setyo Agung',
  };
}

export function calculateProfitDistribution(params: ProfitDistributionParams): ProfitDistributionResult {
  const deal_amount = Math.max(0, Number(params.deal_amount) || 0);
  const hpp = Math.max(0, Number(params.hpp) || 0);
  // Default transport fee: Rp 20.000 jika ada HPP fisik, Rp 0 jika model langganan berulang (zero-HPP)
  const defaultTransport = params.transport_fee !== undefined
    ? Number(params.transport_fee)
    : (hpp === 0 ? 0 : 20000);
  const closingSpecialistId = params.closing_specialist_id || null;
  const closingSpecialistName = params.closing_specialist_name || null;

  // Step 2: Sisa Profit Kotor
  const gross_profit = Math.max(0, deal_amount - hpp);

  // Step 3: Distribusi Developer Fee (10% dari gross_profit)
  const platform_fee_10 = Math.round(gross_profit * 0.10);
  const developer_fee_10 = platform_fee_10;

  // Flat uang transport ke marketing specialist yang mencapai deal (maksimal sisa yang tersedia)
  const remainingAfterFee = Math.max(0, gross_profit - platform_fee_10);
  const marketing_transport = Math.min(defaultTransport, remainingAfterFee);

  // Sisa profit akhir untuk dibagi sesuai porsi modal HPP / marketing specialist
  const net_split_profit = Math.max(0, remainingAfterFee - marketing_transport);

  // Determine active bearers
  let rawBearers: HppBearer[] = [];

  if (params.hpp_bearers && Array.isArray(params.hpp_bearers) && params.hpp_bearers.length > 0) {
    rawBearers = params.hpp_bearers.map((b) => ({ ...b }));
  } else {
    // Synthesize bearers from legacy fields
    let legacyPayer: HppPayerType = params.hpp_payer || 'marketing';
    let mAmount = hpp;

    if (params.hpp_marketing_amount !== undefined && params.hpp_marketing_amount !== null && !isNaN(Number(params.hpp_marketing_amount))) {
      mAmount = Math.min(hpp, Math.max(0, Number(params.hpp_marketing_amount)));
      if (mAmount === hpp) legacyPayer = 'marketing';
      else if (mAmount === 0) legacyPayer = 'platform';
      else legacyPayer = 'split';
    } else if (params.hpp_marketing_ratio !== undefined && params.hpp_marketing_ratio !== null && !isNaN(Number(params.hpp_marketing_ratio))) {
      const r = Math.min(100, Math.max(0, Number(params.hpp_marketing_ratio)));
      mAmount = Math.round((hpp * r) / 100);
      if (r === 100) legacyPayer = 'marketing';
      else if (r === 0) legacyPayer = 'platform';
      else legacyPayer = 'split';
    } else {
      if (legacyPayer === 'platform') mAmount = 0;
      else if (legacyPayer === 'split') mAmount = Math.round(hpp * 0.5);
      else mAmount = hpp;
    }

    const pAmount = hpp - mAmount;

    if (legacyPayer === 'platform') {
      rawBearers = [
        {
          id: 'bearer-platform',
          type: 'platform',
          specialist_id: null,
          name: 'Platform / Agency (Kas Perusahaan)',
          amount: hpp,
          ratio: 100,
        },
      ];
    } else if (legacyPayer === 'marketing') {
      rawBearers = [
        {
          id: 'bearer-marketing-1',
          type: 'marketing',
          specialist_id: closingSpecialistId,
          name: closingSpecialistName || 'Marketing Specialist',
          amount: hpp,
          ratio: 100,
        },
      ];
    } else {
      rawBearers = [
        {
          id: 'bearer-marketing-1',
          type: 'marketing',
          specialist_id: closingSpecialistId,
          name: closingSpecialistName || 'Marketing Specialist',
          amount: mAmount,
          ratio: hpp > 0 ? (mAmount / hpp) * 100 : 50,
        },
        {
          id: 'bearer-platform',
          type: 'platform',
          specialist_id: null,
          name: 'Platform / Agency (Kas Perusahaan)',
          amount: pAmount,
          ratio: hpp > 0 ? (pAmount / hpp) * 100 : 50,
        },
      ];
    }
  }

  // Calculate breakdown for each bearer
  const bearers_summary: BearerSummary[] = [];
  let allocatedShareSum = 0;

  // Check if closing specialist is among marketing bearers
  const closingSpecialistInBearers = closingSpecialistId
    ? rawBearers.some((b) => b.type === 'marketing' && b.specialist_id === closingSpecialistId)
    : false;

  // First marketing bearer index to receive transport / profit share if closing specialist not specifically isolated
  const firstMarketingIndex = rawBearers.findIndex((b) => b.type === 'marketing');

  for (let i = 0; i < rawBearers.length; i++) {
    const b = rawBearers[i];
    const amount = Math.max(0, Number(b.amount) || 0);
    const ratio = hpp > 0 ? (amount / hpp) * 100 : (b.ratio || 0);
    const reimburse = amount;

    // Allocate share of net_split_profit without rounding drift
    let final_share = 0;
    if (hpp > 0 && net_split_profit > 0) {
      if (i === rawBearers.length - 1) {
        // Last bearer absorbs remainder
        final_share = Math.max(0, net_split_profit - allocatedShareSum);
      } else {
        final_share = Math.round(net_split_profit * (amount / hpp));
        allocatedShareSum += final_share;
      }
    } else if (hpp === 0 && net_split_profit > 0) {
      // Untuk transaksi zero-HPP (misal langganan digital berulang),
      // 100% sisa laba bersih dialokasikan ke marketing specialist yang closing deal
      if (firstMarketingIndex !== -1) {
        if (b.type === 'marketing') {
          if (closingSpecialistInBearers) {
            if (b.specialist_id === closingSpecialistId) {
              final_share = net_split_profit;
            }
          } else if (i === firstMarketingIndex) {
            final_share = net_split_profit;
          }
        }
      } else if (i === rawBearers.length - 1) {
        // Fallback jika tidak ada marketing bearer eksplisit
        final_share = net_split_profit;
      }
    }

    // Determine if this bearer gets the flat marketing transport fee
    let transport = 0;
    if (b.type === 'marketing') {
      if (closingSpecialistInBearers) {
        if (b.specialist_id === closingSpecialistId) {
          transport = marketing_transport;
        }
      } else if (i === firstMarketingIndex) {
        transport = marketing_transport;
      }
    }

    const total_payout = reimburse + transport + final_share;
    const net_income = total_payout - reimburse;

    bearers_summary.push({
      bearer: { ...b, amount, ratio },
      amount,
      ratio,
      reimburse,
      transport,
      final_share,
      total_payout,
      net_income,
    });
  }

  // Aggregate marketing vs platform totals for backward-compatibility
  const marketingBearers = bearers_summary.filter((s) => s.bearer.type === 'marketing');
  const platformBearers = bearers_summary.filter((s) => s.bearer.type === 'platform');

  const reimburse_marketing = marketingBearers.reduce((sum, b) => sum + b.reimburse, 0);
  const reimburse_platform = platformBearers.reduce((sum, b) => sum + b.reimburse, 0);

  const marketing_final_share = marketingBearers.reduce((sum, b) => sum + b.final_share, 0);
  const platform_final_share = platformBearers.reduce((sum, b) => sum + b.final_share, 0);

  const hpp_marketing_amount = reimburse_marketing;
  const hpp_platform_amount = reimburse_platform;
  const hpp_marketing_ratio = hpp > 0 ? (reimburse_marketing / hpp) * 100 : (reimburse_marketing > 0 ? 100 : 0);
  const hpp_platform_ratio = 100 - hpp_marketing_ratio;

  // Determine overall hpp_payer tag
  let hpp_payer: HppPayerType = 'split';
  if (reimburse_platform === 0 && reimburse_marketing > 0) {
    hpp_payer = 'marketing';
  } else if (reimburse_marketing === 0 && reimburse_platform > 0) {
    hpp_payer = 'platform';
  }

  const marketing_total_payout = reimburse_marketing + marketing_transport + marketing_final_share;
  const platform_total_payout = reimburse_platform + platform_fee_10 + platform_final_share;

  const marketing_net_income = marketing_total_payout - reimburse_marketing;
  const platform_net_income = platform_total_payout - reimburse_platform;

  // Field Remittance (Arus Kas Terbalik)
  // Marketing retains their reimbursement, transport, and profit share
  const marketing_retained = marketing_total_payout;
  // Platform collects the remaining balance (platform reimburse + platform fee + platform share)
  const platform_remittance_due = Math.max(0, deal_amount - marketing_retained);

  // Reciprocal Developer Fee calculation
  let specialistIdentifier = closingSpecialistName || closingSpecialistId;
  if (!specialistIdentifier && closingSpecialistInBearers) {
    const bearerObj = rawBearers.find((b) => b.type === 'marketing' && b.specialist_id === closingSpecialistId);
    if (bearerObj?.name) specialistIdentifier = bearerObj.name;
  }
  const devFeeDist = getDeveloperFeeDistribution(developer_fee_10, specialistIdentifier);

  return {
    deal_amount,
    hpp,
    hpp_payer,
    hpp_marketing_ratio,
    hpp_platform_ratio,
    hpp_marketing_amount,
    hpp_platform_amount,
    reimburse_marketing,
    reimburse_platform,
    gross_profit,
    platform_fee_10,
    developer_fee_10,
    developer_fee_vicky: devFeeDist.developer_fee_vicky,
    developer_fee_natan: devFeeDist.developer_fee_natan,
    developer_fee_recipient: devFeeDist.developer_fee_recipient,
    developer_fee_recipient_notes: devFeeDist.developer_fee_recipient_notes,
    marketing_transport,
    net_split_profit,
    marketing_final_share,
    platform_final_share,
    marketing_total_payout,
    platform_total_payout,
    marketing_net_income,
    platform_net_income,
    marketing_retained,
    platform_remittance_due,
    bearers_summary,
  };
}

export interface BearerSettlementItem {
  bearer: HppBearer;
  reimburse: number;
  reimburse_status: 'unpaid' | 'paid' | 'not_applicable';
  transport: number;
  profit_share: number;
  profit_share_status: 'unpaid' | 'paid';
  unpaid_reimburse: number;
  unpaid_profit_share: number;
  total_unpaid: number;
  paid_reimburse: number;
  paid_profit_share: number;
  total_paid: number;
}

export interface VenueSettlementSummary {
  reimburse_marketing: number;
  reimburse_status: 'unpaid' | 'paid' | 'not_applicable';
  profit_share_marketing: number; // marketing_transport + marketing_final_share
  profit_share_status: 'unpaid' | 'paid';

  // Outstanding (unpaid) amounts owed to marketing specialists
  unpaid_reimburse_marketing: number;
  unpaid_profit_share_marketing: number;
  total_unpaid_marketing: number;

  // Paid (disbursed) amounts
  paid_reimburse_marketing: number;
  paid_profit_share_marketing: number;
  total_paid_marketing: number;

  // Field Remittance Tracking
  remittance_due: number; // Nominal wajib disetor ke kas platform
  remittance_status: RemittanceStatus; // 'unpaid' | 'submitted' | 'verified' | 'not_applicable'
  marketing_retained: number; // Nominal hak bersih yang langsung dinikmati marketing

  // Multi-Bearer Breakdown
  bearers_settlement: BearerSettlementItem[];
}

export function calculateVenueSettlement(venue: {
  deal_amount: number;
  hpp: number;
  hpp_payer?: HppPayerType;
  hpp_marketing_ratio?: number;
  hpp_marketing_amount?: number;
  hpp_bearers?: HppBearer[];
  sales_id?: string | null;
  marketing_id?: string | null;
  marketing_name?: string | null;
  transport_fee?: number;
  hpp_reimburse_status?: 'unpaid' | 'paid' | 'not_applicable';
  profit_share_status?: 'unpaid' | 'paid' | 'not_applicable';
  remittance_status?: RemittanceStatus;
}): VenueSettlementSummary {
  const dist = calculateProfitDistribution({
    deal_amount: venue.deal_amount,
    hpp: venue.hpp,
    hpp_payer: venue.hpp_payer,
    hpp_marketing_ratio: venue.hpp_marketing_ratio,
    hpp_marketing_amount: venue.hpp_marketing_amount,
    hpp_bearers: venue.hpp_bearers,
    closing_specialist_id: venue.sales_id || venue.marketing_id,
    closing_specialist_name: venue.marketing_name,
    transport_fee: venue.transport_fee,
  });

  const venueReimburseStatus = venue.hpp_reimburse_status || 'unpaid';
  const venueProfitShareStatus = venue.profit_share_status === 'paid' ? 'paid' : 'unpaid';

  // Calculate settlement for each marketing bearer
  const bearers_settlement: BearerSettlementItem[] = [];

  for (const item of dist.bearers_summary) {
    if (item.bearer.type === 'marketing') {
      const reimburse = item.reimburse;
      let reimburse_status: 'unpaid' | 'paid' | 'not_applicable' =
        item.bearer.reimburse_status || (reimburse === 0 ? 'not_applicable' : venueReimburseStatus);

      if (reimburse === 0) {
        reimburse_status = 'not_applicable';
      }

      const profit_share = item.transport + item.final_share;
      const profit_share_status: 'unpaid' | 'paid' =
        item.bearer.profit_share_status === 'paid'
          ? 'paid'
          : (venueProfitShareStatus === 'paid' ? 'paid' : 'unpaid');

      const unpaid_reimburse = (reimburse_status === 'paid' || reimburse_status === 'not_applicable') ? 0 : reimburse;
      const unpaid_profit_share = profit_share_status === 'paid' ? 0 : profit_share;
      const total_unpaid = unpaid_reimburse + unpaid_profit_share;

      const paid_reimburse = reimburse_status === 'paid' ? reimburse : 0;
      const paid_profit_share = profit_share_status === 'paid' ? profit_share : 0;
      const total_paid = paid_reimburse + paid_profit_share;

      bearers_settlement.push({
        bearer: item.bearer,
        reimburse,
        reimburse_status,
        transport: item.transport,
        profit_share,
        profit_share_status,
        unpaid_reimburse,
        unpaid_profit_share,
        total_unpaid,
        paid_reimburse,
        paid_profit_share,
        total_paid,
      });
    }
  }

  const reimburse_marketing = dist.reimburse_marketing;
  const profit_share_marketing = dist.marketing_transport + dist.marketing_final_share;

  // Compute aggregate unpaid/paid
  let unpaid_reimburse_marketing = 0;
  let paid_reimburse_marketing = 0;
  let unpaid_profit_share_marketing = 0;
  let paid_profit_share_marketing = 0;

  if (bearers_settlement.length > 0) {
    unpaid_reimburse_marketing = bearers_settlement.reduce((sum, b) => sum + b.unpaid_reimburse, 0);
    paid_reimburse_marketing = bearers_settlement.reduce((sum, b) => sum + b.paid_reimburse, 0);

    const bearersProfitSum = bearers_settlement.reduce((sum, b) => sum + b.profit_share, 0);
    const unallocatedProfit = Math.max(0, profit_share_marketing - bearersProfitSum);

    unpaid_profit_share_marketing = bearers_settlement.reduce((sum, b) => sum + b.unpaid_profit_share, 0) +
      (venueProfitShareStatus === 'paid' ? 0 : unallocatedProfit);
    paid_profit_share_marketing = bearers_settlement.reduce((sum, b) => sum + b.paid_profit_share, 0) +
      (venueProfitShareStatus === 'paid' ? unallocatedProfit : 0);
  } else {
    // No marketing bearers (e.g. 100% platform modal), but marketing still receives transport
    unpaid_reimburse_marketing = 0;
    paid_reimburse_marketing = 0;
    unpaid_profit_share_marketing = venueProfitShareStatus === 'paid' ? 0 : profit_share_marketing;
    paid_profit_share_marketing = venueProfitShareStatus === 'paid' ? profit_share_marketing : 0;
  }

  const total_unpaid_marketing = unpaid_reimburse_marketing + unpaid_profit_share_marketing;
  const total_paid_marketing = paid_reimburse_marketing + paid_profit_share_marketing;

  // Aggregate statuses
  let aggregateReimburseStatus: 'unpaid' | 'paid' | 'not_applicable' = 'unpaid';
  if (reimburse_marketing === 0) {
    aggregateReimburseStatus = 'not_applicable';
  } else if (unpaid_reimburse_marketing === 0) {
    aggregateReimburseStatus = 'paid';
  }

  let aggregateProfitShareStatus: 'unpaid' | 'paid' = 'unpaid';
  if (unpaid_profit_share_marketing === 0) {
    aggregateProfitShareStatus = 'paid';
  }

  const remittance_due = dist.platform_remittance_due;
  const remittance_status = venue.remittance_status || (venueProfitShareStatus === 'paid' ? 'verified' : 'unpaid');
  const marketing_retained = dist.marketing_retained;

  return {
    reimburse_marketing,
    reimburse_status: aggregateReimburseStatus,
    profit_share_marketing,
    profit_share_status: aggregateProfitShareStatus,
    unpaid_reimburse_marketing,
    unpaid_profit_share_marketing,
    total_unpaid_marketing,
    paid_reimburse_marketing,
    paid_profit_share_marketing,
    total_paid_marketing,
    remittance_due,
    remittance_status,
    marketing_retained,
    bearers_settlement,
  };
}

export interface MonthlyProfitSharingParams {
  total_gross_revenue: number;
  total_hpp_cost: number;
  server_operating_cost?: number; // Biaya server/cloud bulanan (Supabase, Vercel, Domain, WA Gateway)
  developer_pool_fee_rate?: number; // Default 0.10 (10%)
}

export interface MonthlyProfitSharingResult {
  total_gross_revenue: number;
  total_hpp_cost: number;
  gross_profit: number; // total_gross_revenue - total_hpp_cost
  server_operating_cost: number;
  net_profit_before_server: number;
  net_profit_after_server: number; // Max(0, gross_profit - server_operating_cost)
  developer_fee_pool: number; // 10% dari net_profit_after_server
  distributable_profit: number; // Sisa laba bersih setelah dev pool
  vicky_equity_ratio: number; // 51% (Perjanjian Kemitraan Pasal 3)
  natan_equity_ratio: number; // 49% (Perjanjian Kemitraan Pasal 3)
  vicky_equity_dividend: number; // 51% dari distributable_profit
  natan_equity_dividend: number; // 49% dari distributable_profit
}

export function calculateMonthlyNetProfitWithServerCost(
  params: MonthlyProfitSharingParams
): MonthlyProfitSharingResult {
  const total_gross_revenue = Math.max(0, Number(params.total_gross_revenue) || 0);
  const total_hpp_cost = Math.max(0, Number(params.total_hpp_cost) || 0);
  const server_operating_cost = Math.max(0, Number(params.server_operating_cost) || 0);
  const gross_profit = Math.max(0, total_gross_revenue - total_hpp_cost);

  const net_profit_before_server = gross_profit;
  const net_profit_after_server = Math.max(0, gross_profit - server_operating_cost);

  const feeRate = params.developer_pool_fee_rate !== undefined ? params.developer_pool_fee_rate : 0.10;
  const developer_fee_pool = Math.round(net_profit_after_server * feeRate);
  const distributable_profit = Math.max(0, net_profit_after_server - developer_fee_pool);

  // Porsi Saham: Vicky 51%, Natan 49% sesuai Perjanjian Kemitraan Pasal 3
  const vicky_equity_ratio = 51;
  const natan_equity_ratio = 49;
  const vicky_equity_dividend = Math.round((distributable_profit * vicky_equity_ratio) / 100);
  const natan_equity_dividend = distributable_profit - vicky_equity_dividend;

  return {
    total_gross_revenue,
    total_hpp_cost,
    gross_profit,
    server_operating_cost,
    net_profit_before_server,
    net_profit_after_server,
    developer_fee_pool,
    distributable_profit,
    vicky_equity_ratio,
    natan_equity_ratio,
    vicky_equity_dividend,
    natan_equity_dividend,
  };
}

