defmodule OperatelyEmail.Emails.GoalCheckInEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Goals}
  alias Operately.Goals.Update
  alias OperatelyWeb.Paths
  alias __MODULE__.OverviewMsg

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
    |> assign(:overview, OverviewMsg.construct(update, goal, reviewer))
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

  defmodule OverviewMsg do
    import Operately.RichContent.Builder
    alias Operately.People.Person

    def construct(update, goal, reviewer) do
      status = normalize_status(update.status)

      doc([paragraph(
        status_msg(status) ++ 
        reviewer_note(status, reviewer) ++ 
        due_date(goal.timeframe.end_date)
      )])
    end

    defp status_msg(:pending) do
      [text("The goal is "), bg_gray("pending"), text(". Work has not started yet.")]
    end

    defp status_msg(:on_track) do
      [text("The goal is "), bg_green("on-track"), text(".")]
    end

    defp status_msg(:concern) do
      [text("The goal "), bg_yellow("needs attention"), text(" due to emerging risks.")]
    end

    defp status_msg(:issue) do
      [text("The goal is "), bg_red("at risk"), text(" due to blockers or significant delays.")]
    end

    def reviewer_note(:pending, _), do: []
    def reviewer_note(:on_track, _), do: []
    def reviewer_note(:concern, reviewer), do: [text(" "), text(Person.first_name(reviewer)), text(" should be aware.")]
    def reviewer_note(:issue, reviewer), do: [text(" "), text(Person.first_name(reviewer) <> "'s"), text(" help is needed.")]

    defp due_date(date) do
      days = Date.diff(date, Date.utc_today())
      duration = human_duration(abs(days))

      cond do
        days < 0 -> [text(" "), text(duration), text(" "), bg_red("overdue.")]
        days > 0 -> [text(" "), text(duration), text(" "), text("until the deadline.")]
      end
    end

    defp human_duration(n) when n == 1, do: "1 day"
    defp human_duration(n) when n < 7, do: "#{n} days"
    defp human_duration(n) when n == 7, do: "1 week"
    defp human_duration(n) when n < 30, do: "#{div(n, 7)} weeks"
    defp human_duration(n) when n < 60, do: "1 month"
    defp human_duration(n) when n < 365, do: "#{div(n, 30)} months"

    defp normalize_status(:on_track), do: :on_track
    defp normalize_status(:concern), do: :concern
    defp normalize_status(:caution), do: :concern
    defp normalize_status(:issue), do: :issue
    defp normalize_status(:pending), do: :pending
  end
end
