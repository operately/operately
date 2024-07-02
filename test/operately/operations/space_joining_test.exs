defmodule Operately.Operations.SpaceJoiningTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Groups
  alias Operately.Access

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(author)

    member = person_fixture_with_account(%{company_id: company.id})

    {:ok, space: space, member: member}
  end

  test "SpaceJoining operation adds member to space", ctx do
    refute Groups.is_member?(ctx.space, ctx.member)

    Operately.Operations.SpaceJoining.run(ctx.member, ctx.space.id)

    assert Groups.is_member?(ctx.space, ctx.member)
  end

  test "SpaceJoining operation adds access group membership", ctx do
    access_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    refute Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)

    Operately.Operations.SpaceJoining.run(ctx.member, ctx.space.id)

    assert Access.get_group_membership(group_id: access_group.id, person_id: ctx.member.id)
  end

  test "SpaceJoining operation adds access binding", ctx do
    access_group = Access.get_group!(person_id: ctx.member.id)
    access_context = Access.get_context!(group_id: ctx.space.id)

    refute Access.get_binding(group_id: access_group.id, context_id: access_context.id)

    Operately.Operations.SpaceJoining.run(ctx.member, ctx.space.id)

    assert Access.get_binding(group_id: access_group.id, context_id: access_context.id)
  end
end
