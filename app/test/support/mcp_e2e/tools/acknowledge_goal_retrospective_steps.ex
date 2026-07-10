defmodule Operately.Support.McpE2E.Tools.AcknowledgeGoalRetrospectiveSteps do
  use Operately.McpE2ECase

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  step :given_goal_retrospective, ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space, name: "Goal Retrospective Space")
      |> Factory.add_goal(:goal, :space,
        name: "Goal Retrospective",
        champion: :coworker,
        reviewer: :creator,
        company_access: Binding.edit_access()
      )

    {:ok, _} =
      Operately.Operations.GoalClosing.run(ctx.coworker, ctx.goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("We achieved the goal"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    Map.put(ctx, :closing_activity, latest_goal_closing(ctx.goal))
  end

  step :call_acknowledge_goal_retrospective, ctx do
    conn =
      call_tool(ctx.access_token, ctx.session_id, "acknowledge_goal_retrospective", %{
        "retrospective_id" => Paths.activity_id(ctx.closing_activity)
      })

    Map.put(ctx, :tool_conn, conn)
  end

  step :assert_goal_retrospective_acknowledged, ctx do
    body = json_body(ctx.tool_conn)
    activity = body["result"]["structuredContent"]["activity"]

    assert ctx.tool_conn.status == 200
    assert activity["id"] == Paths.activity_id(ctx.closing_activity)
    assert is_binary(activity["comment_thread"]["acknowledged_at"])
    assert activity["comment_thread"]["acknowledged_by"]["id"] == Paths.person_id(ctx.creator)

    ctx
  end

  defp latest_goal_closing(goal) do
    from(a in Operately.Activities.Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1,
      preload: [:comment_thread]
    )
    |> Operately.Repo.one!()
  end
end
