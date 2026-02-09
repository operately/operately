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
    @table [
      %{company: :no_access,      space: :no_access,      goal: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, goal: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    goal: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    goal: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      goal: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      goal: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      goal: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        goal = create_goal(ctx, space, @test.company, @test.space, @test.goal)
        discussion = create_discussion(ctx, goal)

        assert {code, res} = request(ctx.conn, discussion)

        assert code == @test.expected

        case @test.expected do
          200 -> asset_discussion_edited(discussion)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
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

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_goal(ctx) do
    goal_fixture(ctx.person, %{
      space_id: ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    })
  end

  defp create_goal(ctx, space, company_members_level, space_members_level, goal_member_level) do
    goal_attrs = %{
      space_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    }

    goal_attrs = if goal_member_level != :no_access do
      Map.merge(goal_attrs, %{reviewer_id: ctx.person.id})
    else
      goal_attrs
    end

    goal = goal_fixture(ctx.creator, goal_attrs)

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    Operately.Repo.preload(goal, :access_context)
  end

  defp create_discussion(ctx, goal) do
    {:ok, discussion} = Operately.Operations.GoalDiscussionCreation.run(ctx[:creator] || ctx.person, goal, %{
      title: "Title",
      content: rich_text("Content"),
      subscription_parent_type: :comment_thread,
      send_notifications_to_everyone: false,
      subscriber_ids: []
    })
    discussion
  end
end
