defmodule Operately.Kpis.Notifications do
  @moduledoc """
  Builds notifications for KPI activities. All members of the space the KPI
  belongs to are notified, except the person who authored the activity.
  """

  def notify_space_members(activity) do
    space = Operately.Groups.get_group(activity.content["space_id"])

    space
    |> Operately.Groups.list_members()
    |> Enum.map(& &1.id)
    |> Enum.reject(&(&1 == activity.author_id))
    |> Enum.uniq()
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: false
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
