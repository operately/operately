defmodule Operately.Activities.Notifications.KpiAnnotationEdited do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_subscribers(activity)
  end
end
