defmodule Operately.Operations.CompanyMemberRemoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People

  def run(admin, person_id) do
    Multi.new()
    |> suspend_person(person_id)
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp suspend_person(multi, person_id) do
    changeset = People.get_person!(person_id)
    |> People.Person.changeset(%{suspended: true})

    Multi.update(multi, :person, changeset)
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_removed, fn changes ->
      %{
        company_id: admin.company_id,
        name: changes[:person].full_name,
        email: changes[:person].email,
        title: changes[:person].title,
      }
    end)
  end
end
