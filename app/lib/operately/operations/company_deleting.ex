defmodule Operately.Operations.CompanyDeleting do
  alias Operately.Repo

  def run(company_id) do
    case Operately.Companies.get_company!(company_id) do
      nil -> {:error, :not_found}
      company -> delete_company(company)
    end
  end

  defp delete_company(company) do
    Repo.delete(company)
  end
end
