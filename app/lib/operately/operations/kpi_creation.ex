defmodule Operately.Operations.KpiCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.Kpi
  alias Operately.Activities

  def run(creator, attrs) do
    Multi.new()
    |> insert_kpi(attrs)
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:kpi)
  end

  defp insert_kpi(multi, attrs) do
    Multi.insert(
      multi,
      :kpi,
      Kpi.changeset(%{
        space_id: attrs[:space_id],
        champion_id: attrs[:champion_id],
        name: attrs[:name],
        unit: attrs[:unit],
        cadence: attrs[:cadence],
        description: attrs[:description]
      })
    )
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
end
