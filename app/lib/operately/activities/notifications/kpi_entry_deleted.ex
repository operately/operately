defmodule Operately.Activities.Notifications.KpiEntryDeleted do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
