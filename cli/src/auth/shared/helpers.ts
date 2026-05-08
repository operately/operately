import { askQuestion } from "../../core/prompts";
import { DEFAULT_PROFILE, type CliConfig } from "../config";
import type { Company } from "../types";

export function requireCompany(company: Company | undefined, failureMessage: string): Company {
  if (!company?.id) {
    throw new Error(failureMessage);
  }

  return company;
}

export async function resolveProfileName(
  config: CliConfig,
  profileFlag: string | null,
  askQuestionFn: typeof askQuestion,
): Promise<string> {
  const profile = profileFlag?.trim();

  if (profile) {
    return profile;
  }

  const defaultProfile = config.activeProfile?.trim() || DEFAULT_PROFILE;
  const answer = await askQuestionFn(`Profile name (default: ${defaultProfile}):`);
  return answer.trim() || defaultProfile;
}

export function getOrderedProfileNames(config: CliConfig): string[] {
  const activeProfile = config.activeProfile?.trim() || DEFAULT_PROFILE;

  return Object.keys(config.profiles).sort((left, right) => {
    if (left === activeProfile) return -1;
    if (right === activeProfile) return 1;
    return left.localeCompare(right);
  });
}
