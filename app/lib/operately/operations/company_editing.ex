defmodule Operately.Operations.CompanyEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Companies.Company

  def run(author, company, name) do
    Multi.new()
    |> Multi.update(:company, Company.changeset(company, %{name: name}))
    |> Activities.insert_sync(author.id, :company_editing, fn changes ->
      %{
        company_id: changes.company.id,
        old_name: company.name,
        new_name: changes.company.name
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:company)
  end
end
