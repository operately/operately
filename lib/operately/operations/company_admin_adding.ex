defmodule Operately.Operations.CompanyAdminAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Access, People, Activities}
  alias Operately.People.Person

  def run(%Person{company_role: :admin} = admin, person_id) do
    Multi.new()
    |> update_person(person_id)
    |> update_permissions()
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:updated_person)
  end

  defp update_person(multi, person_id) do
    multi
    |> Multi.run(:person, fn _, _ ->
      {:ok, People.get_person!(person_id)}
    end)
    |> Multi.update(:updated_person, fn %{person: person} ->
      Person.changeset(person, %{company_role: :admin})
    end)
  end

  defp update_permissions(multi) do
    multi
    |> Multi.run(:admins_group, fn _, %{person: person} ->
      {:ok, Access.get_group!(company_id: person.company_id, tag: :full_access)}
    end)
    |> Multi.run(:access_membership, fn _, changes ->
      maybe_create_membership(changes.admins_group.id, changes.person.id)
    end)
  end

  defp insert_activity(multi, admin) do
    multi
    |> Activities.insert_sync(admin.id, :company_admin_added, fn %{person: person} ->
      %{
        company_id: person.company_id,
        person_id: person.id,
      }
    end)
  end

  #
  # Helpers
  #

  defp maybe_create_membership(group_id, person_id) do
    case Access.get_group_membership(group_id: group_id, person_id: person_id) do
      nil ->
        Access.create_group_membership(%{group_id: group_id, person_id: person_id})
      membership ->
        {:ok, membership}
    end
  end
end
