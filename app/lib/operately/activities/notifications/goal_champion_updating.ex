defmodule Operately.Activities.Notifications.GoalChampionUpdating do
  def dispatch(_activity) do
    Operately.Notifications.bulk_create([])
  end
end
