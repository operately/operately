defmodule OperatelyEmail.Email do
  import Bamboo.Email

  alias Operately.{People, Projects}
  alias Operately.Repo

  def assignments_email(person) do
    company = Repo.preload(person, [:company]).company
    account = Repo.preload(person, [:account]).account

    pending_assignments = People.get_assignments(
      person,
      DateTime.from_unix!(0),
      DateTime.utc_now()
    )

    if Enum.empty?(pending_assignments) do
      :no_assignments
    else
      {:ok, new_email(
        to: account.email,
        from: {org_name(company), "igor@operately.com"},
        subject: "#{org_name(company)}: Your assignments for today",
        html_body: html_body(pending_assignments),
        text_body: text_body(pending_assignments)
      )}
    end
  end

  defp org_name(company) do
    "Operately (#{company.name})"
  end

  defp html_body(assignments) do
    """
      <html>
        <body>
          <h1 style="margin-bottom: 20px; font-size: 18px;">Here are your assignments for today</h1>

          <ul style="padding-left: 5px">
            #{html_assignments_list(assignments)}
          </ul>
        </body>
      </html>
    """
  end

  defp html_assignments_list(assignments) do
    assignments
    |> Enum.map(fn assignment ->
      case assignment.type do
        "milestone" ->
          project = Projects.get_project!(assignment.resource.project_id)
          link = OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/milestones"

          "<li>Milestone <a href='#{link}'>#{milestone_project_title(assignment.resource, project)}</a> #{relative_due(assignment.due)}</li>"

        "project_status_update" -> 
          project = assignment.resource
          link = OperatelyWeb.Endpoint.url() <> "/projects/#{project.id}/updates/new"

          "<li><a href='#{link}'>Status Update for #{assignment.resource.name}</a> #{relative_due(assignment.due)}</li>"

        _ ->
          []
      end
    end)
  end

  defp text_body(assignments) do
    """
      Here are your assignments for today

      #{text_assignments_list(assignments)}
    """
  end

  defp text_assignments_list(assignments) do
    assignments
    |> Enum.map(fn assignment ->
      case assignment.type do
        "milestone" ->
          project = Projects.get_project!(assignment.resource.project_id)

          "- Milestone #{milestone_project_title(assignment.resource, project)} #{relative_due(assignment.due)}"
        "project_status_update" -> 
          "- Status Update for #{assignment.resource.name} #{relative_due(assignment.due)}"
        _ ->
          []
      end
    end)
  end

  defp milestone_project_title(milestone, project) do
    "#{milestone.title} on #{project.name}"
  end

  defp relative_due(due) do
    due = if due.__struct__ == NaiveDateTime do
      due |> DateTime.from_naive!("Etc/UTC")
    else
      due
    end

    today = DateTime.utc_now() |> DateTime.to_date()
    datetime_date = due |> DateTime.to_date()

    case Date.compare(datetime_date, today) do
      :lt ->
        days_ago = Date.diff(today, datetime_date)

        "was due #{days_ago} days ago"
      :eq ->
        "is due today"
    end
  end

end
