defmodule Operately.Operations.GroupCreationTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}

  @group_attrs %{
    name: "my group",
    mission: "my mission",
    icon: "IconBuildingEstate",
    color: "text-cyan-500"
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
    access_context = Access.get_context!(group_id: group.id)

    assert nil != access_context
    assert 2 == length(access_groups)

    assert Enum.all?(access_groups, fn access_group ->
      access_group.group_id == group.id
    end)

    Enum.each(access_groups, fn access_group ->
      query = from(b in Binding, where: b.access_group_id == ^access_group.id and b.access_context_id == ^access_context.id)

      assert nil != Repo.one(query)
    end)
  end

  test "GroupCreation operation adds creator to managers group", ctx do
    {:ok, group} = Operately.Operations.GroupCreation.run(ctx.creator, @group_attrs)

    membership = Repo.one(from(m in GroupMembership, where: m.person_id == ^ctx.creator.id))
    access_context = Access.get_context!(group_id: group.id)

    assert nil != membership

    binding = Repo.one(from(b in Binding, where: b.access_group_id == ^membership.access_group_id and b.access_context_id == ^access_context.id))

    assert binding.access_level == 100
  end
end
