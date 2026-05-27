defmodule Operately.Activities.Notifications.GoalDescriptionChanged do
  @moduledoc """
  Notifies the following people:
  - People mentioned in the goal description

  The author of the activity is excluded from notifications.
  """

  alias Operately.Activities.Notifications.MentionedPeople

  def dispatch(activity) do
    people = MentionedPeople.ids(activity.content["new_description"])

    people
    |> Enum.reject(&(&1 == activity.author_id))
    |> Enum.uniq()
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
