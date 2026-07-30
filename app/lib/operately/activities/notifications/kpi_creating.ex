defmodule Operately.Activities.Notifications.KpiCreating do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_space_members(activity)
  end
end
