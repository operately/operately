defmodule Operately.Data.Change019CreateAccessGroupsForSpaces do
  alias Operately.Repo
  alias Operately.Companies
  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      companies = Companies.list_companies()

      Enum.each(companies, fn company ->
        spaces = Groups.list_groups_for_company(company.id)

        Enum.each(spaces, fn space ->
          context = Access.get_context!(group_id: space.id)

          create_access_bindings_to_member(space, context.id)
          create_access_bindings_to_company(company.id, context.id)

          create_access_group(space.id, :full_access)

          create_access_group(space.id, :standard)
          |> create_access_memberships(space)
        end)
      end)
    end)
  end

  defp create_access_group(space_id, tag) do
    case Access.get_group(group_id: space_id, tag: tag) do
      nil ->
        {:ok, group} = Access.create_group(%{
          group_id: space_id,
          tag: tag,
        })
        group
      group ->
        group
    end
  end

  defp create_access_memberships(access_group, space) do
    members = Groups.list_members(space)

    Enum.each(members, fn member ->
      create_access_membership(access_group.id, member.id)
    end)
  end

  defp create_access_membership(group_id, person_id) do
    case Access.get_group_membership(group_id: group_id, person_id: person_id) do
      nil ->
        Access.create_group_membership(%{
          group_id: group_id,
          person_id: person_id,
        })
      _ ->
        :ok
    end
  end

  defp create_access_bindings_to_member(space, context_id) do
    members = Groups.list_members(space)

    Enum.each(members, fn member ->
      Access.get_group!(person_id: member.id)
      |> create_access_binding(context_id, Binding.edit_access())
    end)
  end

  defp create_access_bindings_to_company(company_id, context_id) do
    Access.get_group!(company_id: company_id, tag: :standard)
    |> create_access_binding(context_id, Binding.edit_access())

    Access.get_group!(company_id: company_id, tag: :full_access)
    |> create_access_binding(context_id, Binding.full_access())
  end

  defp create_access_binding(group, context_id, access_level) do
    case Access.get_binding(group_id: group.id, context_id: context_id) do
      nil ->
        Access.create_binding(%{
          group_id: group.id,
          context_id: context_id,
          access_level: access_level,
        })
      binding ->
        Access.update_binding(binding, %{access_level: access_level})
    end
  end
end
