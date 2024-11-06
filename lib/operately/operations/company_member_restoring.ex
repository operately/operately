defmodule Operately.Operations.CompanyMemberRestoring do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.People.Person

  def run(author, person) do
    changeset = Person.changeset(person, %{
      suspended: false,
      suspended_at: nil
    })

    Multi.new()
    |> Multi.update(:person, changeset)
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
