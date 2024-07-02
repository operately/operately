defmodule OperatelyEmail.Emails.ProjectTimelineEditedEmail do
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.content["project_id"])

    content = activity.content

    old_duration = calculate_duration(content["old_start_date"], content["old_end_date"])
    new_duration = calculate_duration(content["new_start_date"], content["new_end_date"])
    duration_changed = old_duration != new_duration

    new_milestones = Enum.map(activity.content["new_milestones"], fn milestone ->
      Projects.get_milestone!(milestone["milestone_id"])
    end)

    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "edited the timeline")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:activity, activity)
    |> assign(:duration_changed, duration_changed)
    |> assign(:old_duration, old_duration)
    |> assign(:new_duration, new_duration)
    |> assign(:new_milestones, new_milestones)
    |> assign(:link, link)
    |> render("project_timeline_edited")
  end

  defp calculate_duration(start_time, end_time) do
    if start_time && end_time do
      duration_in_days = Date.diff(end_time, start_time)
      duration_in_weeks = div(duration_in_days, 7)

      cond do
        duration_in_days == 1 ->
          "1 day"
        duration_in_days < 7 ->
          "#{duration_in_days} days"
        duration_in_weeks == 1 ->
          "1 week"
        true ->
          "#{duration_in_weeks} weeks"
      end
    else
      :undefined
    end
  end
end
