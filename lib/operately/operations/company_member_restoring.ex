defmodule Operately.Operations.CompanyMemberRestoring do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, _attrs) do
    raise "Operation for CompanyMemberRestoring not implemented"

    Multi.new()
    |> Multi.insert(:something, nil)
    |> Activities.insert_sync(author.id, :company_member_restoring, fn _changes ->
      %{
        company_id: "TODO",
        person_id: "TODO"
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:something)
  end
end
