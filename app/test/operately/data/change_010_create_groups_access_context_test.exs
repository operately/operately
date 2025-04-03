defmodule Operately.Data.Change010CreateGroupsAccessContextTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 1]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Groups.Group
  alias Operately.Access.Context
  alias Operately.Data.Change010CreateGroupsAccessContext

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, creator: creator}
  end

  test "creates access_context for existing groups", ctx do
    groups = Enum.map(1..5, fn _ ->
      create_group(ctx.company.id)
    end)

    Enum.each(groups, fn group ->
      assert nil == Repo.get_by(Context, group_id: group.id)
    end)

    Change010CreateGroupsAccessContext.run()

    Enum.each(groups, fn group ->
      assert %Context{} = Repo.get_by(Context, group_id: group.id)
    end)
  end


  test "creates access_context successfully when a group already has access context", ctx do
    group_with_fixtures = group_fixture(ctx.creator)
    group_without_fixtures = create_group(ctx.company.id)

    assert nil != Access.get_context!(group_id: group_with_fixtures.id)

    Change010CreateGroupsAccessContext.run()

    assert nil != Access.get_context!(group_id: group_without_fixtures.id)
  end

  test "creates access_context for soft-deleted groups", ctx do
    group_soft_deleted = create_group(ctx.company.id)
    Repo.soft_delete(group_soft_deleted)

    create_group(ctx.company.id)

    Change010CreateGroupsAccessContext.run()

    groups = from(p in Group) |> Repo.all(with_deleted: true)

    assert 3 == length(groups)

    Enum.each(groups, fn group ->
      assert nil != Access.get_context!(group_id: group.id)
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

    group
  end
end
