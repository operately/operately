defmodule OperatelyEmail.Emails.ProjectCheckInSubmittedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}
  alias OperatelyWeb.Paths
  alias __MODULE__.OverviewMsg

  def send(person, activity) do
    author = Repo.preload(activity, :author).author

    project = Projects.get_project!(activity.content["project_id"])
    project = Repo.preload(project, [:company, :reviewer])

    check_in = Projects.get_check_in!(activity.content["check_in_id"])
    company = project.company

    {cta_text, cta_url} = construct_cta_text_and_url(person, company, project, check_in)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "submitted a check-in")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:check_in, check_in)
    |> assign(:cta_url, cta_url)
    |> assign(:cta_text, cta_text)
    |> assign(:overview, OverviewMsg.construct(check_in, project))
    |> render("project_check_in_submitted")
  end

  defp construct_cta_text_and_url(person, company, project, check_in) do
    reviewer = project.reviewer
    url = Paths.project_check_in_path(company, check_in) |> Paths.to_url()

    cond do
      reviewer == nil -> {"View Check-In", url}
      person.id == reviewer.id -> {"Acknowledge", url <> "?acknowledge=true"}
      true -> {"View Check-In", url}
    end
  end

  defmodule OverviewMsg do
    import Operately.RichContent.Builder
    alias Operately.People.Person

    def construct(check_in, project) do
      status = normalize_status(check_in.status)
      reviewer = project.reviewer

      doc([
        paragraph(
          status_msg(status) ++
            reviewer_note(status, reviewer) ++
            due_date(project)
        )
      ])
    end

    defp status_msg(:on_track) do
      [text("The project is "), bg_green("on-track"), text(" and progressing as planned.")]
    end

    defp status_msg(:caution) do
      [text("The project "), bg_yellow("needs attention"), text(" due to emerging risks or delays.")]
    end

    defp status_msg(:off_track) do
      [text("The project is "), bg_red("off track"), text(" due to significant problems affecting success.")]
    end

    def reviewer_note(:on_track, _), do: []

    def reviewer_note(:caution, nil), do: []

    def reviewer_note(:caution, reviewer),
      do: [text(" "), text(Person.first_name(reviewer)), text(" should be aware.")]

    def reviewer_note(:off_track, nil), do: []

    def reviewer_note(:off_track, reviewer),
      do: [text(" "), text(Person.first_name(reviewer) <> "'s"), text(" help is needed.")]

    defp due_date(%{timeframe: nil}), do: []

    defp due_date(%{timeframe: timeframe}) do
      case Operately.ContextualDates.Timeframe.end_date(timeframe) do
        nil ->
          []

        date ->
          days = Date.diff(date, Date.utc_today())
          duration = human_duration(abs(days))

          cond do
            days < 0 -> [text(" "), text(duration), text(" "), bg_red("overdue.")]
            days > 0 -> [text(" "), text(duration), text(" "), text("until the deadline.")]
          end
      end
    end

    defp human_duration(n) when n == 1, do: "1 day"
    defp human_duration(n) when n < 7, do: "#{n} days"
    defp human_duration(n) when n == 7, do: "1 week"
    defp human_duration(n) when n < 30, do: "#{div(n, 7)} weeks"
    defp human_duration(n) when n < 60, do: "1 month"
    defp human_duration(n), do: "#{div(n, 30)} months"

    defp normalize_status(:on_track), do: :on_track
    defp normalize_status(:caution), do: :caution
    defp normalize_status(:off_track), do: :off_track
  end
end
