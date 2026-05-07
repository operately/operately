import { askQuestion } from "../../core/prompts";
import type { Company } from "../types";

export function requireCompany(company: Company | undefined, failureMessage: string): Company {
  if (!company?.id) {
    throw new Error(failureMessage);
  }

  return company;
}

export async function resolveProfileName(
  profileFlag: string | null,
  askQuestionFn: typeof askQuestion,
): Promise<string> {
  const profile = profileFlag?.trim();

  if (profile) {
    return profile;
  }

  const answer = await askQuestionFn("Profile name (default: default):");
  return answer.trim() || "default";
}
