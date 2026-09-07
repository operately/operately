defmodule Operately.Operations.KpiEntryEditing do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Kpis.{Kpi, KpiEntry, KpiEntryEdit}
  alias Operately.Repo
  alias Operately.Repo.Locking

  @doc """
  Corrects an already logged KPI value, keeping a record of what it replaced.

  The entry row is locked for the duration of the transaction, so overlapping
  corrections are serialized and each edit record captures the value it
  actually replaced instead of one a concurrent editor had already overwritten.
  """
  def run(author, %Kpi{} = kpi, %KpiEntry{} = entry, attrs) do
    Multi.new()
    |> Multi.run(:current, fn repo, _ -> Locking.lock_for_update(repo, entry) end)
    |> Multi.run(:requested, fn _repo, ctx -> requested_changes(ctx.current, attrs) end)
    |> Multi.insert(:edit, fn ctx -> previous_values_changeset(author, ctx.current) end)
    |> Multi.update(:entry, fn ctx -> KpiEntry.changeset(ctx.current, ctx.requested) end)
    |> insert_activity(author, kpi)
    |> Repo.transaction()
    |> handle_result(kpi)
  end

  defp requested_changes(current, attrs) do
    value = Map.get(attrs, :value, current.value)
    period = Map.get(attrs, :period, current.period)

    if current.value == value and current.period == period do
      {:error, :unchanged}
    else
      {:ok, %{value: value, period: period}}
    end
  end

  defp previous_values_changeset(author, current) do
    KpiEntryEdit.changeset(%{
      kpi_entry_id: current.id,
      edited_by_id: author.id,
      previous_value: current.value,
      previous_period: current.period
    })
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_entry_edited, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        entry_id: changes.entry.id,
        old_value: changes.current.value,
        new_value: changes.entry.value,
        old_period: changes.current.period,
        new_period: changes.entry.period
      }
    end)
  end

  # Editing to the values the entry already holds is a no-op, not a failure:
  # no edit record and no activity, and the caller still gets the entry back.
  defp handle_result({:error, :requested, :unchanged, changes}, _kpi), do: {:ok, changes.current}

  defp handle_result(result, kpi) do
    result
    |> Repo.extract_result(:entry)
    |> broadcast_assignments_count(kpi)
  end

  defp broadcast_assignments_count({:ok, _entry} = result, %Kpi{champion_id: champion_id}) when not is_nil(champion_id) do
    OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: champion_id)
    result
  end

  defp broadcast_assignments_count(result, _kpi), do: result
end
