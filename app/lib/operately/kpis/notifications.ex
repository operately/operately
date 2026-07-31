defmodule Operately.Kpis.Notifications do
  @moduledoc """
  Notification fan-out helpers for KPI activities.
  """

  alias Operately.Groups
  alias Operately.Groups.Group

  def notify_space_members(activity) do
    space = Groups.get_group(activity.content["space_id"])

    members =
      case space do
        %Group{} -> Groups.list_members(space)
        _ -> []
      end

    members
    |> Enum.map(& &1.id)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.uniq()
    |> Enum.map(fn id ->
      %{person_id: id, activity_id: activity.id, should_send_email: false}
    end)
    |> Operately.Notifications.bulk_create()
  end
end
