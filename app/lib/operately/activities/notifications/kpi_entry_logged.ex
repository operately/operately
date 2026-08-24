defmodule Operately.Activities.Notifications.KpiEntryLogged do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
