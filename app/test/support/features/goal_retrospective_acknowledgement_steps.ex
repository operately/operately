defmodule Operately.Support.Features.GoalRetrospectiveAcknowledgementSteps do
  use Operately.FeatureCase

  alias Operately.Support.Factory
  alias Operately.Support.Features.{EmailSteps, NotificationsSteps, FeedSteps}

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
    |> then(fn ctx -> UI.login_as(ctx, ctx.champion) end)
  end

  step :close_goal_as_champion, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "close-goal-button")
    |> UI.wait_until_testid(testid: "goal-closing-page")
    |> UI.fill_rich_text("We achieved the goal")
    |> UI.click_button("Close Goal")
    |> wait_until_goal_closed()
    |> then(fn ctx ->
      activity = wait_until_goal_closing_activity(ctx.goal)
      Map.put(ctx, :closing_activity, activity)
    end)
  end

  step :acknowledge_retrospective_as_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.goal_activity_path(ctx.company, ctx.closing_activity))
    |> UI.click(testid: "acknowledge-retrospective")
    |> UI.sleep(300)
  end

  step :assert_retrospective_acknowledged, ctx do
    ctx
    |> UI.assert_text("Acknowledged by")
    |> UI.assert_text("#{ctx.reviewer.full_name} acknowledged this Retrospective")
  end

  step :assert_acknowledgement_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      action: "acknowledged your retrospective",
      author: ctx.reviewer
    })
  end

  step :assert_acknowledgement_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Acknowledged retrospective"
    })
  end

  step :assert_acknowledgement_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.reviewer,
      title: "acknowledged the"
    })
  end

  step :acknowledge_retrospective_from_email, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.space.name,
      to: ctx.reviewer,
      action: "closed the #{ctx.goal.name} goal",
      author: ctx.champion
    })

    email = UI.Emails.last_sent_email(to: ctx.reviewer.email)
    path = UI.Emails.find_link(email, "Acknowledge")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(path)
    |> UI.sleep(500)
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
    |> Operately.Repo.one()
  end

  defp wait_until_goal_closed(ctx, attempts \\ [50, 100, 200, 400, 800, 1600, 3200]) do
    goal = Operately.Repo.get!(Operately.Goals.Goal, ctx.goal.id)

    cond do
      goal.closed_at ->
        Map.put(ctx, :goal, goal)

      attempts == [] ->
        flunk("Timed out waiting for goal to close")

      true ->
        [delay | remaining] = attempts
        :timer.sleep(delay)
        wait_until_goal_closed(ctx, remaining)
    end
  end

  defp wait_until_goal_closing_activity(goal, attempts \\ [50, 100, 200, 400, 800, 1600, 3200]) do
    case latest_goal_closing(goal) do
      nil when attempts == [] ->
        flunk("Timed out waiting for goal_closing activity")

      nil ->
        [delay | remaining] = attempts
        :timer.sleep(delay)
        wait_until_goal_closing_activity(goal, remaining)

      activity ->
        activity
    end
  end
end
