/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
/**
 * @category enums
 * @category generated
 */
export enum UpdateConfigMode {
  UpdateLoanToValuePct,
  UpdateMaxLiquidationBonusBps,
  UpdateLiquidationThresholdPct,
  UpdateProtocolLiquidationFee,
  UpdateProtocolTakeRate,
  UpdateFeesBorrowFee,
  UpdateFeesFlashLoanFee,
  UpdateFeesReferralFeeBps,
  UpdateDepositLimit,
  UpdateBorrowLimit,
  UpdateTokenInfoLowerHeuristic,
  UpdateTokenInfoUpperHeuristic,
  UpdateTokenInfoExpHeuristic,
  UpdateTokenInfoTwapDivergence,
  UpdateTokenInfoScopeTwap,
  UpdateTokenInfoScopeChain,
  UpdateTokenInfoName,
  UpdateTokenInfoPriceMaxAge,
  UpdateTokenInfoTwapMaxAge,
  UpdateScopePriceFeed,
  UpdatePythPrice,
  UpdateSwitchboardFeed,
  UpdateSwitchboardTwapFeed,
  UpdateBorrowRateCurve,
  UpdateEntireReserveConfig,
  UpdateDebtWithdrawalCap,
  UpdateDepositWithdrawalCap,
  UpdateDebtWithdrawalCapCurrentTotal,
  UpdateDepositWithdrawalCapCurrentTotal,
  UpdateBadDebtLiquidationBonusBps,
  UpdateMinLiquidationBonusBps,
  DeleveragingMarginCallPeriod,
  UpdateBorrowFactor,
  UpdateAssetTier,
  UpdateElevationGroup,
  DeleveragingThresholdSlotsPerBps,
  UpdateMultiplierSideBoost,
  UpdateMultiplierTagBoost,
  UpdateReserveStatus,
}

/**
 * @category userTypes
 * @category generated
 */
export const updateConfigModeBeet = beet.fixedScalarEnum(
  UpdateConfigMode
) as beet.FixedSizeBeet<UpdateConfigMode, UpdateConfigMode>
