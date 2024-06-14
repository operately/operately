defmodule Operately.Data.Change010CreateGroupsAccessContextTest do
  use Operately.DataCase

  import Operately.AccessFixtures, only: [context_fixture: 1]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Context
  alias Operately.Data.Change010CreateGroupsAccessContext

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})

    {:ok, creator: creator}
  end

  test "creates access_context for existing groups", ctx do
    groups = Enum.map(1..5, fn _ ->
      group_fixture(ctx.creator)
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
    group_without_fixtures = group_fixture(ctx.creator)

    context_fixture(%{group_id: group_with_fixtures.id})

    assert nil != Access.get_context!(group_id: group_with_fixtures.id)

    Change010CreateGroupsAccessContext.run()

    assert nil != Access.get_context!(group_id: group_without_fixtures.id)
  end
end
