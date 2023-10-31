defmodule OperatelyEmail.ProjectTimelineEditedEmail do
  @view OperatelyEmail.Views.ProjectTimelineEdited

  alias Operately.People.Person

  def send(person, activity) do
    compose(activity, person) |> OperatelyEmail.Mailer.deliver_now()
  end

  def compose(activity, recipient) do
    import Bamboo.Email

    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    project = Operately.Projects.get_project!(activity.content["project_id"])

    content = activity.content

    old_duration = calculate_duration(content["old_start_date"], content["old_end_date"])
    new_duration = calculate_duration(content["new_start_date"], content["new_end_date"])
    duration_changed = old_duration != new_duration

    new_milestones = Enum.map(activity.content["new_milestones"], fn milestone ->
      Operately.Projects.get_milestone!(milestone["milestone_id"])
    end)

    assigns = %{
      company: company,
      project: project,
      activity: activity,
      duration_changed: duration_changed,
      old_duration: old_duration,
      new_duration: new_duration,
      new_milestones: new_milestones,
      author: Person.short_name(author),
      project_url: OperatelyEmail.project_url(project.id),
      cta_url: OperatelyEmail.project_url(project.id),
      title: subject(company, author, project)
    }

    new_email(
      to: recipient.email,
      from: OperatelyEmail.sender(company),
      subject: subject(company, author, project),
      html_body: @view.html(assigns),
      text_body: @view.text(assigns)
    )
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

  def subject(company, author, project) do
    "#{OperatelyEmail.sender_name(company)}: #{Person.short_name(author)} changed the timeline for #{project.name}"
  end
end
