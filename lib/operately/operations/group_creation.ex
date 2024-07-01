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
    company_permissions = Map.get(attrs, :company_permissions, Binding.no_access())

    Multi.new()
    |> Groups.insert_group(attrs)
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> insert_company_groups_bindings(company_permissions)
    |> insert_creator_group_binding(creator)
    |> insert_members_access_group()
    |> insert_managers_access_group(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end

  defp insert_company_groups_bindings(multi, company_permissions) do
    multi
    |> Multi.insert(:company_admins_group_binding, fn changes ->
      access_group = Access.get_group!(company_id: changes.group.company_id, tag: :full_access)

      Binding.changeset(%{
        group_id: access_group.id,
        context_id: changes.context.id,
        access_level: Binding.full_access(),
      })
    end)
    |> Multi.insert(:company_members_group, fn changes ->
      access_group = Access.get_group!(company_id: changes.group.company_id, tag: :standard)

      Binding.changeset(%{
        group_id: access_group.id,
        context_id: changes.context.id,
        access_level: company_permissions,
      })
    end)
  end

  defp insert_creator_group_binding(multi, creator) do
    multi
    |> Multi.insert(:creator_group_binding, fn changes ->
      access_group = Access.get_group!(person_id: creator.id)

      Binding.changeset(%{
        group_id: access_group.id,
        context_id: changes.context.id,
        access_level: Binding.full_access(),
      })
    end)
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
end
