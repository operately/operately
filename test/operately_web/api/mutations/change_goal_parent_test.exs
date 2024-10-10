defmodule OperatelyWeb.Api.Mutations.ChangeGoalParentTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :change_goal_parent, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      goal_parent = goal_fixture(creator, %{space_id: ctx.company.company_space_id})

      Map.merge(ctx, %{creator: creator, space_id: space.id, goal_parent: goal_parent})
    end

    test "company members without view access can't see a goal", ctx do
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal, new_parent)
      assert res.message == "The requested resource was not found"
      refute_parent_changed(goal, new_parent)
    end

    test "company members without edit access can't change goal parent", ctx do
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal, new_parent)
      assert res.message == "You don't have permission to perform this action"
      refute_parent_changed(goal, new_parent)
    end

    test "company members with edit access can change goal parent", ctx do
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end

    test "company admins can change goal parent", ctx do
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, goal, new_parent)
      refute_parent_changed(goal, new_parent)

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal, new_parent)
      assert res.message == "The requested resource was not found"
      refute_parent_changed(goal, new_parent)
    end

    test "space members without edit access can't change goal parent", ctx do
      add_person_to_space(ctx)
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal, new_parent)
      assert res.message == "You don't have permission to perform this action"
      refute_parent_changed(goal, new_parent)
    end

    test "space members with edit access can change goal parent", ctx do
      add_person_to_space(ctx)
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, space_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end

    test "space managers can change goal parent", ctx do
      add_person_to_space(ctx)
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, goal, new_parent)
      refute_parent_changed(goal, new_parent)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end

    test "champions can change goal parent", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal, new_parent)
      refute_parent_changed(goal, new_parent)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end

    test "reviewers can change goal parent", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      new_parent = create_goal(ctx)
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal, new_parent)
      refute_parent_changed(goal, new_parent)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end
  end

  describe "change_goal_parent functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      goal_parent = goal_fixture(ctx.person, %{space_id: ctx.company.company_space_id})

      Map.merge(ctx, %{goal_parent: goal_parent})
    end

    test "archives goal", ctx do
      new_parent = create_goal(ctx)
      goal = create_goal(ctx)

      assert goal.parent_goal_id == ctx.goal_parent.id

      assert {200, _} = request(ctx.conn, goal, new_parent)
      assert_parent_changed(goal, new_parent)
    end
  end

  #
  # Steps
  #

  defp request(conn, goal, parent) do
    mutation(conn, :change_goal_parent, %{
      goal_id: Paths.goal_id(goal),
      parent_goal_id: Paths.goal_id(parent),
    })
  end

  defp assert_parent_changed(goal, new_parent) do
    goal = Repo.reload(goal)
    assert goal.parent_goal_id == new_parent.id
  end

  defp refute_parent_changed(goal, new_parent) do
    goal = Repo.reload(goal)
    refute goal.parent_goal_id == new_parent.id
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs \\ %{}) do
    goal_fixture(ctx[:creator] || ctx.person, Map.merge(%{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      parent_goal_id: ctx.goal_parent.id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }, Enum.into(attrs, %{})))
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
