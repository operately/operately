defmodule Operately.Operations.CompanyMemberConvertingToGuest do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.{Access, Repo}
  alias Operately.Access.Binding
  alias Operately.People.Person

  def run(admin, person = %Person{}) do
    with :ok <- validate_person(admin, person) do
      Multi.new()
      |> Multi.update(:person, Person.changeset(person, %{type: :guest}))
      |> Multi.run(:person_access_group, fn _, _ ->
        {:ok, Access.get_group!(person_id: person.id)}
      end)
      |> Multi.delete_all(:deleted_access_group_memberships, from(m in Access.GroupMembership, where: m.person_id == ^person.id))
      |> Multi.delete(:deleted_person_access_group, fn %{person_access_group: group} -> group end)
      |> Multi.insert(:new_person_access_group, Access.Group.changeset(%{person_id: person.id}))
      |> Multi.insert(:new_person_access_membership, fn %{new_person_access_group: group} ->
        Access.GroupMembership.changeset(%{
          group_id: group.id,
          person_id: person.id,
        })
      end)
      |> Multi.insert(:new_company_access_binding, fn %{new_person_access_group: group} ->
        context = Access.get_context!(company_id: person.company_id)

        Binding.changeset(%{
          group_id: group.id,
          context_id: context.id,
          access_level: Binding.minimal_access(),
        })
      end)
      |> insert_activity(admin, person)
      |> Repo.transaction()
      |> Repo.extract_result(:person)
    end
  end

  defp validate_person(admin, person) do
    cond do
      person.company_id != admin.company_id -> {:error, :invalid_company}
      person.id == admin.id -> {:error, :cannot_convert_self}
      person.suspended -> {:error, :person_suspended}
      true -> :ok
    end
  end

  defp insert_activity(multi, admin, person) do
    Operately.Activities.insert_sync(multi, admin.id, :company_member_converted_to_guest, fn _changes ->
      %{
        company_id: person.company_id,
        person_id: person.id,
      }
    end)
  end
end
