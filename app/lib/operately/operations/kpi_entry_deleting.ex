defmodule Operately.Operations.KpiEntryDeleting do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Kpis.{Kpi, KpiEntry}
  alias Operately.Repo
  alias Operately.Updates.{Comment, Reaction}

  def run(author, %Kpi{} = kpi, %KpiEntry{} = entry) do
    Multi.new()
    |> delete_reactions(entry)
    |> delete_comments(entry)
    |> insert_activity(author, kpi, entry)
    |> Multi.delete(:entry, entry)
    |> Repo.transaction()
    |> Repo.extract_result(:entry)
    |> broadcast_assignments_count(kpi)
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

  defp insert_activity(multi, author, kpi, entry) do
    Activities.insert_sync(multi, author.id, :kpi_entry_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        entry_id: entry.id,
        value: entry.value,
        period: entry.period
      }
    end)
  end

  defp broadcast_assignments_count({:ok, _entry} = result, %Kpi{champion_id: champion_id}) when not is_nil(champion_id) do
    OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: champion_id)
    result
  end

  defp broadcast_assignments_count(result, _kpi), do: result
end
