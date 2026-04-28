import type { askChoice as askChoiceFn } from "../../core/prompts";
import type { Company } from "../types";

type AskChoice = typeof askChoiceFn;

export async function selectCompany(companies: Company[], askChoice: AskChoice): Promise<Company> {
  if (companies.length === 1) {
    console.log(`Using company: ${companies[0].name ?? companies[0].id}`);
    return companies[0];
  }

  return await askChoice<Company>(
    "Select a company:",
    companies.map((c) => ({ label: c.name ?? c.id, value: c })),
  );
}
