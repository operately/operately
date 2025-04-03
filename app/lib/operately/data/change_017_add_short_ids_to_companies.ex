defmodule Operately.Data.Change017AddShortIdsToCompanies do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.Companies.ShortId
   
  def run do
    Repo.transaction(fn ->
      companies = from(c in Company, where: is_nil(c.short_id)) |> Repo.all()
      
      Enum.each(companies, fn company ->
        case create_short_id(company) do
          {:error, _} -> raise "Failed to create short id"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_short_id(company) do
    company
    |> Company.changeset(%{short_id: ShortId.generate()})
    |> Repo.update()
  end
end
