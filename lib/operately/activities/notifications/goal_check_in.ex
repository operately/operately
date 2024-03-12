defmodule Operately.Activities.Notifications.GoalCheckIn do
  def dispatch(activity) do
    goal_id = activity.content.goal_id
    goal = Operately.Goals.get_goal!(goal_id)
    check_in = Operately.Updates.get_update!(activity.content["check_in_id"])

    mentioned = 
      check_in.content["message"]
      |> ProsemirrorMentions.extract_ids()
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    people = Enum.uniq([goal.champion_id, goal.reviewer_id] ++ mentioned)

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
