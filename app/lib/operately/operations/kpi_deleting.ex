defmodule Operately.Operations.KpiDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.Kpi
  alias Operately.Activities

  def run(author, %Kpi{} = kpi) do
    Multi.new()
    |> insert_activity(author, kpi)
    |> Multi.delete(:kpi, kpi)
    |> Repo.transaction()
    |> Repo.extract_result(:kpi)
    |> broadcast_assignments_count(kpi)
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        kpi_name: kpi.name
      }
    end)
  end

  defp broadcast_assignments_count({:ok, _deleted_kpi} = result, %Kpi{champion_id: champion_id}) when not is_nil(champion_id) do
    OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: champion_id)
    result
  end

  defp broadcast_assignments_count(result, _kpi), do: result
end
