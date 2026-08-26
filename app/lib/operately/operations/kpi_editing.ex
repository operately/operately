defmodule Operately.Operations.KpiEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.Kpi
  alias Operately.Kpis.Notifications
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, attrs) do
    Multi.new()
    |> Multi.update(:kpi, Kpi.changeset(kpi, attrs))
    |> subscribe_champion()
    |> insert_activity(author, kpi)
    |> Repo.transaction()
    |> Repo.extract_result(:kpi)
    |> broadcast_assignments_count(kpi)
  end

  defp subscribe_champion(multi) do
    Multi.run(multi, :champion_subscription, fn _repo, %{kpi: kpi} ->
      Notifications.ensure_subscription(kpi.subscription_list_id, kpi.champion_id, :invited)
    end)
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_edited, fn changes ->
      %{
        company_id: author.company_id,
        space_id: changes.kpi.space_id,
        kpi_id: changes.kpi.id,
        old_name: kpi.name,
        new_name: changes.kpi.name
      }
    end)
  end

  defp broadcast_assignments_count({:ok, updated_kpi} = result, previous_kpi) do
    [previous_kpi.champion_id, updated_kpi.champion_id]
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
    |> Enum.each(&OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: &1))

    result
  end

  defp broadcast_assignments_count(result, _previous_kpi), do: result
end
