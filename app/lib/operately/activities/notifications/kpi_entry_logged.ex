defmodule Operately.Activities.Notifications.KpiEntryLogged do
  alias Operately.Notifications.Subscriber

  def dispatch(activity) do
    case load_kpi(activity.content["kpi_id"]) do
      nil ->
        {:ok, []}

      kpi ->
        Subscriber.from_kpi(kpi)
        |> Enum.filter(& &1.is_subscribed)
        |> Enum.map(& &1.person.id)
        |> Enum.reject(&(&1 == activity.author_id))
        |> Enum.uniq()
        |> Enum.map(fn id ->
          %{person_id: id, activity_id: activity.id, should_send_email: false}
        end)
        |> Operately.Notifications.bulk_create()
    end
  end

  defp load_kpi(nil), do: nil

  defp load_kpi(kpi_id) do
    case Operately.Kpis.get_kpi(kpi_id) do
      nil -> nil
      kpi -> Operately.Repo.preload(kpi, [:champion, space: :members, subscription_list: [subscriptions: :person]])
    end
  end
end
