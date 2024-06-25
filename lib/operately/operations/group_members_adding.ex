defmodule Operately.Operations.GroupMembersAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}

  def run(group_id, people_ids) do
    Multi.new()
    |> insert_members(people_ids, group_id)
    |> insert_access_group_memberships(people_ids, group_id)
    |> Repo.transaction()
  end

  defp insert_members(multi, people_ids, group_id) do
    people_ids
    |> Enum.map(fn {id, _} ->
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

  defp insert_access_group_memberships(multi, people_ids, group_id) do
    people_ids
    |> Enum.map(fn {person_id, access_level} ->
      access_group = fetch_access_group(access_level, group_id)

      GroupMembership.changeset(%{
        group_id: access_group.id,
        person_id: person_id,
      })
    end)
    |> Enum.with_index()
    |> Enum.reduce(multi, fn ({changeset, index}, multi) ->
      name = Integer.to_string(index) <> "-membership"

      Multi.insert(multi, name, changeset)
    end)
  end

  defp fetch_access_group(access_level, group_id) do
    cond do
      access_level == Binding.full_access() ->
        Access.get_group!(group_id: group_id, tag: :full_access)
      access_level == Binding.comment_access() ->
        Access.get_group!(group_id: group_id, tag: :standard)
    end
  end
end
