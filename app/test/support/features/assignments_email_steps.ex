defmodule Operately.Support.Features.AssignmentsEmailSteps do
  use Operately.FeatureCase

  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias Operately.Support.Factory
  alias Operately.{Goals, Repo}

  def setup_review_v2 do
    %{}
    |> Factory.setup()
    |> Factory.enable_feature("review_v2")
    |> Factory.add_space(:product_space, name: "Product Space")
    |> Factory.add_space_member(:champion, :product_space, name: "Casey Champion")
    |> Factory.add_space_member(:reviewer, :product_space, name: "Riley Reviewer")
    |> Factory.add_space_member(:teammate, :product_space, name: "Taylor Teammate")
  end

  def prepare_champion_work(ctx) do
    ctx
    |> add_champion_project_work()
    |> add_champion_goal_work()
  end

  def prepare_champion_reviews(ctx) do
    ctx
    |> add_champion_project_review()
    |> add_champion_goal_review()
  end

  def prepare_reviewer_reviews(ctx) do
    ctx
    |> add_reviewer_project_review()
    |> add_reviewer_goal_review()
  end

  def reload_person(ctx, key) do
    person =
      ctx
      |> Map.fetch!(key)
      |> Repo.preload(:account)

    Map.put(ctx, key, person)
  end

  defp add_champion_project_work(ctx) do
    ctx =
      ctx
      |> Factory.add_project(:project_alpha, :product_space, [
        champion: :champion,
        reviewer: :reviewer,
        name: "Project Atlas"
      ])
      |> Factory.set_project_next_check_in_date(:project_alpha, hours_ago(6))

    timeframe =
      %Timeframe{
        contextual_start_date: nil,
        contextual_end_date: ContextualDate.create_day_date(days_from_today(-1))
      }

    ctx =
      ctx
      |> Factory.add_project_milestone(:project_alpha_milestone, :project_alpha, [
        title: "Milestone Alpha",
        timeframe: timeframe
      ])
      |> Factory.add_project_task(:project_alpha_task_due, :project_alpha_milestone, [
        name: "Prepare weekly update",
        due_date: ContextualDate.create_day_date(days_from_today(-1))
      ])
      |> Factory.add_task_assignee(:project_alpha_task_due_assignee, :project_alpha_task_due, :champion)
      |> Factory.add_project_task(:project_alpha_task_future, :project_alpha_milestone, [
        name: "Draft planning outline",
        due_date: ContextualDate.create_day_date(days_from_today(5))
      ])
      |> Factory.add_task_assignee(:project_alpha_task_future_assignee, :project_alpha_task_future, :champion)

    ctx
  end

  defp add_champion_goal_work(ctx) do
    ctx = Factory.add_goal(ctx, :growth_goal, :product_space, [
      name: "Improve Activation",
      champion: :champion,
      reviewer: :reviewer,
      timeframe: Timeframe.current_year()
    ])

    goal = Map.fetch!(ctx, :growth_goal)
    {:ok, goal} = Goals.update_goal(goal, %{next_update_scheduled_at: hours_ago(12)})

    Map.put(ctx, :growth_goal, goal)
  end

  defp add_champion_project_review(ctx) do
    Factory.add_project_check_in(ctx, :project_alpha_review_check_in, :project_alpha, :teammate, status: "off_track")
  end

  defp add_champion_goal_review(ctx) do
    Factory.add_goal_update(ctx, :growth_goal_update, :growth_goal, :teammate)
  end

  defp add_reviewer_project_review(ctx) do
    ctx =
      ctx
      |> Factory.add_project(:project_beta, :product_space, [
        champion: :teammate,
        reviewer: :reviewer,
        name: "Project Beacon"
      ])
      |> Factory.set_project_next_check_in_date(:project_beta, hours_ago(4))

    Factory.add_project_check_in(ctx, :project_beta_check_in, :project_beta, :teammate, status: "caution")
  end

  defp add_reviewer_goal_review(ctx) do
    ctx = Factory.add_goal(ctx, :feedback_goal, :product_space, [
      name: "Feedback Program",
      champion: :teammate,
      reviewer: :reviewer,
      timeframe: Timeframe.current_year()
    ])

    goal = Map.fetch!(ctx, :feedback_goal)
    {:ok, goal} = Goals.update_goal(goal, %{next_update_scheduled_at: hours_ago(3)})

    ctx = Map.put(ctx, :feedback_goal, goal)

    Factory.add_goal_update(ctx, :feedback_goal_update, :feedback_goal, :teammate)
  end

  defp hours_ago(hours) do
    seconds = hours * 3600
    DateTime.utc_now() |> DateTime.add(-seconds, :second)
  end

  defp days_from_today(offset) do
    Date.utc_today() |> Date.add(offset)
  end

  step :send_assignments_email_to_champion, ctx do
    OperatelyEmail.Emails.AssignmentsEmail.send(ctx.champion)
    ctx
  end

  step :send_assignments_email_to_reviewer, ctx do
    OperatelyEmail.Emails.AssignmentsEmail.send(ctx.reviewer)
    ctx
  end

  step :assert_champion_email_contains_urgent_work, ctx do
    alias Operately.Support.Features.UI.Emails

    email = Emails.last_sent_email(to: ctx.champion.account.email)

    assert email.subject == "#{ctx.company.name}: Your assignments for today"
    refute email.html =~ "Needs your attention"
    refute email.html =~ "Upcoming work"
    assert email.html =~ "Project Atlas"
    assert email.html =~ "Submit weekly check-in"
    assert email.html =~ "Prepare weekly update"
    refute email.html =~ "Draft planning outline"
    assert email.html =~ "Improve Activation"
    assert email.html =~ "Overdue by"
    assert email.html =~ "Due today"
    refute email.html =~ "Needs your review"
    assert email.html =~ OperatelyWeb.Endpoint.url()

    refute email.text =~ "Needs your attention"
    refute email.text =~ "Upcoming work"
    assert email.text =~ "Project Atlas"
    assert email.text =~ "Improve Activation"
    assert email.text =~ "Overdue by"
    assert email.text =~ "Due today"
    refute email.text =~ "Needs your review"

    ctx
  end

  step :assert_reviewer_email_contains_review_assignments, ctx do
    alias Operately.Support.Features.UI.Emails

    email = Emails.last_sent_email(to: ctx.reviewer.account.email)

    assert email.subject == "#{ctx.company.name}: Your assignments for today"
    refute email.html =~ "Needs your attention"
    assert email.html =~ "Project Beacon"
    assert email.html =~ "Review weekly check-in"
    assert email.html =~ "Feedback Program"
    assert email.html =~ "Due today"
    refute email.html =~ "Needs your review"
    refute email.html =~ "Draft planning outline"

    assert email.text =~ "Project Beacon"
    assert email.text =~ "Feedback Program"
    assert email.text =~ "Due today"
    refute email.text =~ "Needs your review"

    ctx
  end
end
