defmodule Operately.Activities.Notifications.DiscussionPosting do
  def dispatch(activity) do
    author_id = activity.author_id
    space_id = activity.content.space_id

    space = Operately.Groups.get_group!(space_id)
    members = Operately.Groups.list_members(space)
    discussion = Operately.Updates.get_update!(activity.content["discussion_id"])

    mentioned = 
      discussion.content["body"]
      |> ProsemirrorMentions.extract_ids()
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    people = Enum.uniq(members ++ mentioned)

    notifications = Enum.map(people, fn member ->
      %{
        person_id: member.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    notifications = Enum.filter(notifications, fn notification ->
      notification.person_id != author_id
    end)

    Operately.Notifications.bulk_create(notifications)
  end
end
