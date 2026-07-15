defmodule Operately.Operations.IdempotentAcknowledgementTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Activities.Activity
  alias Operately.Operations.GoalRetrospectiveAcknowledgement
  alias Operately.Operations.GoalUpdateAcknowledging
  alias Operately.Operations.ProjectCheckInAcknowledgement
  alias Operately.Operations.ProjectRetrospectiveAcknowledgement
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:reviewer)
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, reviewer: :reviewer)
    |> Factory.add_project_check_in(:project_check_in, :project, :creator)
    |> Factory.add_project_retrospective(:project_retrospective, :project, :creator)
    |> Factory.add_goal(:goal, :space, reviewer: :reviewer)
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  test "project check-in acknowledgement is idempotent for stale resource snapshots", ctx do
    check_in = Repo.preload(ctx.project_check_in, :project)

    assert_idempotent_acknowledgement(
      fn -> ProjectCheckInAcknowledgement.run(ctx.reviewer, check_in) end,
      "project_check_in_acknowledged"
    )
  end

  test "goal check-in acknowledgement is idempotent for stale resource snapshots", ctx do
    update = Repo.preload(ctx.goal_update, :goal)

    assert_idempotent_acknowledgement(
      fn -> GoalUpdateAcknowledging.run(ctx.reviewer, update) end,
      "goal_check_in_acknowledgement"
    )
  end

  test "project retrospective acknowledgement is idempotent for stale resource snapshots", ctx do
    retrospective = Repo.preload(ctx.project_retrospective, :project)

    assert_idempotent_acknowledgement(
      fn -> ProjectRetrospectiveAcknowledgement.run(ctx.reviewer, retrospective) end,
      "project_retrospective_acknowledged"
    )
  end

  test "goal retrospective acknowledgement is idempotent for stale resource snapshots", ctx do
    activity = close_goal_and_get_activity(ctx)

    assert_idempotent_acknowledgement(
      fn -> GoalRetrospectiveAcknowledgement.run(ctx.reviewer, activity, activity.comment_thread, ctx.goal) end,
      "goal_retrospective_acknowledged"
    )
  end

  defp assert_idempotent_acknowledgement(acknowledge, action) do
    assert {:ok, acknowledged_resource} = acknowledge.()
    assert acknowledged_resource.acknowledged_at

    assert {:ok, already_acknowledged_resource} = acknowledge.()
    assert already_acknowledged_resource.acknowledged_at

    assert activity_count(action) == 1
    assert notifications_count(action: action) == 1
  end

  defp activity_count(action) do
    from(a in Activity, where: a.action == ^action)
    |> Repo.aggregate(:count)
  end

  defp close_goal_and_get_activity(ctx) do
    {:ok, _} =
      Operately.Operations.GoalClosing.run(ctx.creator, ctx.goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    from(a in Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^ctx.goal.id,
      preload: [:comment_thread]
    )
    |> Repo.one!()
  end
end
