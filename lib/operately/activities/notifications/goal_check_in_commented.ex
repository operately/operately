defmodule Operately.Activities.Notifications.GoalCheckInCommented do
  def dispatch(activity) do
    goal_id = activity.content.goal_id
    goal = Operately.Goals.get_goal!(goal_id)
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])

    people = Enum.uniq([goal.champion_id, goal.reviewer_id] ++ [comment.author_id])

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    notifications = Enum.filter(notifications, fn n -> n.person_id != activity.author_id end)

    Operately.Notifications.bulk_create(notifications)
  end
end
