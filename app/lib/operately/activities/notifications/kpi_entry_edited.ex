defmodule Operately.Activities.Notifications.KpiEntryEdited do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
