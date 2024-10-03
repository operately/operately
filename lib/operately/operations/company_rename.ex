defmodule Operately.Operations.CompanyRename do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Companies.Company
  alias Operately.Activities
  alias Operately.Accounts.Person

  defstruct [
    :company_id,
    :new_name,
    :renamer_id
  ]

  def run(%__MODULE__{} = params) do
    company = Repo.get!(Company, params.company_id)
    renamer = Repo.get!(Person, params.renamer_id)

    Multi.new()
    |> update_company(company, params.new_name)
    |> insert_activity(renamer, company, params.new_name)
    |> Repo.transaction()
    |> case do
         {:ok, %{company: updated_company}} -> {:ok, updated_company}
         {:error, _failed_operation, changeset, _changes} -> {:error, changeset}
       end
  end

  defp update_company(multi, company, new_name) do
    Multi.update(multi, :company, Company.rename_changeset(company, %{name: new_name}))
  end

  defp insert_activity(multi, renamer, company, new_name) do
    Activities.insert_sync(multi, renamer.id, :company_renamed, fn %{company: updated_company} ->
      %{
        company_id: updated_company.id,
        old_name: company.name,
        new_name: new_name,
        renamer_id: renamer.id
      }
    end)
  end
end