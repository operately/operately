defmodule Operately.Search.SourceIndexer do
  @moduledoc """
  Synchronizes search entries from registered source adapters.

  Refresh workers and maintenance operations use this module to reload current source
  records and authoritatively update their search projection. Missing and intentionally
  excluded records remove any existing entry.
  """

  alias Operately.Repo
  alias Operately.Search.{Indexer, Source, SourceRegistry}

  def sync(source_type, source_id), do: sync_all(source_type, [source_id])

  def sync_all(source_type, source_ids) when is_binary(source_type) and is_list(source_ids) do
    Repo.transaction(fn ->
      case synchronize(source_type, source_ids) do
        {:ok, summary} -> summary
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp synchronize(source_type, source_ids) do
    source_ids = normalize_ids(source_ids)

    with {:ok, source_adapter} <- SourceRegistry.fetch(source_type),
         {:ok, source_records} <- source_adapter.fetch_by_ids(source_ids),
         {:ok, changes} <- prepare_changes(source_type, source_adapter, source_ids, source_records),
         {:ok, write_summary} <- Indexer.upsert_all(changes.entries),
         :ok <- validate_write_summary(write_summary),
         {:ok, deleted_count} <- Indexer.delete_many(changes.deletion_keys) do
      {:ok, Map.put(write_summary, :deleted, deleted_count)}
    end
  end

  defp prepare_changes(source_type, source_adapter, requested_ids, source_records) do
    records_by_id = Map.new(source_records, &{Source.id!(&1), &1})

    Enum.reduce_while(requested_ids, {:ok, %{entries: [], deletion_keys: []}}, fn source_id, {:ok, changes} ->
      case Map.get(records_by_id, source_id) do
        nil ->
          {:cont, {:ok, delete(changes, source_type, source_id)}}

        source_record ->
          prepare_record(changes, source_type, source_id, source_adapter, source_record)
      end
    end)
  end

  defp prepare_record(changes, source_type, source_id, source_adapter, source_record) do
    case source_adapter.to_entry(source_record) do
      {:ok, attrs} when is_map(attrs) ->
        entry = attrs |> Map.put(:source_type, source_type) |> Map.put(:source_id, source_id)
        {:cont, {:ok, %{changes | entries: [entry | changes.entries]}}}

      :skip ->
        {:cont, {:ok, delete(changes, source_type, source_id)}}

      {:error, {:invalid, category}} ->
        {:halt, {:error, {:invalid_search_source, category}}}

      {:error, reason} ->
        {:halt, {:error, reason}}

      _invalid ->
        {:halt, {:error, :invalid_adapter_result}}
    end
  end

  defp delete(changes, source_type, source_id) do
    %{changes | deletion_keys: [{source_type, source_id} | changes.deletion_keys]}
  end

  defp validate_write_summary(%{invalid: 0}), do: :ok
  defp validate_write_summary(_summary), do: {:error, :invalid_search_entry}

  defp normalize_ids(ids), do: ids |> Enum.reject(&is_nil/1) |> Enum.uniq()
end
