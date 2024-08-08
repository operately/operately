defmodule OperatelyWeb.Api.Mutations.ArchiveGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :archive_goal, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.no_access())

      assert {404, %{message: message}} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert message == "The requested resource was not found"
      refute_goal_archived(goal)
    end

    test "company members without full access can't archive a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {403, %{message: message}} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert message == "You don't have permission to perform this action"
      refute_goal_archived(goal)
    end

    test "company members with full access can archive a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.full_access())

      assert {200, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end

    test "company admins can archive a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      refute_goal_archived(goal)

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, %{message: message}} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert message == "The requested resource was not found"
      refute_goal_archived(goal)
    end

    test "space members without full access can't archive a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, %{message: message}} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert message == "You don't have permission to perform this action"
      refute_goal_archived(goal)
    end

    test "space members with full access can archive a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.full_access())

      assert {200, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end

    test "space managers can archive a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      refute_goal_archived(goal)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end

    test "champions can archive a goal", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      refute_goal_archived(goal)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end

    test "reviewers can archive a goal", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      refute_goal_archived(goal)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end
  end

  describe "archive_goal functionality" do
    setup :register_and_log_in_account

    test "archives goal", ctx do
      goal = create_goal(ctx)
      refute goal.deleted_at

      assert {200, _} = mutation(ctx.conn, :archive_goal, %{goal_id: Paths.goal_id(goal)})
      assert_goal_archived(goal)
    end
  end

  #
  # Steps
  #

  defp refute_goal_archived(goal) do
    goal = Repo.reload(goal)
    refute goal.deleted_at
  end

  defp assert_goal_archived(goal) do
    refute Repo.reload(goal)

    goal = Repo.reload(goal, with_deleted: true)
    assert goal.deleted_at
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs \\ %{}) do
    goal_fixture(ctx[:creator] || ctx.person, Map.merge(%{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }, Enum.into(attrs, %{})))
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: Binding.full_access(),
    }])
  end
end
