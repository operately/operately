import * as Api from "@/api";

export async function companyLoader({ params }) {
  const id = params.companyId;
  const company = await Api.getCompany({ id: id }).then((data) => data.company);

  return { company };
}
