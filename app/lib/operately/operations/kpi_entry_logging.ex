defmodule Operately.Operations.KpiEntryLogging do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiEntry}
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, attrs) do
    Multi.new()
    |> insert_entry(kpi, attrs)
    |> insert_activity(author, kpi)
    |> Repo.transaction()
    |> Repo.extract_result(:entry)
  end

  defp insert_entry(multi, kpi, attrs) do
    Multi.insert(
      multi,
      :entry,
      KpiEntry.changeset(%{
        kpi_id: kpi.id,
        value: attrs[:value],
        period: attrs[:period],
        recorded_by_id: attrs[:recorded_by_id]
      })
    )
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_entry_logged, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        entry_id: changes.entry.id,
        value: changes.entry.value,
        period: changes.entry.period
      }
    end)
  end
end
