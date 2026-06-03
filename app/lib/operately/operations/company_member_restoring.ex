defmodule Operately.Operations.CompanyMemberRestoring do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Billing
  alias Operately.Billing.Usage
  alias Operately.People.Person
  alias Operately.Repo

  def run(author, company, person) do
    with :ok <- Usage.check_member_limit(company) do
      previous_member_count = Billing.active_member_count(company)

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
      |> case do
        {:ok, _restored_person} = result ->
          Billing.maybe_enqueue_limit_reached_email(company, :member_count, previous_member_count)
          result

        error ->
          error
      end
    end
  end
end
