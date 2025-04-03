defmodule Operately.Data.Change011CreateCompaniesAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Companies.Company
  alias Operately.Access.Context

  def run do
    Repo.transaction(fn ->
      companies = Repo.all(from c in Company, select: c.id)

      Enum.each(companies, fn company_id ->
        case create_company_access_contexts(company_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_company_access_contexts(company_id) do
    existing_context = Repo.one(from c in Context, where: c.company_id == ^company_id, select: c.id)

    if existing_context do
      :ok
    else
      Access.create_context(%{company_id: company_id})
    end
  end
end
