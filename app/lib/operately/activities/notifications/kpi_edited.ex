defmodule Operately.Activities.Notifications.KpiEdited do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_space_members(activity)
  end
end
