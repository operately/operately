defmodule Operately.Operations.KpiEntryEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiEntry, KpiEntryEdit}
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, %KpiEntry{} = entry, attrs) do
    value = Map.get(attrs, :value, entry.value)
    period = Map.get(attrs, :period, entry.period)

    if unchanged?(entry, value, period) do
      {:ok, entry}
    else
      Multi.new()
      |> insert_edit(author, entry)
      |> update_entry(entry, value, period)
      |> insert_activity(author, kpi, entry)
      |> Repo.transaction()
      |> Repo.extract_result(:entry)
      |> broadcast_assignments_count(kpi)
    end
  end

  defp unchanged?(entry, value, period) do
    entry.value == value and entry.period == period
  end

  defp insert_edit(multi, author, entry) do
    Multi.insert(
      multi,
      :edit,
      KpiEntryEdit.changeset(%{
        kpi_entry_id: entry.id,
        edited_by_id: author.id,
        previous_value: entry.value,
        previous_period: entry.period
      })
    )
  end

  defp update_entry(multi, entry, value, period) do
    Multi.update(multi, :entry, KpiEntry.changeset(entry, %{value: value, period: period}))
  end

  defp insert_activity(multi, author, kpi, entry) do
    Activities.insert_sync(multi, author.id, :kpi_entry_edited, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        entry_id: entry.id,
        old_value: entry.value,
        new_value: changes.entry.value,
        old_period: entry.period,
        new_period: changes.entry.period
      }
    end)
  end

  defp broadcast_assignments_count({:ok, _entry} = result, %Kpi{champion_id: champion_id}) when not is_nil(champion_id) do
    OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: champion_id)
    result
  end

  defp broadcast_assignments_count(result, _kpi), do: result
end
