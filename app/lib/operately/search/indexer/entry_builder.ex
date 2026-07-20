defmodule Operately.Search.Indexer.EntryBuilder do
  @moduledoc """
  Converts source-adapter attributes into validated rows for `search_entries`.

  It applies `Operately.Search.Entry` changesets so normalization, enum casting, and
  validation happen consistently before bulk persistence. `build/1` returns valid rows
  separately from invalid entries, allowing the indexer to commit valid work while
  reporting rejected records.
  """

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

  def fields, do: @entry_fields

  def build(attrs_list) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    attrs_list
    |> Enum.map(&build_entry(&1, now))
    |> Enum.reduce({[], []}, fn
      {:ok, row}, {valid, invalid} -> {[row | valid], invalid}
      {:error, error}, {valid, invalid} -> {valid, [error | invalid]}
    end)
    |> then(fn {valid, invalid} -> {Enum.reverse(valid), Enum.reverse(invalid)} end)
  end

  defp build_entry(attrs, now) do
    attrs = normalize_attrs(attrs)
    changeset = Entry.changeset(attrs)

    case Ecto.Changeset.apply_action(changeset, :insert) do
      {:ok, entry} -> {:ok, to_row(entry, now)}
      {:error, changeset} -> {:error, %{source_id: source_id(attrs), changeset: changeset}}
    end
  end

  defp normalize_attrs(attrs) do
    body = Map.get(attrs, :body) || Map.get(attrs, "body") || ""
    Map.put(attrs, :body, body)
  end

  defp source_id(attrs), do: Map.get(attrs, :source_id) || Map.get(attrs, "source_id")

  defp to_row(entry, now) do
    entry
    |> Map.from_struct()
    |> Map.take(@entry_fields)
    |> Map.put(:id, Ecto.UUID.generate())
    |> Map.put(:inserted_at, now)
    |> Map.put(:updated_at, now)
  end
end
