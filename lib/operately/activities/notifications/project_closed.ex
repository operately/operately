defmodule Operately.Activities.Notifications.ProjectClosed do
  alias Operately.Projects

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]
    project = Projects.get_project!(project_id)
    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    mentioned = (
      Operately.RichContent.lookup_mentioned_people(project.retrospective["whatWentWell"])
      ++ Operately.RichContent.lookup_mentioned_people(project.retrospective["whatCouldHaveGoneBetter"])
      ++ Operately.RichContent.lookup_mentioned_people(project.retrospective["whatDidYouLearn"])
    )

    people = Enum.uniq_by(people ++ mentioned, & &1.id)

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    Operately.Notifications.bulk_create(notifications)
  end
end
