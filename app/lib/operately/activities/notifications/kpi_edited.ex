defmodule Operately.Activities.Notifications.KpiEdited do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
