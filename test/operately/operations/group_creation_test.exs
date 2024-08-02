defmodule Operately.Operations.GroupCreationTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

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

    {:ok, company: company, creator: creator}
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

    assert context
    assert length(access_groups) == 7 # 2 company's + 2 space's + 2 user's + 1 anonymous

    assert Access.get_group(group_id: group.id, tag: :standard)
    assert Access.get_group(group_id: group.id, tag: :full_access)

    company_members = Access.get_group(company_id: group.company_id, tag: :standard)
    company_admins = Access.get_group(company_id: group.company_id, tag: :full_access)

    assert Access.get_binding(group_id: company_members.id, context_id: context.id, access_level: Binding.comment_access())
    assert Access.get_binding(group_id: company_admins.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "GroupCreation operation creates full_access binding with creator", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    context = Access.get_context!(group_id: group.id)
    access_group = Access.get_group!(person_id: ctx.creator.id)

    assert Access.get_binding(group_id: access_group.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "GroupCreation operation can create no_access binding to company members", ctx do
    attrs = Map.merge(@group_attrs, %{ company_permissions: Binding.no_access() })

    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, attrs)

    context = Access.get_context!(group_id: group.id)
    standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)

    assert Access.get_binding(group_id: standard.id, context_id: context.id)
    assert Access.get_binding(group_id: standard.id, context_id: context.id, access_level: Binding.no_access())

    assert Access.get_binding(group_id: full_access.id, context_id: context.id)
    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
  end

  test "GroupCreation operation creates only view_access for anonymours users", ctx do
    anonymous_group = Access.get_group(company_id: ctx.company.id, tag: :anonymous)

    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)
    context = Access.get_context!(group_id: group.id)

    refute Access.get_binding(group_id: anonymous_group.id, context_id: context.id, access_level: Binding.view_access())

    attrs = Map.merge(@group_attrs, %{public_permissions: Binding.comment_access()})
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, attrs)
    context = Access.get_context!(group_id: group.id)

    refute Access.get_binding(group_id: anonymous_group.id, context_id: context.id, access_level: Binding.view_access())
    refute Access.get_binding(group_id: anonymous_group.id, context_id: context.id, access_level: Binding.comment_access())

    attrs = Map.merge(@group_attrs, %{public_permissions: Binding.view_access()})
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, attrs)
    context = Access.get_context!(group_id: group.id)

    assert Access.get_binding(group_id: anonymous_group.id, context_id: context.id, access_level: Binding.view_access())
  end

  test "GroupCreation operation adds creator to managers group", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    managers = Access.get_group(group_id: group.id, tag: :full_access)

    assert Access.get_group_membership!(group_id: managers.id, person_id: ctx.creator.id)
  end

  test "GroupCreation operation creates activity", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    activity = from(a in Activity, where: a.action == "space_added" and a.content["space_id"] == ^group.id) |> Repo.one!()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["name"] == group.name
  end
end
