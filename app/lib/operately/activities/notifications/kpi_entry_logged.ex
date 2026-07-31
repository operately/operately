defmodule Operately.Activities.Notifications.KpiEntryLogged do
  def dispatch(activity) do
    kpi = Operately.Kpis.get_kpi(activity.content["kpi_id"])

    [kpi && kpi.champion_id]
    |> Enum.filter(fn id -> id != nil and id != activity.author_id end)
    |> Enum.uniq()
    |> Enum.map(fn id ->
      %{person_id: id, activity_id: activity.id, should_send_email: false}
    end)
    |> Operately.Notifications.bulk_create()
  end
end
