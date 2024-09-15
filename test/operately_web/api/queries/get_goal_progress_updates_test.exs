defmodule OperatelyWeb.Api.Queries.GetGoalProgressUpdatesTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_goal_progress_updates, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      space_id = Paths.space_id(space)

      Map.merge(ctx, %{space: space, space_id: space_id, creator: creator})
    end

    test "company members have no access", ctx do
      {goal_id, _} = create_goal_and_updates(ctx, company_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 0
    end

    test "company members have access", ctx do
      {goal_id, updates} = create_goal_and_updates(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 3
      Enum.each(res.updates, fn u ->
        assert Enum.find(updates, &(Paths.goal_update_id(&1) == u.id))
      end)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      {goal_id, _} = create_goal_and_updates(ctx, space_access: Binding.no_access())

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})

      assert length(res.updates) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      {goal_id, updates} = create_goal_and_updates(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 3
      Enum.each(res.updates, fn u ->
        assert Enum.find(updates, &(Paths.goal_update_id(&1) == u.id))
      end)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      {goal_id, updates} = create_goal_and_updates(ctx, champion_id: champion.id)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 0

      assert {200, res} = query(conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 3
      Enum.each(res.updates, fn u ->
        assert Enum.find(updates, &(Paths.goal_update_id(&1) == u.id))
      end)
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      {goal_id, updates} = create_goal_and_updates(ctx, reviewer_id: reviewer.id)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(ctx.conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 0

      assert {200, res} = query(conn, :get_goal_progress_updates, %{goal_id: goal_id})
      assert length(res.updates) == 3
      Enum.each(res.updates, fn u ->
        assert Enum.find(updates, &(Paths.goal_update_id(&1) == u.id))
      end)
    end
  end

  #
  # Helpers
  #

  defp create_goal_and_updates(ctx, opts) do
    company_access = Keyword.get(opts, :company_access, Binding.no_access())
    space_access = Keyword.get(opts, :space_access, Binding.no_access())
    champion_id = Keyword.get(opts, :champion_id, ctx.creator.id)
    reviewer_id = Keyword.get(opts, :reviewer_id, ctx.creator.id)

    goal = goal_fixture(ctx.creator, %{
      space_id: ctx.space.id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      company_access_level: company_access,
      space_access_level: space_access,
    })
    updates = Enum.map(1..3, fn _ ->
      goal_update_fixture(ctx.creator, goal)
    end)

    goal_id = Paths.goal_id(goal)

    {goal_id, updates}
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end
end
