defmodule Operately.Activities.Notifications.ProjectCheckInCommented do
  alias Operately.Projects

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    mentions = 
      comment.content["message"]
      |> ProsemirrorMentions.extract_ids()
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    people = Enum.uniq(people ++ mentions)

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
