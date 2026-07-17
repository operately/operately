defmodule Operately.Search.Indexer do
  @moduledoc """
  Maintains `search_entries`, the searchable copy of Operately data used by full-text search.

  Source adapters provide attributes from the original projects, documents, and other
  records. The indexer validates and normalizes them, inserts new entries, updates changed
  entries without replacing their IDs, skips unchanged entries, and reports invalid input.
  It also removes entries when their source records are no longer searchable.

  Every write operation has an `Ecto.Multi` variant so the search entry can be updated in
  the same transaction as its source record. This module never changes the original record.
  """

  import Ecto.Query

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Search.Entry

  @entry_fields [
    :source_type,
    :source_id,
    :company_id,
    :access_context_id,
    :resource_hub_id,
    :space_id,
    :project_id,
    :goal_id,
    :title,
    :normalized_title,
    :body,
    :body_kind,
    :state,
    :source_inserted_at,
    :source_updated_at
  ]
  @replace_fields @entry_fields -- [:source_type, :source_id]

  def upsert(attrs) when is_map(attrs), do: upsert_all([attrs])

  def upsert_all(attrs_list) when is_list(attrs_list) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    {valid_rows, invalid_entries} = validate_entries(attrs_list, now)
    existing_entries = load_existing_entries(valid_rows)
    {rows_to_write, counts} = classify_entries(valid_rows, existing_entries)

    case write_entries(rows_to_write) do
      :ok ->
        {:ok,
         counts
         |> Map.put(:invalid, length(invalid_entries))
         |> Map.put(:invalid_entries, invalid_entries)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def upsert(%Multi{} = multi, name, attrs) do
    Multi.run(multi, name, fn _repo, _changes -> upsert(attrs) end)
  end

  def upsert_all(%Multi{} = multi, name, attrs_list) do
    Multi.run(multi, name, fn _repo, _changes -> upsert_all(attrs_list) end)
  end

  def delete(source_type, source_id) when is_binary(source_type) and is_binary(source_id) do
    {count, _} =
      from(entry in Entry, where: entry.source_type == ^source_type and entry.source_id == ^source_id)
      |> Repo.delete_all()

    {:ok, count}
  end

  def delete_many(source_keys) when is_list(source_keys) do
    dynamic = source_keys_dynamic(source_keys)

    if dynamic == false do
      {:ok, 0}
    else
      {count, _} = from(entry in Entry, where: ^dynamic) |> Repo.delete_all()
      {:ok, count}
    end
  end

  def delete(%Multi{} = multi, name, source_type, source_id) do
    Multi.run(multi, name, fn _repo, _changes -> delete(source_type, source_id) end)
  end

  def delete_many(%Multi{} = multi, name, source_keys) do
    Multi.run(multi, name, fn _repo, _changes -> delete_many(source_keys) end)
  end

  defp validate_entries(attrs_list, now) do
    attrs_list
    |> Enum.map(&validate_entry(&1, now))
    |> Enum.reduce({[], []}, fn
      {:ok, row}, {valid, invalid} -> {[row | valid], invalid}
      {:error, error}, {valid, invalid} -> {valid, [error | invalid]}
    end)
    |> then(fn {valid, invalid} -> {Enum.reverse(valid), Enum.reverse(invalid)} end)
  end

  defp validate_entry(attrs, now) do
    attrs = normalize_attrs(attrs)
    changeset = Entry.changeset(attrs)

    case Ecto.Changeset.apply_action(changeset, :insert) do
      {:ok, entry} -> {:ok, entry_to_row(entry, now)}
      {:error, changeset} -> {:error, %{source_id: get_source_id(attrs), changeset: changeset}}
    end
  end

  defp normalize_attrs(attrs) do
    body = Map.get(attrs, :body) || Map.get(attrs, "body") || ""

    Map.put(attrs, :body, body)
  end

  defp get_source_id(attrs), do: Map.get(attrs, :source_id) || Map.get(attrs, "source_id")

  defp entry_to_row(entry, now) do
    entry
    |> Map.from_struct()
    |> Map.take(@entry_fields)
    |> Map.put(:id, Ecto.UUID.generate())
    |> Map.put(:inserted_at, now)
    |> Map.put(:updated_at, now)
  end

  defp load_existing_entries([]), do: %{}

  defp load_existing_entries(rows) do
    keys = Enum.map(rows, &{&1.source_type, &1.source_id})
    dynamic = source_keys_dynamic(keys)

    from(entry in Entry, where: ^dynamic)
    |> Repo.all()
    |> Map.new(fn entry -> {{entry.source_type, entry.source_id}, entry} end)
  end

  defp source_keys_dynamic(source_keys) do
    Enum.reduce(source_keys, false, fn {source_type, source_id}, dynamic ->
      dynamic([entry], ^dynamic or (entry.source_type == ^source_type and entry.source_id == ^source_id))
    end)
  end

  defp classify_entries(rows, existing_entries) do
    initial_counts = %{inserted: 0, updated: 0, unchanged: 0}

    Enum.reduce(rows, {[], initial_counts}, fn row, {rows_to_write, counts} ->
      case Map.get(existing_entries, {row.source_type, row.source_id}) do
        nil ->
          {[row | rows_to_write], Map.update!(counts, :inserted, &(&1 + 1))}

        existing_entry ->
          if entry_changed?(existing_entry, row) do
            updated_row = %{row | id: existing_entry.id, inserted_at: existing_entry.inserted_at}
            {[updated_row | rows_to_write], Map.update!(counts, :updated, &(&1 + 1))}
          else
            {rows_to_write, Map.update!(counts, :unchanged, &(&1 + 1))}
          end
      end
    end)
  end

  defp entry_changed?(existing_entry, row) do
    Enum.any?(@entry_fields, fn field -> Map.get(existing_entry, field) != Map.get(row, field) end)
  end

  defp write_entries([]), do: :ok

  defp write_entries(rows) do
    Repo.insert_all(Entry, rows,
      on_conflict: {:replace, @replace_fields ++ [:updated_at]},
      conflict_target: [:source_type, :source_id]
    )

    :ok
  rescue
    error -> {:error, error}
  end
end
