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
end
