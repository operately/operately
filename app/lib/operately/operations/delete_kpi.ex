defmodule Operately.Operations.DeleteKpi do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Kpis.Kpi

  def run(person, %Kpi{} = kpi) do
    with :ok <- Operately.Kpis.Permissions.check_edit_access(person, kpi.space_id) do
      Multi.new()
      |> Multi.delete(:kpi, kpi)
      |> Activities.insert_sync(person.id, :kpi_deleting, fn _ ->
        %{
          company_id: kpi.company_id,
          space_id: kpi.space_id,
          kpi_id: kpi.id,
          name: kpi.name
        }
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:kpi)
    end
  end
end
