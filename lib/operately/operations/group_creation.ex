defmodule Operately.Operations.GroupCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Groups.Member
  alias Operately.Access
  alias Operately.Access.{Group, Binding, GroupMembership}

  def run(creator, attrs) do
    attrs = Map.merge(attrs, %{
      company_id: creator.company_id,
    })

    Multi.new()
    |> Groups.insert_group(attrs)
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> insert_bindings(creator, attrs)
    |> insert_members_access_group()
    |> insert_managers_access_group(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  defp insert_members_access_group(multi) do
    multi
    |> Multi.insert(:members_access_group, fn changes ->
      Group.changeset(%{
        group_id: changes.group.id,
        tag: :standard,
      })
    end)
  end

  defp insert_managers_access_group(multi, creator) do
    multi
    |> Multi.insert(:managers_access_group, fn changes ->
      Group.changeset(%{
        group_id: changes.group.id,
        tag: :full_access,
      })
    end)
    |> Multi.insert(:creator_in_managers, fn changes ->
      GroupMembership.changeset(%{
        group_id: changes.managers_access_group.id,
        person_id: creator.id,
      })
    end)
  end

  defp insert_bindings(multi, creator, attrs) do
    company_members = Map.get(attrs, :company_permissions, Binding.no_access())
    anonymous_users = Map.get(attrs, :public_permissions, nil)

    creator_group = Access.get_group!(person_id: creator.id)

    multi
    |> Access.insert_bindings_to_company(attrs.company_id, company_members, anonymous_users)
    |> Access.insert_binding(:creator_group_binding, creator_group, Binding.full_access())
  end
end
