defmodule Operately.Activities.Notifications.ProjectStatusUpdateAcknowledged do
  alias Operately.Projects

  def dispatch(activity) do
    project_id = activity.content["project_id"]
    project = Projects.get_project!(project_id)
    person = Projects.get_person_by_role(project, :champion)

    notifications = [%{
      person_id: person.id,
      activity_id: activity.id,
      should_send_email: true,
    }]

    Operately.Notifications.bulk_create(notifications)
  end
end
