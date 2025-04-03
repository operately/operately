defmodule OperatelyWeb.Api.Mutations.EditGoalDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_goal_discussion, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Map.merge(ctx, %{creator: creator, goal: goal, space_id: space.id})
    end

    test "company members without view access can't see a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.no_access())
      discussion = create_discussion(ctx, goal)

      assert {404, res} = request(ctx.conn, discussion)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't edit a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.comment_access())
      discussion = create_discussion(ctx, goal)

      assert {403, res} = request(ctx.conn, discussion)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.edit_access())
      discussion = create_discussion(ctx, goal)

      assert {200, _} = request(ctx.conn, discussion)
      asset_discussion_edited(discussion)
    end

    test "company owner can edit a goal discussion", ctx do
      goal = create_goal(ctx, company_access_level: Binding.view_access())
      discussion = create_discussion(ctx, goal)

      # Not owner
      assert {403, _} = request(ctx.conn, discussion)

      # Owner
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, discussion)
      asset_discussion_edited(discussion)
    end

    test "space members without view access can't see a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())
      discussion = create_discussion(ctx, goal)

      assert {404, res} = request(ctx.conn, discussion)
      assert res.message == "The requested resource was not found"
    end

    test "space members without edit access can't edit a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.comment_access())
      discussion = create_discussion(ctx, goal)

      assert {403, res} = request(ctx.conn, discussion)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.edit_access())
      discussion = create_discussion(ctx, goal)

      assert {200, _} = request(ctx.conn, discussion)
      asset_discussion_edited(discussion)
    end

    test "space managers can edit a goal discussion", ctx do
      add_person_to_space(ctx)
      goal = create_goal(ctx, space_access_level: Binding.no_access())
      discussion = create_discussion(ctx, goal)

      # Not manager
      assert {404, _} = request(ctx.conn, discussion)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, discussion)
      asset_discussion_edited(discussion)
    end

    test "champions can edit a goal discussion", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, champion_id: champion.id, company_access_level: Binding.view_access())
      discussion = create_discussion(ctx, goal)

      # another user's request
      assert {403, _} = request(ctx.conn, discussion)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, discussion)
      asset_discussion_edited(discussion)
    end

    test "reviewers can edit a goal discussion", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      goal = create_goal(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())
      discussion = create_discussion(ctx, goal)

      # another user's request
      assert {403, _} = request(ctx.conn, discussion)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, discussion)
      asset_discussion_edited(discussion)
    end
  end

  describe "edit_goal_discussion functionality" do
    setup :register_and_log_in_account

    test "edits a goal discussion", ctx do
      goal = create_goal(ctx)
      discussion = create_discussion(ctx, goal)

      assert {200, _} = request(ctx.conn, discussion)
      asset_discussion_edited(discussion)
    end
  end

  #
  # Steps
  #

  defp request(conn, discussion) do
    discussion = Repo.preload(discussion, :comment_thread)

    mutation(conn, :edit_goal_discussion, %{
      activity_id: Paths.activity_id(discussion),
      title: "Edited title",
      message: rich_text("Edited content") |> Jason.encode!(),
    })
  end

  defp asset_discussion_edited(discussion) do
    discussion = Repo.reload(discussion) |> Repo.preload(:comment_thread)

    assert discussion.comment_thread.title == "Edited title"
    assert discussion.comment_thread.message == rich_text("Edited content")
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

  defp create_discussion(ctx, goal) do
    content = rich_text("Content") |> Jason.encode!()
    {:ok, discussion} = Operately.Operations.GoalDiscussionCreation.run(ctx[:creator] || ctx.person, goal, "Title", content)
    discussion
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
