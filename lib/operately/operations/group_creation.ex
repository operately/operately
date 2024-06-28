defmodule Operately.Operations.GroupCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Groups.Member

  def run(creator, attrs) do
    attrs = Map.merge(attrs, %{
      company_id: creator.company_id,
    })

    Multi.new()
    |> Groups.insert_group(attrs)
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> insert_members_access_group()
    |> insert_managers_access_group(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  defp insert_members_access_group(multi) do
    multi
    |> Multi.insert(:members_access_group, fn changes ->
      Operately.Access.Group.changeset(%{group_id: changes.group.id})
    end)
    |> Multi.insert(:members_access_binding, fn changes ->
      Operately.Access.Binding.changeset(%{
        group_id: changes.members_access_group.id,
        context_id: changes.context.id,
        access_level: 40,
      })
    end)
  end

  defp insert_managers_access_group(multi, creator) do
    multi
    |> Multi.insert(:managers_access_group, fn changes ->
      Operately.Access.Group.changeset(%{group_id: changes.group.id})
    end)
    |> Multi.insert(:managers_access_binding, fn changes ->
      Operately.Access.Binding.changeset(%{
        group_id: changes.managers_access_group.id,
        context_id: changes.context.id,
        access_level: 100,
      })
    end)
    |> Multi.insert(:creator_in_managers, fn changes ->
      Operately.Access.GroupMembership.changeset(%{
        group_id: changes.managers_access_group.id,
        person_id: creator.id,
      })
    end)
  end
end
