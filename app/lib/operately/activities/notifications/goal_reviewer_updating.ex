defmodule Operately.Activities.Notifications.GoalReviewerUpdating do
  def dispatch(activity) do
    new_reviewer = find_new_reviewer(activity)

    if new_reviewer && new_reviewer.id != activity.author_id do
      Operately.Notifications.bulk_create([
        %{
          person_id: new_reviewer.id,
          activity_id: activity.id,
          should_send_email: true
        }
      ])
    end
  end

  defp find_new_reviewer(activity) do
    case activity.content["new_reviewer_id"] do
      nil -> nil
      new_reviewer_id -> Operately.People.get_person!(new_reviewer_id)
    end
  end
end
