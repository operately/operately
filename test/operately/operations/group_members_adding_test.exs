defmodule Operately.Operations.GroupMembersAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

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

    members = Enum.map(1..3, fn _ ->
      person = person_fixture(%{company_id: company.id})

      %{id: person.id, access_level: Binding.comment_access()}
    end)

    managers = Enum.map(1..3, fn _ ->
      person = person_fixture(%{company_id: company.id})

      %{id: person.id, access_level: Binding.full_access()}
    end)

    {:ok, company: company, group: group, creator: creator, members: members, managers: managers}
  end

  test "GroupMembersAdding operation adds members to group", ctx do
    Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, ctx.members)

    members = Groups.list_members(ctx.group)
    people_ids = [ctx.creator.id | Enum.map(ctx.members, fn %{id: id} -> id end)]

    Enum.each(members, fn member ->
      assert Enum.member?(people_ids, member.id)
    end)
  end

  test "GroupMembersAdding operation adds members to access group", ctx do
    members = Access.get_group(group_id: ctx.group.id, tag: :standard)
    managers = Access.get_group(group_id: ctx.group.id, tag: :full_access)

    Enum.each(ctx.members, fn %{id: person_id} ->
      refute Access.get_group_membership(group_id: members.id, person_id: person_id)
      refute Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)
    Enum.each(ctx.managers, fn %{id: person_id} ->
      refute Access.get_group_membership(group_id: members.id, person_id: person_id)
      refute Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)

    Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, ctx.members)
    Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, ctx.managers)

    Enum.each(ctx.members, fn %{id: person_id} ->
      assert Access.get_group_membership(group_id: members.id, person_id: person_id)
      refute Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)
    Enum.each(ctx.managers, fn %{id: person_id} ->
      refute Access.get_group_membership(group_id: members.id, person_id: person_id)
      assert Access.get_group_membership(group_id: managers.id, person_id: person_id)
    end)
  end

  test "GroupMembersAdding operation adds access bindings", ctx do
    all_members = ctx.members ++ ctx.managers
    access_context = Access.get_context!(group_id: ctx.group.id)

    Enum.each(all_members, fn %{id: person_id} ->
      access_group = Access.get_group!(person_id: person_id)

      refute Access.get_binding(group_id: access_group.id, context_id: access_context.id)
    end)

    Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, all_members)

    Enum.each(all_members, fn %{id: person_id, access_level: access_level} ->
      access_group = Access.get_group!(person_id: person_id)

      assert Access.get_binding(group_id: access_group.id, context_id: access_context.id, access_level: access_level)
      assert Access.get_binding(group_id: access_group.id, context_id: access_context.id)
    end)
  end

  test "GroupMembersAdding operation creates activity", ctx do
    all_members = ctx.members ++ ctx.managers

    {:ok, _} = Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, all_members)

    activity = from(a in Activity, where: a.action == "space_members_added" and a.content["space_id"] == ^ctx.group.id) |> Repo.one!()

    assert activity.content["company_id"] == ctx.company.id
    assert length(activity.content["members"]) == 6

    [g1, g2] = Enum.chunk_by(activity.content["members"], &(&1["access_level"]))

    assert length(g1) == 3
    assert length(g2) == 3

    member = hd(g1)

    assert Map.has_key?(member, "person_id")
    assert Map.has_key?(member, "person_name")
    assert Map.has_key?(member, "access_level")
  end

  test "GroupMembersAdding operation creates notification", ctx do
    all_members = ctx.members ++ ctx.managers

    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = Operately.Operations.GroupMembersAdding.run(ctx.creator, ctx.group.id, all_members)
    end)
    activity_id = from(a in Activity, where: a.action == "space_members_added" and a.content["space_id"] == ^ctx.group.id, select: a.id) |> Repo.one!()

    assert notifications_count() == 0

    perform_job(activity_id)

    assert notifications_count() == 6
  end
end
