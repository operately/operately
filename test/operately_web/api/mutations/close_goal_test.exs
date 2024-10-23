defmodule OperatelyWeb.Api.Mutations.CloseGoalTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding
  alias OperatelyWeb.Paths

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :close_goal, %{})
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

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
      refute_goal_closed(goal)
    end

    test "company members without full access can't close a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
      refute_goal_closed(goal)
    end

    test "company members with full access can close a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.full_access())

      assert {200, _} = request(ctx.conn, goal)
      assert_goal_closed(goal, ctx.person)
    end

    test "company owner can close a goal", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, goal)
      refute_goal_closed(goal)

      # Admin
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, goal)
      assert_goal_closed(goal, ctx.person)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
      refute_goal_closed(goal)
    end

    test "space members without full access can't close a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
      refute_goal_closed(goal)
    end

    test "space members with full access can close a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.full_access())

      assert {200, _} = request(ctx.conn, goal)
      assert_goal_closed(goal, ctx.person)
    end

    test "space managers can close a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, goal)
      refute_goal_closed(goal)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, goal)
      assert_goal_closed(goal, ctx.person)
    end

    test "champions can close a goal", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)
      refute_goal_closed(goal)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal)
      assert_goal_closed(goal, champion)
    end

    test "reviewers can close a goal", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)
      refute_goal_closed(goal)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal)
      assert_goal_closed(goal, reviewer)
    end
  end

  describe "close_goal functionality" do
    setup :register_and_log_in_account

    test "closes goal", ctx do
      goal = create_goal(ctx)

      refute_goal_closed(goal)

      assert {200, res} = request(ctx.conn, goal)

      assert_goal_closed(goal, ctx.person)
      assert res.goal == Serializer.serialize(goal)
    end
  end

  #
  # Steps
  #

  defp request(conn, goal) do
    mutation(conn, :close_goal, %{
      goal_id: Paths.goal_id(goal),
      success: "yes",
      retrospective: rich_text("result") |> Jason.encode!(),
    })
  end

  defp refute_goal_closed(goal) do
    goal = Repo.reload(goal)

    refute goal.closed_at
    refute goal.closed_by_id
    refute goal.success
  end

  defp assert_goal_closed(goal, author) do
    goal = Repo.reload(goal)

    assert goal.closed_at
    assert goal.success
    assert goal.closed_by_id == author.id
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs \\ %{}) do
    goal_fixture(ctx[:creator] || ctx.person, Enum.into(attrs, %{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
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
