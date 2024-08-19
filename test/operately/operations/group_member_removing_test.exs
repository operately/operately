defmodule Operately.Operations.GroupMemberRemovingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    member = person_fixture_with_account(%{company_id: company.id})

    Groups.add_members(creator, group.id, [%{
      id: member.id,
      permissions: Binding.comment_access(),
    }])

    {:ok, company: company, creator: creator, group: group, member: member}
  end

  test "GroupMemberRemoving operation removes member from group", ctx do
    assert Groups.is_member?(ctx.group, ctx.member)

    Operately.Operations.GroupMemberRemoving.run(ctx.creator, ctx.group, ctx.member.id)

    refute Groups.is_member?(ctx.group, ctx.member)
  end

  test "GroupMemberRemoving operation deletes access memberships and bindings", ctx do
    access_group = Access.get_group!(group_id: ctx.group.id, tag: :standard)
    access_context = Access.get_context!(group_id: ctx.group.id)
    person_access_group = Access.get_group!(person_id: ctx.member.id)

    assert Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)
    assert Access.get_binding(context_id: access_context.id, group_id: person_access_group.id)

    Operately.Operations.GroupMemberRemoving.run(ctx.creator, ctx.group, ctx.member.id)

    refute Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)
    refute Access.get_binding(context_id: access_context.id, group_id: person_access_group.id)
  end

  test "GroupMemberRemoving operation creates activity", ctx do
    {:ok, _} = Operately.Operations.GroupMemberRemoving.run(ctx.creator, ctx.group, ctx.member.id)

    activity = from(a in Activity, where: a.action == "space_member_removed" and a.content["space_id"] == ^ctx.group.id) |> Repo.one!()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["space_id"] == ctx.group.id
    assert activity.content["member_id"] == ctx.member.id
  end
end
