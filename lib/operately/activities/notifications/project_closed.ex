defmodule Operately.Activities.Notifications.ProjectClosed do
  alias Operately.Projects

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content.project_id
    project = Projects.get_project!(project_id)
    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    mentioned_ids = (
      ProsemirrorMentions.extract_ids(project.retrospective["whatWentWell"])
      ++ ProsemirrorMentions.extract_ids(project.retrospective["whatCouldHaveGoneBetter"])
      ++ ProsemirrorMentions.extract_ids(project.retrospective["whatDidYouLearn"])
    ) |> Enum.uniq()

    mentioned = Enum.map(mentioned_ids, fn id -> Operately.People.get_person!(id) end)

    people = Enum.uniq(people ++ mentioned) |> Enum.filter(fn person -> person.id != author_id end)

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
