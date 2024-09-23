defmodule Operately.Activities.Notifications.ProjectClosed do
  alias Operately.Projects
  alias Operately.Projects.Retrospective

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]

    {:ok, retrospective} = Retrospective.get(:system, project_id: project_id)
    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    mentioned = (
      Operately.RichContent.lookup_mentioned_people(retrospective.content["whatWentWell"])
      ++ Operately.RichContent.lookup_mentioned_people(retrospective.content["whatCouldHaveGoneBetter"])
      ++ Operately.RichContent.lookup_mentioned_people(retrospective.content["whatDidYouLearn"])
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
