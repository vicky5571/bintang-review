export type HppPayerType = 'marketing' | 'platform' | 'split';

export interface ProfitDistributionParams {
  deal_amount: number;
  hpp: number;
  hpp_payer?: HppPayerType;
  hpp_marketing_ratio?: number; // 0 to 100 (percentage borne by marketing)
  transport_fee?: number; // Default flat Rp 20.000
}

export interface ProfitDistributionResult {
  deal_amount: number;
  hpp: number;
  hpp_payer: HppPayerType;
  hpp_marketing_ratio: number;
  hpp_platform_ratio: number;

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
  marketing_net_income: number; // marketing_total_payout - (hpp * marketing_ratio / 100)
  platform_net_income: number; // platform_total_payout - (hpp * platform_ratio / 100)
}

export function calculateProfitDistribution(params: ProfitDistributionParams): ProfitDistributionResult {
  const deal_amount = Math.max(0, Number(params.deal_amount) || 0);
  const hpp = Math.max(0, Number(params.hpp) || 0);
  const defaultTransport = params.transport_fee !== undefined ? Number(params.transport_fee) : 20000;

  // Determine ratio
  let hpp_payer: HppPayerType = params.hpp_payer || 'marketing';
  let hpp_marketing_ratio = 100;

  if (params.hpp_marketing_ratio !== undefined) {
    hpp_marketing_ratio = Math.min(100, Math.max(0, Number(params.hpp_marketing_ratio)));
    if (hpp_marketing_ratio === 100) hpp_payer = 'marketing';
    else if (hpp_marketing_ratio === 0) hpp_payer = 'platform';
    else hpp_payer = 'split';
  } else {
    if (hpp_payer === 'platform') hpp_marketing_ratio = 0;
    else if (hpp_payer === 'split') hpp_marketing_ratio = 50;
    else hpp_marketing_ratio = 100;
  }

  const hpp_platform_ratio = 100 - hpp_marketing_ratio;

  // Step 1: Reimburse HPP
  const reimburse_marketing = Math.round((hpp * hpp_marketing_ratio) / 100);
  const reimburse_platform = hpp - reimburse_marketing;

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
  const marketing_final_share = Math.round((net_split_profit * hpp_marketing_ratio) / 100);
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
