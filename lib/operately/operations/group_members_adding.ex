defmodule Operately.Operations.GroupMembersAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}

  def run(group_id, members) do
    Multi.new()
    |> insert_members(group_id, members)
    |> insert_access_group_memberships(group_id, members)
    |> Multi.run(:context, fn _, _ -> {:ok, Access.get_context!(group_id: group_id)} end)
    |> insert_access_bindings(members)
    |> Repo.transaction()
  end

  defp insert_members(multi, group_id, members) do
    members
    |> Enum.map(fn %{id: id} ->
      Member.changeset(%Member{}, %{
        group_id: group_id,
        person_id: id
      })
    end)
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({changeset, index}, multi) ->
      Multi.insert(multi, Integer.to_string(index), changeset)
    end)
  end

  defp insert_access_group_memberships(multi, group_id, members) do
    members
    |> Enum.map(fn %{id: person_id, permissions: access_level} ->
      access_group = fetch_access_group(group_id, access_level)

      GroupMembership.changeset(%{
        group_id: access_group.id,
        person_id: person_id,
      })
    end)
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({changeset, index}, multi) ->
      name = Integer.to_string(index) <> "_membership"

      Multi.insert(multi, name, changeset)
    end)
  end

  defp insert_access_bindings(multi, members) do
    members
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({%{id: person_id, permissions: access_level}, index}, multi) ->
      access_group = Access.get_group!(person_id: person_id)
      name = Integer.to_string(index) <> "_binding"

      Access.insert_binding(multi, name, access_group, access_level)
    end)
  end

  defp fetch_access_group(group_id, access_level) do
    cond do
      access_level == Binding.full_access() ->
        Access.get_group!(group_id: group_id, tag: :full_access)
      access_level in Binding.valid_access_levels() ->
        Access.get_group!(group_id: group_id, tag: :standard)
      true ->
        :error
    end
  end
end
