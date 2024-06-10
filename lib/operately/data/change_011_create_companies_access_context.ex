defmodule Operately.Data.Change012CreateCompaniesAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      companies = Repo.all(from c in Operately.Companies.Company, select: c.id)

      Enum.each(companies, fn company_id ->
        case create_company_access_contexts(company_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_company_access_contexts(company_id) do
    Access.create_context(%{company_id: company_id})
  end
end
