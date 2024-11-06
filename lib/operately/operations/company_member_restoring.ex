defmodule Operately.Operations.CompanyMemberRestoring do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, person) do
    Multi.new()
    |> Multi.update(:person, person, %{
      suspended: false,
      suspended_at: nil
    })
    |> Activities.insert_sync(author.id, :company_member_restoring, fn _changes ->
      %{
        company_id: person.company_id,
        person_id: person.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end
end
