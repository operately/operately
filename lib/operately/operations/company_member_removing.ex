defmodule Operately.Operations.CompanyMemberRemoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People

  def run(person_id) do
    Multi.new()
    |> suspend_person(person_id)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp suspend_person(multi, person_id) do
    changeset = People.get_person!(person_id)
    |> People.Person.changeset(%{suspended: true})

    Multi.update(multi, :person, changeset)
  end
end
