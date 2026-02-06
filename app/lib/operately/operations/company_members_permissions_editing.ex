defmodule Operately.Operations.CompanyMembersPermissionsEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities

  def run(author, members) do
    Multi.new()
    |> Multi.run(:context, fn _, _ ->
      {:ok, Access.get_context!(company_id: author.company_id)}
    end)
    |> update_bindings(members)
    |> insert_activity(author)
    |> Repo.transaction()
  end

  defp update_bindings(multi, members) do
    members
    |> Enum.reduce(multi, fn (%{id: person_id, access_level: access_level}, multi) ->
      name = person_id <> "_updated_binding"

      Multi.run(multi, name, fn _, %{context: context} ->
        access_group = Access.get_group!(person_id: person_id)
        previous_access_level = get_previous_access_level(context.id, access_group.id)
        {:ok, binding} = Access.bind(context, access_group_id: access_group.id, level: access_level)

        {:ok,
         %{
           previous: %{access_level: previous_access_level},
           updated: binding
         }}
      end)
    end)
  end

  defp insert_activity(multi, author) do
    Activities.insert_sync(multi, author.id, :company_members_permissions_edited, fn changes ->
      %{
        company_id: author.company_id,
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

  defp get_previous_access_level(context_id, group_id) do
    case Access.get_binding(context_id: context_id, group_id: group_id) do
      nil -> Operately.Access.Binding.no_access()
      binding -> binding.access_level
    end
  end
end
