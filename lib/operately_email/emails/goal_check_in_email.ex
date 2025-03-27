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
    |> assign(:overview, construct(update, goal, reviewer))
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

  def construct(update, goal, reviewer) do
    overview = overview_msg(update, goal, reviewer)

    doc do
      h1("Goal Check-In")

      h2("Overview")
      paragraph(overview)

      h2("Key wins, obstacles and needs")
      inject(update.message)
    end
  end

  def overview_msg(update, goal, reviewer) do
    status = Update.normalize_status(update.status)
    days = Date.diff(goal.timeframe.end_date, Date.utc_today())

    status_msg(status) |> reviewer_note(status, reviewer) |> due_date(days)
  end

  defp status_msg(:pending), do: "The goal is pending. Work has not started yet."
  defp status_msg(:on_track), do: "The goal is on track."
  defp status_msg(:concern), do: "The goal needs attention due to emerging risks."
  defp status_msg(:issue), do: "The goal is at risk due to blockers or significant delays."

  def reviewer_note(msg, _, nil), do: msg
  def reviewer_note(msg, :pending, _), do: msg
  def reviewer_note(msg, :on_track, _), do: msg
  def reviewer_note(msg, :concern, reviewer), do: msg <> " #{Person.first_name(reviewer)} should be aware."
  def reviewer_note(msg, :issue, reviewer), do: msg <> " #{Person.first_name(reviewer)}'s help is needed."

  def due_date(msg, days) when days >= 0, do: msg <> " #{Operately.Time.human_duration(days)} until the deadline."
  def due_date(msg, days), do: msg <> " #{Operately.Time.human_duration(days)} overdue."
end
