defmodule Operately.Search.IndexMaintenance.EntrySynchronizer do
  @moduledoc """
  Converts original Operately records into search entries and applies their changes.

  Records that are skipped, fail conversion, or produce invalid entries have any
  previous search entry removed so stale or unsafe data is not left searchable.
  """

  require Logger

  alias Operately.Search.{Indexer, Source}
  alias Operately.Search.IndexMaintenance.BatchResult

  @empty_changes %{
    entries: [],
    deletion_keys: [],
    skipped: 0,
    failed: 0,
    last_error: nil
  }

  def synchronize(source_type, source_adapter, source_records) do
    prepared_changes = prepare_index_changes(source_type, source_adapter, source_records)

    with {:ok, write_summary} <- Indexer.upsert_all(prepared_changes.entries),
         invalid_entry_keys = Enum.map(write_summary.invalid_entries, &{source_type, &1.source_id}),
         {:ok, _deleted_count} <- Indexer.delete_many(prepared_changes.deletion_keys ++ invalid_entry_keys) do
      {:ok,
       %BatchResult{
         processed: length(source_records),
         inserted: write_summary.inserted,
         updated: write_summary.updated,
         unchanged: write_summary.unchanged,
         skipped: prepared_changes.skipped,
         failed: prepared_changes.failed + write_summary.invalid,
         last_error: prepared_changes.last_error || invalid_entry_error(write_summary.invalid_entries)
       }}
    end
  end

  defp prepare_index_changes(source_type, source_adapter, source_records) do
    Enum.reduce(source_records, @empty_changes, fn source_record, changes ->
      source_id = Source.id!(source_record)

      case build_entry_safely(source_adapter, source_record) do
        {:ok, attrs} -> add_entry(changes, attrs, source_type, source_id)
        :skip -> skip_entry(changes, source_type, source_id)
        {:error, category} -> reject_entry(changes, source_type, source_id, category)
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
    Logger.warning("Search source entry could not be built", source_type: source_type, source_id: source_id, reason: category)

    %{
      changes
      | deletion_keys: [{source_type, source_id} | changes.deletion_keys],
        failed: changes.failed + 1,
        last_error: category
    }
  end

  defp build_entry_safely(source_adapter, source_record) do
    case source_adapter.to_entry(source_record) do
      {:ok, attrs} when is_map(attrs) -> {:ok, attrs}
      :skip -> :skip
      {:error, reason} -> {:error, error_category(reason)}
      _invalid -> {:error, "invalid_adapter_result"}
    end
  rescue
    error -> {:error, error_category(error)}
  end

  defp invalid_entry_error([]), do: nil
  defp invalid_entry_error(_invalid_entries), do: "invalid_search_entry"

  defp error_category(%{__struct__: module}), do: inspect(module)
  defp error_category(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp error_category(reason) when is_binary(reason), do: String.slice(reason, 0, 120)
  defp error_category(_reason), do: "unknown"
end
