defmodule Operately.Operations.AddKpiDataPoint do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Kpis.{Kpi, DataPoint}

  def run(person, %Kpi{} = kpi, attrs) do
    with :ok <- Operately.Kpis.Permissions.check_edit_access(person, kpi.space_id) do
      Multi.new()
      |> Multi.insert(:data_point, fn _ ->
        DataPoint.changeset(%{
          kpi_id: kpi.id,
          value: attrs[:value],
          recorded_for: attrs[:recorded_for]
        })
      end)
      |> Activities.insert_sync(person.id, :kpi_data_point_adding, fn changes ->
        %{
          company_id: kpi.company_id,
          space_id: kpi.space_id,
          kpi_id: kpi.id,
          kpi_name: kpi.name,
          data_point_id: changes.data_point.id,
          value: changes.data_point.value,
          recorded_for: changes.data_point.recorded_for
        }
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{data_point: data_point}} -> {:ok, data_point}
        {:error, :data_point, changeset, _changes} -> {:error, changeset}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end
end
