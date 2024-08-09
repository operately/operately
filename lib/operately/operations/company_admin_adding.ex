defmodule Operately.Operations.CompanyAdminAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Access, People, Activities}
  alias Operately.People.Person

  def run(%Person{company_role: :admin} = admin, ids) do
    Multi.new()
    |> update_people(ids)
    |> Multi.run(:admins_group, fn _, _ ->
      {:ok, Access.get_group!(company_id: admin.company_id, tag: :full_access)}
    end)
    |> update_permissions(ids)
    |> insert_activity(admin)
    |> Repo.transaction()
  end

  defp update_people(multi, ids) do
    ids
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({id, index}, multi) ->
      multi
      |> Multi.run("person_#{index}", fn _, _ ->
        {:ok, People.get_person!(id)}
      end)
      |> Multi.update("updated_person_#{index}", fn changes ->
        Person.changeset(changes["person_#{index}"], %{company_role: :admin})
      end)
    end)
  end

  defp update_permissions(multi, ids) do
    ids
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({_, index}, multi) ->
      multi
      |> Multi.run("membership_#{index}", fn _, changes ->
        maybe_create_membership(changes.admins_group.id, changes["person_#{index}"].id)
      end)
    end)
  end

  defp insert_activity(multi, admin) do
    multi
    |> Activities.insert_sync(admin.id, :company_admin_added, fn changes ->
      %{
        company_id: admin.company_id,
        people: serialize_people(changes),
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

  defp serialize_people(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.starts_with?(key, "person_") end)
    |> Enum.map(fn {_, person} -> %{
      id: person.id,
      email: person.email,
      full_name: person.full_name,
    } end)
  end
end
