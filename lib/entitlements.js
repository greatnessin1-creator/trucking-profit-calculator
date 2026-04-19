export const PLANS = {
  trial: "trial",
  basic: "basic",
  pro: "pro",
  advanced: "advanced",
  fleet: "fleet",
};

export const ENTITLEMENTS = {
  trial: {
    canUseCalculator: true,
    canSaveScenarios: false,
    canUploadDocuments: false,
    canCompareScenarios: false,
    canUseAdvanced: false,
    canUseFleet: false,
  },

  basic: {
    canUseCalculator: true,
    canSaveScenarios: false,
    canUploadDocuments: false,
    canCompareScenarios: false,
    canUseAdvanced: false,
    canUseFleet: false,
  },

  pro: {
    canUseCalculator: true,
    canSaveScenarios: true,
    canUploadDocuments: true, // allow basic doc storage
    canCompareScenarios: true,
    canUseAdvanced: false,
    canUseFleet: false,
  },

  advanced: {
    canUseCalculator: true,
    canSaveScenarios: true,
    canUploadDocuments: true,
    canCompareScenarios: true,
    canUseAdvanced: true,
    canUseFleet: false,
  },

  fleet: {
    canUseCalculator: true,
    canSaveScenarios: true,
    canUploadDocuments: true,
    canCompareScenarios: true,
    canUseAdvanced: true,
    canUseFleet: true,
  },
};

export function getUserPlan(subscription) {
  if (!subscription) return "trial";

  const plan = subscription.plan_name;

  if (plan === "basic") return "basic";
  if (plan === "pro") return "pro";
  if (plan === "advanced") return "advanced";
  if (plan === "fleet") return "fleet";

  return "trial";
}
