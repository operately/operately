defmodule Operately.Operations.GroupMembersPermissionsEditingTest do
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
    space = group_fixture(creator)

    members = [
      create_group_member(space, Binding.comment_access()),
      create_group_member(space, Binding.edit_access()),
      create_group_member(space, Binding.full_access()),
    ]

    {:ok, space: space, creator: creator, members: members}
  end

  test "GroupMembersPermissionsEditing operation edits members' permissions", ctx do
    attrs = Enum.map(ctx.members, fn member ->
      %{id: member.id, access_level: Binding.view_access}
    end)

    {:ok, _} = Operately.Operations.GroupMembersPermissionsEditing.run(ctx.creator, ctx.space, attrs)
    context = Access.get_context!(group_id: ctx.space.id)

    Enum.each(ctx.members, fn member ->
      access_group = Access.get_group!(person_id: member.id)

      assert Access.get_binding(context_id: context.id, group_id: access_group.id, access_level: Binding.view_access())
      assert Access.get_binding(context_id: context.id, group_id: access_group.id)
    end)

    first_member = hd(ctx.members)
    access_group = Access.get_group!(person_id: first_member.id)
    attrs = [
      %{id: first_member.id, access_level: Binding.full_access()}
    ]

    {:ok, _} = Operately.Operations.GroupMembersPermissionsEditing.run(ctx.creator, ctx.space, attrs)

    assert Access.get_binding(context_id: context.id, group_id: access_group.id, access_level: Binding.full_access())
    assert Access.get_binding(context_id: context.id, group_id: access_group.id)
  end

  test "GroupMembersPermissionsEditing operation creates activity", ctx do
    attrs = Enum.map(ctx.members, fn member ->
      %{id: member.id, access_level: Binding.comment_access}
    end)

    {:ok, _} = Operately.Operations.GroupMembersPermissionsEditing.run(ctx.creator, ctx.space, attrs)

    %{content: content} = from(a in Activity, where: a.action == "space_members_permissions_edited" and a.content["space_id"] == ^ctx.space.id) |> Repo.one()

    assert content["company_id"] == ctx.space.company_id
    assert content["space_id"] == ctx.space.id
    assert length(content["members"]) == 2

    member1 = Enum.at(ctx.members, 1)
    member2 = Enum.at(ctx.members, 2)

    assert Enum.find(content["members"], fn m -> m["person_id"] == member1.id end)
    assert Enum.find(content["members"], fn m -> m["person_id"] == member2.id end)
  end

  #
  # Helpers
  #

  defp create_group_member(space, permissions) do
    person = person_fixture(%{company_id: space.company_id})

    Groups.add_members(space.id, [%{
      id: person.id,
      permissions: permissions,
    }])

    person
  end
end
