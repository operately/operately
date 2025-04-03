defmodule Operately.Activities.Notifications.CompanyAdding do
  def dispatch(_activity) do
    # no notifications for company editing
    {:ok, nil}
  end
end
