defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])

    {:ok, update} = Update.get(:system, id: activity.content["update_id"])
    {cta_text, cta_url} = construct_cta_text_and_url(person, company, goal, update)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> assign(:overview, construct_overview(update, goal))
    |> render("goal_check_in")
  end

  defp construct_cta_text_and_url(person, company, goal, check_in) do
    url = check_in_url(company, check_in)

    if goal.reviewer_id == person.id do
      {"Acknowledge", url <> "?acknowledge=true"}
    else
      {"View Check-In", url}
    end
  end

  defp check_in_url(company, check_in) do
    Paths.goal_check_in_path(company, check_in) |> Paths.to_url()
  end

  defp construct_overview(update, goal) do
    construct_overview_status(update) <> construct_overview_due_date(goal.timeframe.end_date)
  end

  defp construct_overview_status(%Update{status: "pending"}) do
    "The goal is pending. Work has not started yet."
  end

  defp construct_overview_status(%Update{status: "on_track"}) do
    "The goal is on track. 3 months until the deadline."
  end

  defp construct_overview_status(%Update{status: "caution"}) do
    "The goal needs attention, due to emerging risks. Frank should be aware. 3 months until the deadline."
  end

  defp construct_overview_status(%Update{status: "issue"}) do
    "The goal is at risk due to blockers or significant delays. Frank's help is needed. 3 months until the deadline."
  end

  defp construct_overview_due_date(due_date) do
    days = DateTime.diff(due_date, DateTime.utc_now(), :days)

    cond do
      days == 0 -> "The due date is today."
      days == 1 -> "The due date is tomorrow."
      days == -1 -> "The due date was yesterday."
      days < 0 -> human_duration(abs(days)) <> " overdue."
      days > 0 -> human_duration(abs(days)) <> " until the deadline."
    end
  end

  defp human_duration(n) when n == 1, do: "1 day"
  defp human_duration(n) when n < 7, do: "#{n} days"
  defp human_duration(n) when n == 7, do: "1 week"
  defp human_duration(n) when n < 30, do: "#{div(n, 7)} weeks"
  defp human_duration(n) when n == 30, do: "1 month"
  defp human_duration(n) when n < 365, do: "#{div(n, 30)} months"
end
