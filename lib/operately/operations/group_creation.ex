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
    anonymous_users = Map.get(attrs, :internet_permissions, nil)

    multi
    |> insert_company_admins_binding()
    |> insert_company_members_binding(company_members)
    |> insert_anonymous_users_binding(anonymous_users)
    |> insert_creator_group_binding(creator)
  end

  defp insert_company_admins_binding(multi) do
    multi
    |> Multi.insert(:company_admins_group_binding, fn changes ->
      access_group = Access.get_group!(company_id: changes.group.company_id, tag: :full_access)

      Binding.changeset(%{
        group_id: access_group.id,
        context_id: changes.context.id,
        access_level: Binding.full_access(),
      })
    end)
  end

  defp insert_company_members_binding(multi, company_members) do
    multi
    |> Multi.insert(:company_members_group_binding, fn changes ->
      access_group = Access.get_group!(company_id: changes.group.company_id, tag: :standard)

      Binding.changeset(%{
        group_id: access_group.id,
        context_id: changes.context.id,
        access_level: company_members,
      })
    end)
  end

  defp insert_anonymous_users_binding(multi, anonymous_users) do
    if anonymous_users == Binding.view_access() do
      multi
      |> Multi.insert(:anonymous_users_binding, fn changes ->
        access_group = Access.get_group!(company_id: changes.group.company_id, tag: :anonymous)

        Binding.changeset(%{
          group_id: access_group.id,
          context_id: changes.context.id,
          access_level: Binding.view_access(),
        })
      end)
    else
      multi
    end
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
end
