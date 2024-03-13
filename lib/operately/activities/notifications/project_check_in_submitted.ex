defmodule Operately.Activities.Notifications.ProjectCheckInSubmitted do
  alias Operately.Projects

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]
    check_in = Operately.Projects.get_check_in!(activity.content["check_in_id"])

    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    mentions = 
      check_in.description
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
