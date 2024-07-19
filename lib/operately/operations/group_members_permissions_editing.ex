defmodule Operately.Operations.GroupMembersPermissionsEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, space, members) do
    Multi.new()
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(group_id: space.id)}
    end)
    |> update_bindings(members)
    |> insert_activity(author, space)
    |> Repo.transaction()
  end

  defp update_bindings(multi, members) do
    members
    |> Enum.reduce(multi, fn (%{id: person_id, access_level: access_level}, multi) ->
      access_group = Access.get_group!(person_id: person_id)
      name = person_id <> "_updated_binding"

      Access.update_or_insert_binding(multi, name, access_group, access_level)
    end)
  end

  defp insert_activity(multi, author, space) do
    Activities.insert_sync(multi, author.id, :space_members_permissions_edited, fn changes ->
      %{
        company_id: space.company_id,
        space_id: space.id,
        members: serialize_updated_members(changes),
      }
    end)
  end

  defp serialize_updated_members(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.ends_with?(key, "_updated_binding") end)
    |> Enum.filter(fn {_, target} -> target.previous.access_level != target.updated.access_level end)
    |> Enum.map(fn {key, target} ->
      %{
        person_id: String.replace(key, "_updated_binding", ""),
        previous_access_level: target.previous.access_level,
        updated_access_level: target.updated.access_level,
      }
    end)
  end
end
