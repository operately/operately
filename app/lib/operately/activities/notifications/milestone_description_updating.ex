defmodule Operately.Activities.Notifications.MilestoneDescriptionUpdating do
  @moduledoc """
  Notifies the following people:
  - People mentioned in the milestone description

  The author of the activity is excluded from notifications.
  """

  alias Operately.RichContent

  def dispatch(activity) do
    people = RichContent.find_mentioned_ids(activity.content["description"], :decode_ids)

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
