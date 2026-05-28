defmodule Operately.Operations.CompanyMemberRestoring do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Billing.Usage
  alias Operately.People.Person
  alias Operately.Repo

  def run(author, company, person) do
    with :ok <- Usage.check_member_limit(company) do
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
end
