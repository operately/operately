defmodule Operately.Activities.Notifications.DiscussionPosting do
  def dispatch(activity) do
    author_id = activity.author_id
    space_id = activity.content.space_id

    space = Operately.Groups.get_group!(space_id)
    members = Operately.Groups.list_members(space)

    notifications = Enum.map(members, fn member ->
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
