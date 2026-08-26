defmodule Operately.Operations.KpiCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.Kpi
  alias Operately.Kpis.Notifications
  alias Operately.Activities
  alias Operately.Operations.Notifications.SubscriptionList, as: SubscriptionListOps

  def run(creator, attrs) do
    Multi.new()
    |> SubscriptionListOps.insert(%{send_to_everyone: false, subscription_parent_type: :kpi})
    |> insert_kpi(attrs)
    |> SubscriptionListOps.update(:kpi)
    |> subscribe_people(creator)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:kpi)
    |> broadcast_assignments_count()
  end

  defp insert_kpi(multi, attrs) do
    Multi.insert(multi, :kpi, fn %{subscription_list: subscription_list} ->
      Kpi.changeset(%{
        space_id: attrs[:space_id],
        champion_id: attrs[:champion_id],
        subscription_list_id: subscription_list.id,
        name: attrs[:name],
        unit: attrs[:unit],
        cadence: attrs[:cadence],
        description: attrs[:description]
      })
    end)
  end

  defp subscribe_people(multi, creator) do
    multi
    |> Multi.run(:creator_subscription, fn _repo, %{subscription_list: subscription_list} ->
      Notifications.ensure_subscription(subscription_list.id, creator.id, :joined)
    end)
    |> Multi.run(:champion_subscription, fn _repo, %{subscription_list: subscription_list, kpi: kpi} ->
      Notifications.ensure_subscription(subscription_list.id, kpi.champion_id, :invited)
    end)
  end

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

  defp broadcast_assignments_count({:ok, %Kpi{champion_id: champion_id}} = result) when not is_nil(champion_id) do
    OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: champion_id)
    result
  end

  defp broadcast_assignments_count(result), do: result
end
