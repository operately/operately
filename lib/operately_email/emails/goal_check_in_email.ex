defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths
  alias Operately.People.Person

  import Operately.RichContent.DSL

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    goal = Goals.get_goal!(activity.content["goal_id"])
    reviewer = Repo.preload(goal, :reviewer).reviewer

    {:ok, update} = Update.get(:system, id: activity.content["update_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: goal.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:goal, goal)
    |> assign(:update, update)
    |> assign(:overview, construct(update, goal, reviewer, person, company))
    |> render("goal_check_in")
  end

  def construct(update, goal, reviewer, person, company) do
    doc do
      h1("Goal Check-In")

      h2("Overview")
      overview(update, goal, reviewer)

      h2("Key wins, obstacles and needs")
      inject(update.message)

      cta(person, company, goal, update)
    end
  end

  defp overview(update, goal, reviewer) do
    status = Update.normalize_status(update.status)
    days = Date.diff(goal.timeframe.end_date, Date.utc_today())

    status_msg(status) 
    |> reviewer_note(status, reviewer) 
    |> due_date(days)
    |> paragraph()
  end

  defp status_msg(:pending), do: "The goal is pending. Work has not started yet."
  defp status_msg(:on_track), do: "The goal is on track."
  defp status_msg(:concern), do: "The goal needs attention due to emerging risks."
  defp status_msg(:issue), do: "The goal is at risk due to blockers or significant delays."

  defp reviewer_note(msg, _, nil), do: msg
  defp reviewer_note(msg, :pending, _), do: msg
  defp reviewer_note(msg, :on_track, _), do: msg
  defp reviewer_note(msg, :concern, reviewer), do: msg <> " #{Person.first_name(reviewer)} should be aware."
  defp reviewer_note(msg, :issue, reviewer), do: msg <> " #{Person.first_name(reviewer)}'s help is needed."

  defp due_date(msg, days) when days >= 0, do: msg <> " #{Operately.Time.human_duration(days)} until the deadline."
  defp due_date(msg, days), do: msg <> " #{Operately.Time.human_duration(days)} overdue."

  defp cta(person, company, goal, check_in) do
    if goal.reviewer_id == person.id do
      link("Acknowledge", check_in_url(company, check_in) <> "?acknowledge=true")
    else
      link("View Check-In", check_in_url(company, check_in))
    end
  end

  defp check_in_url(company, check_in), do: Paths.goal_check_in_path(company, check_in) |> Paths.to_url()
end
