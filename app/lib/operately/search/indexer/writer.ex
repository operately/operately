defmodule Operately.Search.Indexer.Writer do
  @moduledoc """
  Persists prepared search entries according to their indexing intent:

  - Authoritative writes replace conflicting projections.
  - Guarded writes accept only newer source versions.
  - Repairs restore canonical data after the source has been locked and re-read.

  Existing projection rows are locked while classified, and returned counters describe
  the rows committed by PostgreSQL.
  """

  import Ecto.Query

  alias Operately.Search.Entry
  alias Operately.Search.Indexer.EntryBuilder

  @entry_fields EntryBuilder.fields()
  @replace_fields @entry_fields -- [:source_type, :source_id]

  def authoritative(repo, attrs_list), do: write(repo, attrs_list, :authoritative)
  def guarded(repo, attrs_list), do: write(repo, attrs_list, :guarded)
  def repair(repo, attrs_list), do: write(repo, attrs_list, :repair_locked)

  def delete(repo, source_type, source_id) do
    {count, _} =
      from(entry in Entry, where: entry.source_type == ^source_type and entry.source_id == ^source_id)
      |> repo.delete_all()

    count
  end

  def delete_many(_repo, []), do: 0

  def delete_many(repo, source_keys) do
    dynamic = source_keys_dynamic(source_keys)
    {count, _} = from(entry in Entry, where: ^dynamic) |> repo.delete_all()
    count
  end

  defp write(repo, attrs_list, intent) do
    {valid_rows, invalid_entries} = EntryBuilder.build(attrs_list)
    existing_entries = load_existing_entries(repo, valid_rows)
    initial_result = empty_result(invalid_entries)
    {write_candidates, result} = classify_entries(valid_rows, existing_entries, intent, initial_result)
    affected_keys = write_entries(repo, write_candidates, intent)

    count_write_outcomes(write_candidates, affected_keys, result)
  end

  defp load_existing_entries(_repo, []), do: %{}

  defp load_existing_entries(repo, rows) do
    keys = Enum.map(rows, &source_key/1)
    dynamic = source_keys_dynamic(keys)

    from(entry in Entry, where: ^dynamic)
    |> lock("FOR UPDATE")
    |> repo.all()
    |> Map.new(fn entry -> {source_key(entry), entry} end)
  end

  defp source_keys_dynamic(source_keys) do
    Enum.reduce(source_keys, false, fn {source_type, source_id}, dynamic ->
      dynamic([entry], ^dynamic or (entry.source_type == ^source_type and entry.source_id == ^source_id))
    end)
  end

  defp classify_entries(rows, existing_entries, intent, result) do
    Enum.reduce(rows, {[], result}, fn row, {write_candidates, result} ->
      case Map.get(existing_entries, source_key(row)) do
        nil -> {[{row, :inserted} | write_candidates], result}
        existing_entry -> classify_existing_entry(row, existing_entry, intent, write_candidates, result)
      end
    end)
  end

  defp classify_existing_entry(row, existing_entry, intent, write_candidates, result) do
    if entry_changed?(existing_entry, row) do
      classify_changed_entry(row, existing_entry, intent, write_candidates, result)
    else
      {write_candidates, increment(result, :unchanged)}
    end
  end

  defp classify_changed_entry(row, existing_entry, :guarded, write_candidates, result) do
    if newer_source?(row, existing_entry) do
      add_update(row, existing_entry, write_candidates, result)
    else
      {write_candidates, increment(result, :superseded)}
    end
  end

  defp classify_changed_entry(row, existing_entry, intent, write_candidates, result) when intent in [:authoritative, :repair_locked] do
    add_update(row, existing_entry, write_candidates, result)
  end

  defp add_update(row, existing_entry, write_candidates, result) do
    updated_row = %{row | id: existing_entry.id, inserted_at: existing_entry.inserted_at}
    {[{updated_row, :updated} | write_candidates], result}
  end

  defp newer_source?(row, existing_entry) do
    NaiveDateTime.compare(row.source_updated_at, existing_entry.source_updated_at) == :gt
  end

  defp entry_changed?(existing_entry, row) do
    Enum.any?(@entry_fields, fn field -> Map.get(existing_entry, field) != Map.get(row, field) end)
  end

  defp write_entries(_repo, [], _intent), do: MapSet.new()

  defp write_entries(repo, write_candidates, intent) do
    rows = Enum.map(write_candidates, &elem(&1, 0))

    {_count, affected_entries} =
      repo.insert_all(Entry, rows,
        on_conflict: conflict_action(intent),
        conflict_target: [:source_type, :source_id],
        returning: [:source_type, :source_id]
      )

    MapSet.new(affected_entries, &source_key/1)
  end

  defp conflict_action(:guarded) do
    from(entry in Entry,
      update: [
        set: [
          company_id: fragment("EXCLUDED.company_id"),
          access_context_id: fragment("EXCLUDED.access_context_id"),
          resource_hub_id: fragment("EXCLUDED.resource_hub_id"),
          space_id: fragment("EXCLUDED.space_id"),
          project_id: fragment("EXCLUDED.project_id"),
          goal_id: fragment("EXCLUDED.goal_id"),
          title: fragment("EXCLUDED.title"),
          normalized_title: fragment("EXCLUDED.normalized_title"),
          body: fragment("EXCLUDED.body"),
          body_kind: fragment("EXCLUDED.body_kind"),
          state: fragment("EXCLUDED.state"),
          source_inserted_at: fragment("EXCLUDED.source_inserted_at"),
          source_updated_at: fragment("EXCLUDED.source_updated_at"),
          updated_at: fragment("EXCLUDED.updated_at")
        ]
      ],
      where: fragment("EXCLUDED.source_updated_at > ?", entry.source_updated_at)
    )
  end

  defp conflict_action(:authoritative), do: replacement_conflict()
  defp conflict_action(:repair_locked), do: replacement_conflict()

  defp replacement_conflict, do: {:replace, @replace_fields ++ [:updated_at]}

  defp count_write_outcomes(write_candidates, affected_keys, result) do
    Enum.reduce(write_candidates, result, fn {row, expected_outcome}, result ->
      outcome = if MapSet.member?(affected_keys, source_key(row)), do: expected_outcome, else: :superseded
      increment(result, outcome)
    end)
  end

  defp increment(result, outcome), do: Map.update!(result, outcome, &(&1 + 1))
  defp source_key(entry), do: {entry.source_type, entry.source_id}

  defp empty_result(invalid_entries) do
    %{
      inserted: 0,
      updated: 0,
      unchanged: 0,
      invalid: length(invalid_entries),
      superseded: 0,
      invalid_entries: invalid_entries
    }
  end
end
