defmodule OperatelyWeb.Mcp.Tools.Goals.AcknowledgeRetrospectiveTest do
  use Operately.DataCase, async: true

  alias Operately.Access.Binding
  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyWeb.Mcp.Tools.Goals.AcknowledgeRetrospective
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 acknowledges a goal retrospective" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, company_access: Binding.edit_access())

    {:ok, _} =
      Operately.Operations.GoalClosing.run(ctx.creator, ctx.goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    activity = latest_goal_closing(ctx.goal)

    assert {:ok, %{activity: result}} =
             AcknowledgeRetrospective.call(ToolConnHelper.conn_as(ctx, :coworker), %{
               "retrospective_id" => Paths.activity_id(activity)
             })

    assert result.id == Paths.activity_id(activity)
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
    |> Operately.Repo.one!()
  end
end
