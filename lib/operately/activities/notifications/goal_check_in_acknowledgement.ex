defmodule Operately.Activities.Notifications.GoalCheckInAcknowledgement do
  def dispatch(activity) do
    goal_id = activity.content.goal_id
    goal = Operately.Goals.get_goal!(goal_id)

    notifications = [
      %{
        person_id: goal.champion_id,
        activity_id: activity.id,
        should_send_email: true,
      },
      %{
        person_id: goal.reviewer_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    ]

    notifications = Enum.filter(notifications, fn n -> n.person_id != activity.author_id end)

    Operately.Notifications.bulk_create(notifications)
  end
end
