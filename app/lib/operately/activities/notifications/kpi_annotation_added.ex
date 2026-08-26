defmodule Operately.Activities.Notifications.KpiAnnotationAdded do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
