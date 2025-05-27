defmodule Operately.Operations.CompanyDeleting do
  alias Operately.Repo
  alias Operately.Companies.Company

  def run(company_id) do
    case Operately.Repo.get(Company, company_id) do
      nil -> {:error, :not_found}
      company -> Repo.delete(company)
    end
  end
end
