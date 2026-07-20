defmodule Operately.Search.IndexMaintenance.IndexScan do
  @moduledoc """
  Scans existing search entries and reconciles them with their original records.

  Current records are synchronized again so stale or newly excluded entries are
  repaired. Entries without an original record are deleted.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.Search.{Entry, Indexer, Source}
  alias Operately.Search.IndexMaintenance.{BatchResult, EntrySynchronizer}

  def run(run, source_adapter, batch_size) do
    indexed_entries = fetch_indexed_entries(run.source_type, run.cursor, batch_size)

    with {:ok, source_records} <- source_adapter.fetch_by_ids(source_ids(indexed_entries)),
         {:ok, result} <- reconcile(run.source_type, source_adapter, indexed_entries, source_records) do
      {:ok, BatchResult.with_page(result, last_source_id(indexed_entries), length(indexed_entries), batch_size)}
    end
  end

  defp reconcile(source_type, source_adapter, indexed_entries, source_records) do
    # `fetch_by_ids/1` returns only records that still exist, so this lookup lets us
    # identify which indexed entries no longer have an original record.
    source_records_by_id = Map.new(source_records, fn source_record -> {Source.id!(source_record), source_record} end)

    {orphaned_entries, current_entries} =
      Enum.split_with(indexed_entries, fn entry -> not Map.has_key?(source_records_by_id, entry.source_id) end)

    # Existing records are synchronized again because their content, scope,
    # permissions, or eligibility for search may have changed since indexing.
    current_source_records = Enum.map(current_entries, &Map.fetch!(source_records_by_id, &1.source_id))

    # Entries without an original record cannot be rebuilt and must be deleted.
    with {:ok, result} <- EntrySynchronizer.repair_locked(source_type, source_adapter, current_source_records),
         {:ok, deleted_count} <- Indexer.delete_many(entry_keys(orphaned_entries)) do
      {:ok,
       %{
         result
         | processed: result.processed + length(orphaned_entries),
           deleted_orphans: deleted_count
       }}
    end
  end

  defp fetch_indexed_entries(source_type, cursor, batch_size) do
    Entry
    |> where([entry], entry.source_type == ^source_type)
    |> after_cursor(cursor)
    |> order_by([entry], asc: entry.source_id)
    |> limit(^batch_size)
    |> Repo.all()
  end

  defp after_cursor(query, nil), do: query
  defp after_cursor(query, cursor), do: where(query, [entry], entry.source_id > ^cursor)

  defp source_ids(indexed_entries), do: Enum.map(indexed_entries, & &1.source_id)
  defp entry_keys(indexed_entries), do: Enum.map(indexed_entries, &{&1.source_type, &1.source_id})

  defp last_source_id([]), do: nil
  defp last_source_id(indexed_entries), do: indexed_entries |> List.last() |> Map.fetch!(:source_id)
end
