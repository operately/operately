import { askChoice } from "../../core/prompts";
import type { Company } from "../types";

export async function selectCompany(companies: Company[]): Promise<Company> {
  if (companies.length === 1) {
    console.log(`Using company: ${companies[0].name ?? companies[0].id}`);
    return companies[0];
  }

  return await askChoice<Company>(
    "Select a company:",
    companies.map((c) => ({ label: c.name ?? c.id, value: c })),
  );
}
