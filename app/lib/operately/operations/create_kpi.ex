defmodule Operately.Operations.CreateKpi do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Kpis.Kpi

  def run(creator, space, attrs) do
    with :ok <- Operately.Kpis.Permissions.check_edit_access(creator, space.id) do
      Multi.new()
      |> Multi.insert(:kpi, fn _ ->
        Kpi.changeset(%{
          company_id: space.company_id,
          space_id: space.id,
          creator_id: creator.id,
          name: attrs[:name],
          unit: attrs[:unit],
          target: attrs[:target]
        })
      end)
      |> Activities.insert_sync(creator.id, :kpi_creating, fn changes ->
        %{
          company_id: space.company_id,
          space_id: space.id,
          kpi_id: changes.kpi.id,
          name: changes.kpi.name
        }
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:kpi)
    end
  end
end
