defmodule Operately.Activities.Notifications.ProjectReviewRequestSubmitted do
  alias Operately.Projects

  def dispatch(activity) do
    project = Projects.get_project!(activity.content.project_id)
    person = Projects.get_person_by_role(project, :champion)

    notifications = [
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    ]

    Operately.Notifications.bulk_create(notifications)
  end
end
