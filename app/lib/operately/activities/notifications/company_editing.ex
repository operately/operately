defmodule Operately.Activities.Notifications.CompanyEditing do
  def dispatch(_activity) do
    # no notifications for company editing
    {:ok, nil}
  end
end
