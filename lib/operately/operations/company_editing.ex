defmodule Operately.Operations.CompanyEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, attrs) do
    raise "Operation for CompanyEditing not implemented"

    Multi.new()
    |> Multi.insert(:something, ...)
    |> Activities.insert_sync(author.id, :company_editing, fn changes ->
      %{
        company_id: ...,,
      old_name: ...,,
      new_name: ...,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:something)
  end
end
