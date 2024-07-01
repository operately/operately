defmodule Operately.Operations.GroupCreationTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.Binding

  @group_attrs %{
    name: "my group",
    mission: "my mission",
    icon: "IconBuildingEstate",
    color: "text-cyan-500",
    company_permissions: Binding.comment_access(),
  }

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})

    {:ok, creator: creator}
  end

  test "GroupCreation operation creates group", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    assert group == Groups.get_group_by_name("my group")
  end

  test "GroupCreation operation adds creator as member of group", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    members = Groups.list_members(group)

    assert 1 == length(members)
    assert ctx.creator == hd(members)
  end

  test "GroupCreation operation creates access context, groups and bindings", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    access_groups = Access.list_groups()
    context = Access.get_context!(group_id: group.id)

    assert nil != context
    assert 5 == length(access_groups) # 1 user's + 2 company's + 2 space's

    assert nil != Access.get_group(group_id: group.id, tag: :standard)
    assert nil != Access.get_group(group_id: group.id, tag: :full_access)

    company_members = Access.get_group(company_id: group.company_id, tag: :standard)
    company_admins = Access.get_group(company_id: group.company_id, tag: :full_access)

    assert nil != Access.get_binding(group_id: company_members.id, context_id: context.id, access_level: Binding.comment_access())
    assert nil != Access.get_binding(group_id: company_admins.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "GroupCreation operation creates full_access binding with creator", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    context = Access.get_context!(group_id: group.id)
    access_group = Access.get_group!(person_id: ctx.creator.id)

    assert nil != Access.get_binding(group_id: access_group.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "GroupCreation operation adds creator to managers group", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    managers = Access.get_group(group_id: group.id, tag: :full_access)

    assert nil != Access.get_group_membership!(group_id: managers.id, person_id: ctx.creator.id)
  end
end
