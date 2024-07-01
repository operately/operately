defmodule Operately.Data.Change017CreateAccessGroupForAnonymousUsers do
  alias Operately.Repo
  alias Operately.Companies
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      companies = Companies.list_companies()

      Enum.each(companies, fn company ->
        case create_groups(company.id) do
          {:error, _} -> raise "Failed to create access groups"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_groups(company_id) do
    case Access.get_group(company_id: company_id, tag: :anonymous) do
      nil ->
        Access.create_group(%{
          company_id: company_id,
          tag: :anonymous,
        })
      _ ->
        :ok
    end
  end
end
