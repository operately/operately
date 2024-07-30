defmodule Operately.Operations.GroupMembersAdding do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}
  alias Operately.Activities

  def run(author, group_id, members) do
    Multi.new()
    |> insert_members(group_id, members)
    |> insert_access_group_memberships(group_id, members)
    |> Multi.run(:context, fn _, _ -> {:ok, Access.get_context!(group_id: group_id)} end)
    |> insert_access_bindings(members)
    |> insert_activities(author, group_id)
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

  defp insert_activities(multi, author, group_id) do
    Activities.insert_sync(multi, author.id, :space_members_added, fn changes ->
      %{
        company_id: author.company_id,
        space_id: group_id,
        members: serialize_created_members(changes),
      }
    end)
  end

  #
  # Helpers
  #

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

  defp serialize_created_members(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.ends_with?(key, "_membership") end)
    |> Enum.map(fn {key, target} ->
      %{
        person_id: target.person_id,
        access_level: find_access_level(key, changes)
      }
    end)
    |> fetch_members_name()
  end

  defp find_access_level(membership_key, changes) do
    key = String.replace(membership_key, "_membership", "_binding")
    changes[key].access_level
  end

  defp fetch_members_name(people) do
    ids = Enum.map(people, &(&1.person_id))

    name_tuples =
      from(p in Operately.People.Person, where: p.id in ^ids, select: %{id: p.id, full_name: p.full_name})
      |> Repo.all()
      |> Map.new(fn %{id: id, full_name: full_name} -> {id, full_name} end)

    Enum.map(people, fn person ->
      Map.put(person, :person_name, Map.get(name_tuples, person.person_id))
    end)
  end
end
