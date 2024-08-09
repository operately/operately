defmodule Operately.Operations.CompanyAdminRemoving do
  alias Ecto.Multi
  alias Operately.{Repo, Access, Activities, People}
  alias Operately.People.Person

  def run(%Person{company_role: :admin} = admin, person_id) do
    Multi.new()
    |> update_person(person_id)
    |> remove_admin_permissions(admin)
    |> insert_member_permissions(admin)
    |> insert_activity(admin)
    |> Repo.transaction()
  end

  defp update_person(multi, person_id) do
    multi
    |> Multi.run(:person, fn _, _ ->
      {:ok, People.get_person!(person_id)}
    end)
    |> Multi.update(:updated_person, fn %{person: person} ->
      Person.changeset(person, %{company_role: :member})
    end)
  end

  defp remove_admin_permissions(multi, admin) do
    multi
    |> Multi.run(:admins_group, fn _, _ ->
      {:ok, Access.get_group!(company_id: admin.company_id, tag: :full_access)}
    end)
    |> Multi.run(:admins_membership, fn _, changes ->
      maybe_delete_membership(changes.admins_group.id, changes.person.id)
    end)
  end

  defp insert_member_permissions(multi, admin) do
    multi
    |> Multi.run(:members_group, fn _, _ ->
      {:ok, Access.get_group!(company_id: admin.company_id, tag: :standard)}
    end)
    |> Multi.run(:members_membership, fn _, changes ->
      maybe_create_membership(changes.members_group.id, changes.person.id)
    end)
  end

  defp insert_activity(multi, admin) do
    multi
    |> Activities.insert_sync(admin.id, :company_admin_removed, fn %{person: person} ->
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

  defp maybe_delete_membership(group_id, person_id) do
    case Access.get_group_membership(group_id: group_id, person_id: person_id) do
      nil ->
        {:ok, nil}
      membership ->
        Access.delete_group_membership(membership)
    end
  end
end
