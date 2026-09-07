defmodule Operately.Operations.KpiEntryDeleting do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Kpis.{Kpi, KpiEntry}
  alias Operately.Repo
  alias Operately.Repo.Locking
  alias Operately.Updates.{Comment, Reaction}

  @doc """
  Removes an already logged KPI value, along with its edit history, comments
  and reactions.

  The entry row is locked for the duration of the transaction. Overlapping
  requests are therefore serialized, so the second one finds the row gone and
  reports it as missing rather than raising on a stale delete, and the activity
  records the value the entry held at deletion time even if it was edited in
  between.
  """
  def run(author, %Kpi{} = kpi, %KpiEntry{} = entry) do
    Multi.new()
    |> Multi.run(:current, fn repo, _ -> Locking.lock_for_update(repo, entry) end)
    |> delete_reactions(entry)
    |> delete_comments(entry)
    |> insert_activity(author, kpi)
    |> Multi.delete(:entry, fn ctx -> ctx.current end)
    |> Repo.transaction()
    |> handle_result(kpi)
  end

  defp delete_reactions(multi, entry) do
    comment_ids =
      from(comment in Comment,
        where: comment.entity_type == :kpi_entry and comment.entity_id == ^entry.id,
        select: comment.id
      )

    Multi.delete_all(
      multi,
      :reactions,
      from(reaction in Reaction,
        where: reaction.entity_type == :comment and reaction.entity_id in subquery(comment_ids)
      )
    )
  end

  defp delete_comments(multi, entry) do
    Multi.delete_all(
      multi,
      :comments,
      from(comment in Comment, where: comment.entity_type == :kpi_entry and comment.entity_id == ^entry.id)
    )
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_entry_deleted, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        entry_id: changes.current.id,
        value: changes.current.value,
        period: changes.current.period
      }
    end)
  end

  # The entry may already be gone when two people confirm the same deletion, or
  # when a stale page submits one. The end state is what the caller wanted, but
  # there is no entry left to hand back, so report it as missing.
  defp handle_result({:error, :current, :not_found, _changes}, _kpi), do: {:error, :not_found}

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
