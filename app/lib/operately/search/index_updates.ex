defmodule Operately.Search.IndexUpdates do
  @moduledoc """
  Adds reliable source refreshes and structural deletion cleanup to canonical writes.

  Refresh jobs reload current source records after commit, keeping projection work out
  of the user-facing transaction while guaranteeing that every committed write has a
  durable refresh. Structural deletions remove affected entries synchronously so
  deleted content cannot remain visible while a job is pending.
  """

  alias Ecto.Multi
  alias Operately.Search.Indexer
  alias Operately.Search.IndexUpdates.Worker

  def enqueue(%Multi{} = multi, name, source_type, source_ids_or_builder) when is_binary(source_type) do
    Oban.insert(multi, name, fn changes ->
      source_ids = source_ids_or_builder |> resolve(changes) |> List.wrap()
      Worker.new(%{source_type: source_type, source_ids: source_ids})
    end)
  end

  def delete(%Multi{} = multi, name, source_type, source_ids_or_builder) when is_binary(source_type) do
    Multi.run(multi, name, fn _repo, changes ->
      source_keys =
        source_ids_or_builder
        |> resolve(changes)
        |> List.wrap()
        |> Enum.map(&{source_type, &1})

      Indexer.delete_many(source_keys)
    end)
  end

  def delete_scope(%Multi{} = multi, name, scope_field, scope_id_or_builder) do
    Indexer.delete_scope(multi, name, scope_field, scope_id_or_builder)
  end

  defp resolve(builder, changes) when is_function(builder, 1), do: builder.(changes)
  defp resolve(value, _changes), do: value
end
