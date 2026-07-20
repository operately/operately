defmodule Operately.Search.IndexMaintenance.EntrySynchronizer do
  @moduledoc """
  Converts original Operately records into search entries and applies their changes.

  Records that are skipped or permanently invalid have any previous search entry
  removed so stale or unsafe data is not left searchable. Retryable failures abort
  the complete batch without advancing its checkpoint.
  """

  require Logger

  alias Operately.Search.{ErrorCategory, Indexer, Source}
  alias Operately.Search.IndexMaintenance.BatchResult

  @empty_changes %{
    entries: [],
    deletion_keys: [],
    skipped: 0,
    failed: 0,
    last_error: nil
  }

  def backfill(source_type, source_adapter, source_records) do
    synchronize(source_type, source_adapter, source_records, &Indexer.upsert_all_guarded/1)
  end

  def repair_locked(source_type, source_adapter, source_records) do
    synchronize(source_type, source_adapter, source_records, &Indexer.repair_all_locked/1)
  end

  defp synchronize(source_type, source_adapter, source_records, write_entries) do
    with {:ok, prepared_changes} <- prepare_index_changes(source_type, source_adapter, source_records),
         {:ok, write_summary} <- write_entries.(prepared_changes.entries),
         invalid_entry_keys = Enum.map(write_summary.invalid_entries, &{source_type, &1.source_id}),
         {:ok, _deleted_count} <- Indexer.delete_many(prepared_changes.deletion_keys ++ invalid_entry_keys) do
      {:ok,
       %BatchResult{
         processed: length(source_records),
         inserted: write_summary.inserted,
         updated: write_summary.updated,
         unchanged: write_summary.unchanged,
         superseded: write_summary.superseded,
         skipped: prepared_changes.skipped,
         failed: prepared_changes.failed + write_summary.invalid,
         last_error: prepared_changes.last_error || invalid_entry_error(write_summary.invalid_entries)
       }}
    end
  end

  defp prepare_index_changes(source_type, source_adapter, source_records) do
    Enum.reduce_while(source_records, {:ok, @empty_changes}, fn source_record, {:ok, changes} ->
      source_id = Source.id!(source_record)

      case source_adapter.to_entry(source_record) do
        {:ok, attrs} when is_map(attrs) -> {:cont, {:ok, add_entry(changes, attrs, source_type, source_id)}}
        :skip -> {:cont, {:ok, skip_entry(changes, source_type, source_id)}}
        {:error, {:invalid, category}} -> {:cont, {:ok, reject_entry(changes, source_type, source_id, category)}}
        {:error, reason} -> {:halt, {:error, reason}}
        _invalid -> {:halt, {:error, :invalid_adapter_result}}
      end
    end)
  end

  defp add_entry(changes, attrs, source_type, source_id) do
    entry = attrs |> Map.put(:source_type, source_type) |> Map.put(:source_id, source_id)
    %{changes | entries: [entry | changes.entries]}
  end

  defp skip_entry(changes, source_type, source_id) do
    %{
      changes
      | deletion_keys: [{source_type, source_id} | changes.deletion_keys],
        skipped: changes.skipped + 1
    }
  end

  defp reject_entry(changes, source_type, source_id, category) do
    category = ErrorCategory.sanitize(category)
    Logger.warning("Search source entry could not be built", source_type: source_type, reason: category)

    %{
      changes
      | deletion_keys: [{source_type, source_id} | changes.deletion_keys],
        failed: changes.failed + 1,
        last_error: category
    }
  end

  defp invalid_entry_error([]), do: nil
  defp invalid_entry_error(_invalid_entries), do: "invalid_search_entry"
end
