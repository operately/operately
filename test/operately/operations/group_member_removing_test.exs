defmodule Operately.Operations.GroupMemberRemovingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.Binding

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    member = person_fixture_with_account(%{company_id: company.id})

    Operately.Operations.GroupMembersAdding.run(group.id, [%{
      id: member.id,
      permissions: Binding.comment_access(),
    }])

    {:ok, group: group, member: member}
  end

  test "GroupMemberRemoving operation removes member from group", ctx do
    assert Groups.is_member?(ctx.group, ctx.member)

    Operately.Operations.GroupMemberRemoving.run(ctx.group.id, ctx.member.id)

    refute Groups.is_member?(ctx.group, ctx.member)
  end

  test "GroupMemberRemoving operation deletes access memberships and bindings", ctx do
    access_group = Access.get_group!(group_id: ctx.group.id, tag: :standard)
    access_context = Access.get_context!(group_id: ctx.group.id)
    person_access_group = Access.get_group!(person_id: ctx.member.id)

    assert Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)
    assert Access.get_binding(context_id: access_context.id, group_id: person_access_group.id)

    Operately.Operations.GroupMemberRemoving.run(ctx.group.id, ctx.member.id)

    refute Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)
    refute Access.get_binding(context_id: access_context.id, group_id: person_access_group.id)
  end
end
