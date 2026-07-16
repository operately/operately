defmodule OperatelyWeb.Api.Wrappers.Goals.AcknowledgeRetrospectiveTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:coworker)
    |> Factory.add_api_token(:api_token, :coworker, read_only: false)
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space, company_access: Binding.edit_access())
  end

  test "acknowledges retrospective by goal_id", ctx do
    activity = close_goal_and_get_activity(ctx.creator, ctx.goal)
    thread = Repo.preload(activity, :comment_thread).comment_thread

    refute thread.acknowledged_at

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "goals/acknowledge_retrospective", %{
               goal_id: Paths.goal_id(ctx.goal)
             })

    activity = Repo.reload(activity) |> Repo.preload(comment_thread: :acknowledged_by)

    assert activity.comment_thread.acknowledged_at
    assert activity.comment_thread.acknowledged_by_id == ctx.coworker.id
    assert res.activity.id == Paths.activity_id(activity)
  end

  test "returns not found when goal has no retrospective", ctx do
    assert {404, _} =
             external_mutation(ctx.conn, ctx.api_token, "goals/acknowledge_retrospective", %{
               goal_id: Paths.goal_id(ctx.goal)
             })
  end

  test "returns not found for unknown goal", ctx do
    assert {404, _} =
             external_mutation(ctx.conn, ctx.api_token, "goals/acknowledge_retrospective", %{
               goal_id: Operately.ShortUuid.encode!(Ecto.UUID.generate())
             })
  end

  test "authors cannot acknowledge their own retrospectives", ctx do
    ctx = Factory.add_api_token(ctx, :author_token, :creator, read_only: false)
    _activity = close_goal_and_get_activity(ctx.creator, ctx.goal)

    assert {400, res} =
             external_mutation(ctx.conn, ctx.author_token, "goals/acknowledge_retrospective", %{
               goal_id: Paths.goal_id(ctx.goal)
             })

    assert res.message == "Authors cannot acknowledge their own retrospectives"
  end

  defp close_goal_and_get_activity(author, goal) do
    {:ok, _} =
      Operately.Operations.GoalClosing.run(author, goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

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
end
