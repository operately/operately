defmodule Operately.Operations.GroupMembersAddingTest do
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

    people_ids = Enum.map(1..3, fn _ ->
      person = person_fixture(%{company_id: company.id})
      {person.id, Binding.comment_access()}
    end)

    {:ok, group: group, creator: creator, people_ids: people_ids}
  end

  test "GroupMembersAdding operation adds members to group", ctx do
    Operately.Operations.GroupMembersAdding.run(ctx.group.id, ctx.people_ids)

    members = Groups.list_members(ctx.group)
    people_ids = [ctx.creator.id | Enum.map(ctx.people_ids, fn {id, _} -> id end)]

    Enum.each(members, fn member ->
      assert Enum.member?(people_ids, member.id)
    end)
  end

  test "GroupMembersAdding operation adds members to access group", ctx do
    members = Access.get_group(group_id: ctx.group.id, tag: :standard)
    managers = Access.get_group(group_id: ctx.group.id, tag: :full_access)

    Enum.each(ctx.people_ids, fn {person_id, _} ->
      assert nil == Access.get_group_membership(group_id: members.id, person_id: person_id)
      assert nil == Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)

    Operately.Operations.GroupMembersAdding.run(ctx.group.id, ctx.people_ids)

    Enum.each(ctx.people_ids, fn {person_id, _} ->
      assert nil != Access.get_group_membership(group_id: members.id, person_id: person_id)
      assert nil == Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)
  end
end
