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

    company
    |> new()
    |> to(person)
    |> subject(who: author, action: "changed the timeline for #{project.name}")
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:activity, activity)
    |> assign(:duration_changed, duration_changed)
    |> assign(:old_duration, old_duration)
    |> assign(:new_duration, new_duration)
    |> assign(:new_milestones, new_milestones)
    |> render("project_timeline_edited")
  end

  defp calculate_duration(start_time, end_time) do
    if start_time && end_time do
      {:ok, start_time, _} = DateTime.from_iso8601(start_time)
      {:ok, end_time, _} = DateTime.from_iso8601(end_time)

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
