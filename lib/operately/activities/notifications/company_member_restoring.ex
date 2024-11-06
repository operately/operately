defmodule Operately.Activities.Notifications.CompanyMemberRestoring do
  def dispatch(_activity) do
    Operately.Notifications.bulk_create([])
  end
end
