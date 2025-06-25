defmodule Operately.Activities.Notifications.GoalChampionUpdating do
  def dispatch(activity) do
    new_champion = find_new_champion(activity)

    if new_champion && new_champion.id != activity.author_id do
      Operately.Notifications.bulk_create([
        %{
          person_id: new_champion.id,
          activity_id: activity.id,
          should_send_email: true
        }
      ])
    end
  end

  defp find_new_champion(activity) do
    case activity.content["new_champion_id"] do
      nil -> nil
      new_champion_id -> Operately.People.get_person!(new_champion_id)
    end
  end
end
