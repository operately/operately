defmodule OperatelyWeb.Api.Mutations.EditGoalTimeframeTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_goal_timeframe, %{})
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
    end

    test "company members without edit access can't edit a goal timeframe", ctx do
      goal = create_goal(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit a goal timeframe", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, goal)
      assert_timeframe_edited(goal)
    end

    test "company admins can edit a goal timeframe", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, goal)

      # Admin
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, goal)
      assert_timeframe_edited(goal)
    end

    test "space members without view access can't see a goal", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, goal)
      assert res.message == "The requested resource was not found"
    end

    test "space members without edit access can't edit a goal timeframe", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, goal)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit a goal timeframe", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.edit_access())

      assert {200, _} = request(ctx.conn, goal)
      assert_timeframe_edited(goal)
    end

    test "space managers can edit a goal timeframe", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())

      # Not manager
      assert {404, _} = request(ctx.conn, goal)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, goal)
      assert_timeframe_edited(goal)
    end

    test "champions can edit a goal timeframe", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal)
      assert_timeframe_edited(goal)
    end

    test "reviewers can edit a goal timeframe", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, goal)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, goal)
      assert_timeframe_edited(goal)
    end
  end

  describe "edit_goal_timeframe functionality" do
    setup :register_and_log_in_account

    test "edits a goal timeframe", ctx do
      goal = create_goal(ctx)

      assert {200, _} = request(ctx.conn, goal)

      assert_timeframe_edited(goal)
    end
  end

  #
  # Steps
  #

  defp request(conn, goal) do
    mutation(conn, :edit_goal_timeframe, %{
      id: Paths.goal_id(goal),
      timeframe: %{
        type: "days",
        start_date: Date.to_string(~D{2024-08-20}),
        end_date: Date.to_string(~D{2024-08-25}),
      },
      comment: rich_text("Some comment") |> Jason.encode!(),
    })
  end

  defp assert_timeframe_edited(goal) do
    assert goal.timeframe.type == "quarter"

    goal = Repo.reload(goal)

    assert goal.timeframe.type == "days"
    assert goal.timeframe.start_date == ~D{2024-08-20}
    assert goal.timeframe.end_date == ~D{2024-08-25}
  end

  #
  # Helpers
  #

  defp create_goal(ctx, attrs \\ []) do
    goal_fixture(ctx[:creator] || ctx.person, Enum.into(attrs, %{
      space_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
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
