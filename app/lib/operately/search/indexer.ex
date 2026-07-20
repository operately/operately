defmodule Operately.Search.Indexer do
  @moduledoc """
  Maintains `search_entries`, the searchable copy of Operately data used by full-text search.

  Canonical writes use `upsert/1`. Backfills use guarded writes, which never replace an
  entry with an older or equal-but-different source version. Reconciliation uses the
  locked-repair API after locking and re-reading the canonical source row.

  Every operation has an `Ecto.Multi` variant so callers can update the search entry in
  the same transaction as its source record. Attribute builders passed to those variants
  receive the results of earlier Multi operations.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Search.Indexer.Writer

  def upsert(attrs) when is_map(attrs), do: upsert_all([attrs])
  def upsert_all(attrs_list) when is_list(attrs_list), do: transact_write(attrs_list, &Writer.authoritative/2)

  def upsert_guarded(attrs) when is_map(attrs), do: upsert_all_guarded([attrs])
  def upsert_all_guarded(attrs_list) when is_list(attrs_list), do: transact_write(attrs_list, &Writer.guarded/2)

  def repair_locked(attrs) when is_map(attrs), do: repair_all_locked([attrs])
  def repair_all_locked(attrs_list) when is_list(attrs_list), do: transact_write(attrs_list, &Writer.repair/2)

  def upsert(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entry_write(multi, name, attrs_or_builder, &Writer.authoritative/2)
  end

  def upsert_all(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entries_write(multi, name, attrs_or_builder, &Writer.authoritative/2)
  end

  def upsert_guarded(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entry_write(multi, name, attrs_or_builder, &Writer.guarded/2)
  end

  def upsert_all_guarded(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entries_write(multi, name, attrs_or_builder, &Writer.guarded/2)
  end

  def repair_locked(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entry_write(multi, name, attrs_or_builder, &Writer.repair/2)
  end

  def repair_all_locked(%Multi{} = multi, name, attrs_or_builder) do
    add_multi_entries_write(multi, name, attrs_or_builder, &Writer.repair/2)
  end

  def delete(source_type, source_id) when is_binary(source_type) and is_binary(source_id) do
    {:ok, Writer.delete(Repo, source_type, source_id)}
  end

  def delete_many(source_keys) when is_list(source_keys) do
    {:ok, Writer.delete_many(Repo, source_keys)}
  end

  def delete(%Multi{} = multi, name, source_type, source_id) do
    Multi.run(multi, name, fn repo, _changes -> {:ok, Writer.delete(repo, source_type, source_id)} end)
  end

  def delete_many(%Multi{} = multi, name, source_keys) do
    Multi.run(multi, name, fn repo, _changes -> {:ok, Writer.delete_many(repo, source_keys)} end)
  end

  defp transact_write(attrs_list, write) do
    Repo.transaction(fn -> write.(Repo, attrs_list) end)
  end

  defp add_multi_entry_write(multi, name, attrs_or_builder, write) do
    Multi.run(multi, name, fn repo, changes ->
      attrs = resolve_attrs(attrs_or_builder, changes)
      {:ok, write.(repo, [attrs])}
    end)
  end

  defp add_multi_entries_write(multi, name, attrs_or_builder, write) do
    Multi.run(multi, name, fn repo, changes ->
      attrs_list = resolve_attrs(attrs_or_builder, changes)
      {:ok, write.(repo, attrs_list)}
    end)
  end

  defp resolve_attrs(builder, changes) when is_function(builder, 1), do: builder.(changes)
  defp resolve_attrs(attrs, _changes), do: attrs
end
