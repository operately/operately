defmodule Operately.Activities.Notifications.KpiDeleted do
  def dispatch(activity) do
    Operately.Kpis.Notifications.notify_space_members(activity)
  end
end
