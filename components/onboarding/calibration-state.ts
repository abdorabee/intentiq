import {
  BUYER_ROLE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEAL_SIZE_OPTIONS,
  SALES_CYCLE_OPTIONS,
  SALES_MOTION_OPTIONS,
} from "@/lib/onboarding-profile";
import type { BusinessProfile } from "@/lib/types";

/**
 * Physical configuration of the calibration instrument, derived from the
 * onboarding draft. Purely presentational — never feeds back into the form.
 */
export interface CalibrationState {
  stage: number;
  coreInstalled: boolean;
  industryCount: number;
  sizeIndex: number;
  buyerIndex: number;
  motionIndex: number;
  dealIndex: number;
  cycleIndex: number;
  /** 0..1 fraction of the seven answers supplied. */
  completion: number;
  ready: boolean;
}

function optionIndex(options: readonly string[], value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return -1;
  const found = options.findIndex(
    (option) => option.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
  );
  // Custom answers still configure the instrument; park them on the last notch.
  return found >= 0 ? found : options.length - 1;
}

export function deriveCalibrationState(
  step: number,
  profile: BusinessProfile
): CalibrationState {
  const coreInstalled = profile.product_category.trim().length > 0;
  const industryCount = profile.target_industries.length;
  const sizeIndex = optionIndex(COMPANY_SIZE_OPTIONS, profile.company_size);
  const buyerIndex = optionIndex(BUYER_ROLE_OPTIONS, profile.buyer_role);
  const motionIndex = optionIndex(SALES_MOTION_OPTIONS, profile.sales_motion);
  const dealIndex = optionIndex(DEAL_SIZE_OPTIONS, profile.deal_size);
  const cycleIndex = optionIndex(SALES_CYCLE_OPTIONS, profile.sales_cycle);

  const answered =
    Number(coreInstalled) +
    Number(industryCount > 0) +
    Number(sizeIndex >= 0) +
    Number(buyerIndex >= 0) +
    Number(motionIndex >= 0) +
    Number(dealIndex >= 0) +
    Number(cycleIndex >= 0);

  return {
    stage: step,
    coreInstalled,
    industryCount,
    sizeIndex,
    buyerIndex,
    motionIndex,
    dealIndex,
    cycleIndex,
    completion: answered / 7,
    ready: answered === 7,
  };
}
