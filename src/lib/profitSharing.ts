export type HppPayerType = 'marketing' | 'platform' | 'split';

export interface ProfitDistributionParams {
  deal_amount: number;
  hpp: number;
  hpp_payer?: HppPayerType;
  hpp_marketing_ratio?: number; // 0 to 100 (percentage borne by marketing)
  hpp_marketing_amount?: number; // Exact Rupiah nominal borne by marketing
  transport_fee?: number; // Default flat Rp 20.000
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

  // Step 3: Distribusi Sisa Profit
  platform_fee_10: number; // 10% dari gross_profit
  marketing_transport: number; // Flat (default 20.000)
  net_split_profit: number; // gross_profit - platform_fee_10 - marketing_transport

  // Pembagian Sisa Profit sesuai porsi penanggung HPP
  marketing_final_share: number;
  platform_final_share: number;

  // Total Nominal Diterima Masing-Masing Pihak
  marketing_total_payout: number; // reimburse_marketing + marketing_transport + marketing_final_share
  platform_total_payout: number; // reimburse_platform + platform_fee_10 + platform_final_share

  // Laba Bersih Murni (Net profit di atas modal HPP yang dikeluarkan)
  marketing_net_income: number; // marketing_total_payout - reimburse_marketing
  platform_net_income: number; // platform_total_payout - reimburse_platform
}

export function calculateProfitDistribution(params: ProfitDistributionParams): ProfitDistributionResult {
  const deal_amount = Math.max(0, Number(params.deal_amount) || 0);
  const hpp = Math.max(0, Number(params.hpp) || 0);
  const defaultTransport = params.transport_fee !== undefined ? Number(params.transport_fee) : 20000;

  // Determine ratio and exact reimbursement amounts
  let hpp_payer: HppPayerType = params.hpp_payer || 'marketing';
  let hpp_marketing_ratio = 100;
  let reimburse_marketing = hpp;
  let reimburse_platform = 0;

  if (params.hpp_marketing_amount !== undefined && params.hpp_marketing_amount !== null && !isNaN(Number(params.hpp_marketing_amount))) {
    // 1. Exact Rupiah nominal is explicitly provided
    const rawMarketingAmount = Math.max(0, Number(params.hpp_marketing_amount) || 0);
    // Clamp to [0, hpp]
    reimburse_marketing = Math.min(hpp, rawMarketingAmount);
    reimburse_platform = hpp - reimburse_marketing;

    if (hpp > 0) {
      hpp_marketing_ratio = (reimburse_marketing / hpp) * 100;
    } else {
      hpp_marketing_ratio = params.hpp_marketing_ratio !== undefined ? Number(params.hpp_marketing_ratio) : 100;
    }

    if (reimburse_marketing === hpp) hpp_payer = 'marketing';
    else if (reimburse_marketing === 0) hpp_payer = 'platform';
    else hpp_payer = 'split';
  } else if (params.hpp_marketing_ratio !== undefined && params.hpp_marketing_ratio !== null && !isNaN(Number(params.hpp_marketing_ratio))) {
    // 2. Percentage ratio is provided
    hpp_marketing_ratio = Math.min(100, Math.max(0, Number(params.hpp_marketing_ratio)));
    if (hpp_marketing_ratio === 100) hpp_payer = 'marketing';
    else if (hpp_marketing_ratio === 0) hpp_payer = 'platform';
    else hpp_payer = 'split';

    reimburse_marketing = Math.round((hpp * hpp_marketing_ratio) / 100);
    reimburse_platform = hpp - reimburse_marketing;
  } else {
    // 3. Fallback based on hpp_payer preset
    if (hpp_payer === 'platform') {
      hpp_marketing_ratio = 0;
      reimburse_marketing = 0;
      reimburse_platform = hpp;
    } else if (hpp_payer === 'split') {
      hpp_marketing_ratio = 50;
      reimburse_marketing = Math.round(hpp * 0.5);
      reimburse_platform = hpp - reimburse_marketing;
    } else {
      hpp_marketing_ratio = 100;
      reimburse_marketing = hpp;
      reimburse_platform = 0;
    }
  }

  const hpp_platform_ratio = 100 - hpp_marketing_ratio;
  const hpp_marketing_amount = reimburse_marketing;
  const hpp_platform_amount = reimburse_platform;

  // Step 2: Sisa Profit Kotor
  const gross_profit = Math.max(0, deal_amount - hpp);

  // Step 3: Distribusi Sisa Profit
  // 10% ke platform
  const platform_fee_10 = Math.round(gross_profit * 0.10);

  // Flat uang transport ke marketing specialist (maksimal sisa yang tersedia)
  const remainingAfterFee = Math.max(0, gross_profit - platform_fee_10);
  const marketing_transport = Math.min(defaultTransport, remainingAfterFee);

  // Sisa profit akhir
  const net_split_profit = Math.max(0, remainingAfterFee - marketing_transport);

  // Bagi sisa profit sesuai persentase penanggung HPP
  // Gunakan pecahan rasio presisi (reimburse_marketing / hpp) jika hpp > 0 untuk menghindari error pembulatan persentase
  const ratioFraction = hpp > 0 ? (reimburse_marketing / hpp) : (hpp_marketing_ratio / 100);
  const marketing_final_share = Math.round(net_split_profit * ratioFraction);
  const platform_final_share = net_split_profit - marketing_final_share;

  // Total Payout
  const marketing_total_payout = reimburse_marketing + marketing_transport + marketing_final_share;
  const platform_total_payout = reimburse_platform + platform_fee_10 + platform_final_share;

  // Net Income (Laba bersih murni di atas modal HPP yang keluar)
  const marketing_net_income = marketing_total_payout - reimburse_marketing;
  const platform_net_income = platform_total_payout - reimburse_platform;

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
    marketing_transport,
    net_split_profit,
    marketing_final_share,
    platform_final_share,
    marketing_total_payout,
    platform_total_payout,
    marketing_net_income,
    platform_net_income,
  };
}

export interface VenueSettlementSummary {
  reimburse_marketing: number;
  reimburse_status: 'unpaid' | 'paid' | 'not_applicable';
  profit_share_marketing: number; // marketing_transport + marketing_final_share
  profit_share_status: 'unpaid' | 'paid';

  // Outstanding (unpaid) amounts owed to marketing specialist
  unpaid_reimburse_marketing: number;
  unpaid_profit_share_marketing: number;
  total_unpaid_marketing: number;

  // Paid (disbursed) amounts
  paid_reimburse_marketing: number;
  paid_profit_share_marketing: number;
  total_paid_marketing: number;
}

export function calculateVenueSettlement(venue: {
  deal_amount: number;
  hpp: number;
  hpp_payer?: HppPayerType;
  hpp_marketing_ratio?: number;
  hpp_marketing_amount?: number;
  transport_fee?: number;
  hpp_reimburse_status?: 'unpaid' | 'paid' | 'not_applicable';
  profit_share_status?: 'unpaid' | 'paid' | 'not_applicable';
}): VenueSettlementSummary {
  const dist = calculateProfitDistribution({
    deal_amount: venue.deal_amount,
    hpp: venue.hpp,
    hpp_payer: venue.hpp_payer,
    hpp_marketing_ratio: venue.hpp_marketing_ratio,
    hpp_marketing_amount: venue.hpp_marketing_amount,
    transport_fee: venue.transport_fee,
  });

  const reimburse_marketing = dist.reimburse_marketing;
  const profit_share_marketing = dist.marketing_transport + dist.marketing_final_share;

  // Determine reimburse status
  let reimburse_status: 'unpaid' | 'paid' | 'not_applicable' = venue.hpp_reimburse_status || 'unpaid';
  if (reimburse_marketing === 0) {
    reimburse_status = 'not_applicable';
  }

  const profit_share_status: 'unpaid' | 'paid' = venue.profit_share_status === 'paid' ? 'paid' : 'unpaid';

  const isReimbursePaid = reimburse_status === 'paid' || reimburse_status === 'not_applicable';
  const isProfitSharePaid = profit_share_status === 'paid';

  const unpaid_reimburse_marketing = isReimbursePaid ? 0 : reimburse_marketing;
  const unpaid_profit_share_marketing = isProfitSharePaid ? 0 : profit_share_marketing;
  const total_unpaid_marketing = unpaid_reimburse_marketing + unpaid_profit_share_marketing;

  const paid_reimburse_marketing = reimburse_status === 'paid' ? reimburse_marketing : 0;
  const paid_profit_share_marketing = isProfitSharePaid ? profit_share_marketing : 0;
  const total_paid_marketing = paid_reimburse_marketing + paid_profit_share_marketing;

  return {
    reimburse_marketing,
    reimburse_status,
    profit_share_marketing,
    profit_share_status,
    unpaid_reimburse_marketing,
    unpaid_profit_share_marketing,
    total_unpaid_marketing,
    paid_reimburse_marketing,
    paid_profit_share_marketing,
    total_paid_marketing,
  };
}
