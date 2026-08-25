defmodule Operately.Activities.Notifications.KpiEntryCommented do
  @moduledoc """
  Notifies people subscribed to the KPI, plus the person who recorded the update.

  The person who authored the comment is excluded.
  """

  alias Operately.Kpis
  alias Operately.Kpis.{KpiEntry, Notifications}
  alias Operately.Repo

  def dispatch(activity) do
    kpi = Kpis.get_kpi(activity.content["kpi_id"])
    entry = Repo.get(KpiEntry, activity.content["entry_id"])

    person_ids =
      case kpi do
        nil -> []
        kpi -> Notifications.get_subscribers(kpi, ignore: [activity.author_id])
      end

    recorded_by_id =
      case entry do
        %KpiEntry{recorded_by_id: id} when id != activity.author_id -> id
        _ -> nil
      end

    [recorded_by_id | person_ids]
    |> Enum.filter(& &1)
    |> Enum.uniq()
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
