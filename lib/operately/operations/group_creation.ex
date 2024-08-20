defmodule Operately.Operations.GroupCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Groups
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}

  def run(creator, attrs) do
    attrs = Map.merge(attrs, %{
      company_id: creator.company_id,
    })

    Multi.new()
    |> Groups.insert_group(attrs)
    |> insert_creator(creator)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  defp insert_creator(multi, creator) do
    creator_group = Access.get_group!(person_id: creator.id)

    multi
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> Multi.insert(:creator_in_managers, fn changes ->
      GroupMembership.changeset(%{
        group_id: changes.space_managers_access_group.id,
        person_id: creator.id,
      })
    end)
    |> Access.insert_binding(:creator_group_binding, creator_group, Binding.full_access())
  end

  defp insert_activity(multi, creator) do
    Activities.insert_sync(multi, creator.id, :space_added, fn %{group: group} ->
      %{
        company_id: group.company_id,
        space_id: group.id,
        name: group.name,
      }
    end)
  end
end
