defmodule OperatelyWeb.Api.Goals.AcknowledgeRetrospectiveTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :acknowledge_retrospective], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access, space: :no_access, goal: :no_access, expected: 404},
      %{company: :no_access, space: :no_access, goal: :champion, expected: 200},
      %{company: :no_access, space: :no_access, goal: :reviewer, expected: 200},
      %{company: :no_access, space: :comment_access, goal: :no_access, expected: 403},
      %{company: :no_access, space: :edit_access, goal: :no_access, expected: 200},
      %{company: :no_access, space: :full_access, goal: :no_access, expected: 200},
      %{company: :comment_access, space: :no_access, goal: :no_access, expected: 403},
      %{company: :edit_access, space: :no_access, goal: :no_access, expected: 200},
      %{company: :full_access, space: :no_access, goal: :no_access, expected: 200}
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, goal=#{@test.goal} on the goal, then expect code=#{@test.expected}", ctx do
        goal = create_goal(ctx, @test.company, @test.space, @test.goal)
        activity = close_goal_and_get_activity(ctx, goal)

        assert {code, res} = request(ctx.conn, activity)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_response(res, activity)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    test "authors cannot acknowledge their own retrospectives", ctx do
      goal =
        Factory.add_goal(ctx, :goal, :space,
          champion: :person,
          company_access: Binding.no_access(),
          space_access: Binding.no_access()
        ).goal

      {:ok, _} =
        Operately.Operations.GoalClosing.run(ctx.person, goal, %{
          success: "success",
          success_status: "achieved",
          content: RichText.rich_text("content"),
          send_notifications_to_everyone: false,
          subscriber_ids: [],
          subscription_parent_type: :comment_thread
        })

      activity = latest_goal_closing(goal)

      assert {400, res} = request(ctx.conn, activity)
      assert res.message == "Authors cannot acknowledge their own retrospectives"
    end
  end

  describe "acknowledge_retrospective functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, reviewer: :person)
    end

    test "acknowledges goal retrospective", ctx do
      activity = close_goal_and_get_activity(ctx, ctx.goal)
      thread = Repo.preload(activity, :comment_thread).comment_thread

      refute thread.acknowledged_at
      refute thread.acknowledged_by_id

      assert {200, res} = request(ctx.conn, activity)
      assert_response(res, activity)
    end

    test "idempotency: acknowledging the same retrospective multiple times does not change the state", ctx do
      activity = close_goal_and_get_activity(ctx, ctx.goal)

      assert {200, res} = request(ctx.conn, activity)
      assert_response(res, activity)
      assert acknowledge_activity_count() == 1

      assert {200, res} = request(ctx.conn, activity)
      assert_response(res, activity)
      assert acknowledge_activity_count() == 1
    end
  end

  defp request(conn, activity) do
    mutation(conn, [:goals, :acknowledge_retrospective], %{id: Paths.activity_id(activity)})
  end

  defp assert_response(res, activity) do
    activity = Repo.reload(activity) |> Repo.preload(comment_thread: :acknowledged_by)

    assert activity.comment_thread.acknowledged_at
    assert activity.comment_thread.acknowledged_by_id
    assert res.activity.id == Paths.activity_id(activity)
  end

  defp acknowledge_activity_count do
    import Ecto.Query, only: [from: 2]

    from(a in Operately.Activities.Activity, where: a.action == "goal_retrospective_acknowledged")
    |> Operately.Repo.aggregate(:count)
  end

  defp close_goal_and_get_activity(ctx, goal) do
    {:ok, _} =
      Operately.Operations.GoalClosing.run(ctx.creator, goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    latest_goal_closing(goal)
  end

  defp latest_goal_closing(goal) do
    import Ecto.Query, only: [from: 2]

    from(a in Operately.Activities.Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1,
      preload: [:comment_thread]
    )
    |> Repo.one!()
  end

  defp create_goal(ctx, company_members_level, space_members_level, goal_member_level) do
    attrs =
      case goal_member_level do
        :champion -> [champion: :person]
        :reviewer -> [reviewer: :person]
        _ -> []
      end

    ctx =
      Factory.add_goal(
        ctx,
        :goal,
        :space,
        Keyword.merge(attrs,
          company_access: Binding.from_atom(company_members_level),
          space_access: Binding.from_atom(space_members_level)
        )
      )

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, ctx.space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    ctx.goal
  end
end
