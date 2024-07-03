defmodule Operately.Data.Change019CreateAccessGroupsForSpacesTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Groups
  alias Operately.Groups.{Group, Member}

  setup do
    companies = Enum.map(1..3, fn _ ->
      company = company_fixture()

      Enum.each(1..3, fn _ ->
        group = create_group(company.id)
        person = person_fixture_with_account(%{company_id: company.id})

        Enum.each(1..3, fn _ ->
          create_member(group.id, person.id)
        end)
      end)

      company
    end)

    {:ok, companies: companies}
  end

  test "creates access group membership for existing people", ctx do
    Enum.each(ctx.companies, fn company ->
      spaces = Groups.list_groups_for_company(company.id)

      Enum.each(spaces, fn space ->
        context = Access.get_context!(group_id: space.id)
        standard = Access.get_group!(company_id: company.id, tag: :standard)
        full_access = Access.get_group!(company_id: company.id, tag: :full_access)

        refute Access.get_binding(group_id: standard.id, context_id: context.id)
        refute Access.get_binding(group_id: full_access.id, context_id: context.id)

        refute Access.get_group(group_id: space.id, tag: :standard)
        refute Access.get_group(group_id: space.id, tag: :full_access)
      end)
    end)

    Operately.Data.Change019CreateAccessGroupsForSpaces.run()

    Enum.each(ctx.companies, fn company ->
      spaces = Groups.list_groups_for_company(company.id)

      Enum.each(spaces, fn space ->
        context = Access.get_context!(group_id: space.id)
        standard = Access.get_group!(company_id: company.id, tag: :standard)
        full_access = Access.get_group!(company_id: company.id, tag: :full_access)

        assert Access.get_binding(group_id: standard.id, context_id: context.id)
        assert Access.get_binding(group_id: full_access.id, context_id: context.id)

        assert Access.get_group(group_id: space.id, tag: :full_access)

        standard = Access.get_group(group_id: space.id, tag: :standard)
        members = Groups.list_members(space)

        Enum.each(members, fn member ->
          assert Access.get_group_membership(group_id: standard.id, person_id: member.id)
        end)
      end)
    end)
  end

  def create_group(company_id) do
    {:ok, group} = Group.changeset(%{
      company_id: company_id,
      name: "some name",
      mission: "some mission",
      icon: "some icon",
      color: "come color",
    })
    |> Repo.insert()

    Access.create_context(%{group_id: group.id})

    group
  end

  def create_member(group_id, person_id) do
    Member.changeset(%Member{}, %{
      group_id: group_id,
      person_id: person_id
    })
    |> Repo.insert()
  end
end
