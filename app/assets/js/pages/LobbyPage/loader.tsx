import * as Pages from "@/components/Pages";
import {
  companyPickerInputs,
  prefetchCompanyPicker,
  useCompanyPickerState,
} from "@/models/companies/companyPickerQueries";
import { Paths } from "@/routes/paths";
import { redirect } from "react-router";

export async function loader() {
  const inputs = companyPickerInputs();
  const companies = await prefetchCompanyPicker(inputs);
  const [company] = companies;

  if (companies.length === 1 && company) {
    return redirect(Paths.companyHomePath(company.id));
  }

  return inputs;
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function useLoadedData() {
  return useCompanyPickerState(Pages.useLoadedData<LoaderResult>());
}
