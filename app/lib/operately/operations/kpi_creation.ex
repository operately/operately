defmodule Operately.Operations.KpiCreation do
  alias Ecto.Multi
  alias Operately.{Repo, Notifications}
  alias Operately.Kpis.Kpi
  alias Operately.Activities
  alias Operately.Notifications.Subscription
  alias Operately.Operations.Notifications.SubscriptionList, as: SubscriptionListOps

  def run(creator, attrs) do
    Multi.new()
    |> SubscriptionListOps.insert(%{subscription_parent_type: :kpi})
    |> insert_kpi(attrs)
    |> SubscriptionListOps.update(:kpi)
    |> subscribe_champion(attrs)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:kpi)
  end

  defp insert_kpi(multi, attrs) do
    Multi.insert(multi, :kpi, fn changes ->
      Kpi.changeset(%{
        space_id: attrs[:space_id],
        champion_id: attrs[:champion_id],
        name: attrs[:name],
        unit: attrs[:unit],
        cadence: attrs[:cadence],
        subscription_list_id: changes.subscription_list.id
      })
    end)
  end

  # The champion follows the KPI by default so they are notified when new
  # entries are logged, mirroring how a project subscribes its champion.
  defp subscribe_champion(multi, %{champion_id: champion_id}) when not is_nil(champion_id) do
    Multi.run(multi, :champion_subscription, fn _repo, changes ->
      case Subscription.get(:system, subscription_list_id: changes.subscription_list.id, person_id: champion_id) do
        {:error, :not_found} ->
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: champion_id,
            type: :joined
          })

        {:ok, subscription} ->
          Notifications.update_subscription(subscription, %{canceled: false})
      end
    end)
  end

  defp subscribe_champion(multi, _attrs), do: multi

  defp insert_activity(multi, creator) do
    Activities.insert_sync(multi, creator.id, :kpi_created, fn changes ->
      %{
        company_id: creator.company_id,
        space_id: changes.kpi.space_id,
        kpi_id: changes.kpi.id,
        kpi_name: changes.kpi.name,
        champion_id: changes.kpi.champion_id
      }
    end)
  end
end
