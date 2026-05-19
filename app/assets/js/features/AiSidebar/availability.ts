import * as Companies from "@/models/companies";

export const AI_NOT_CONFIGURED_MESSAGE =
  "Ask Alfred isn't available because the AI integration hasn't been configured.";

type Availability = {
  displayed: boolean;
  enabled: boolean;
  disabledMessage?: string;
};

export function getAiAvailability(company: Companies.Company | null, aiConfigured: boolean): Availability {
  if (!aiConfigured) {
    return { displayed: true, enabled: false, disabledMessage: AI_NOT_CONFIGURED_MESSAGE };
  }

  if (!company) {
    return { displayed: false, enabled: false };
  }

  if (!Companies.hasFeature(company, "ai")) {
    return { displayed: false, enabled: false };
  }

  return { displayed: true, enabled: true };
}
