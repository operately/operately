defmodule Operately.Search.ResourceHubIndex do
  @moduledoc """
  Adds reliable resource-hub search refreshes and deletion cleanup to canonical operations.

  Ordinary writes enqueue an Oban job in the canonical transaction. The job reloads
  current data after commit, keeping search failures out of the user write path. Direct
  deletions and deleted folder trees are removed synchronously so hidden content does
  not remain searchable while a job is pending.
  """

  alias Ecto.Multi
  alias Operately.Search.{Indexer, SourceIndexer}
  alias Operately.Search.ResourceHubIndex.Tree
  alias Operately.Search.ResourceHubIndex.Worker

  @source_types %{
    folder: "resource_hub_folder",
    document: "resource_hub_document",
    file: "resource_hub_file",
    link: "resource_hub_link"
  }

  @doc """
  Adds a search-refresh job to `multi` for one or more resources.
  """
  def enqueue_resource(%Multi{} = multi, name, resource_type, source_ids_or_builder) do
    Oban.insert(multi, name, fn changes ->
      source_ids = source_ids_or_builder |> resolve(changes) |> List.wrap()

      Worker.new(%{
        source_type: source_type(resource_type),
        source_ids: source_ids
      })
    end)
  end

  @doc """
  Adds a search-refresh job to `multi` for every resource in a folder subtree.
  """
  def enqueue_folder_tree(%Multi{} = multi, name, folder_id_or_builder) do
    Oban.insert(multi, name, fn changes ->
      Worker.new(%{folder_id: resolve(folder_id_or_builder, changes)})
    end)
  end

  @doc """
  Adds synchronous search-entry deletion to `multi` for one or more resources.
  """
  def delete_resource(%Multi{} = multi, name, resource_type, source_ids_or_builder) do
    Multi.run(multi, name, fn _repo, changes ->
      source_type = source_type(resource_type)
      source_keys = source_ids_or_builder |> resolve(changes) |> List.wrap() |> Enum.map(&{source_type, &1})
      Indexer.delete_many(source_keys)
    end)
  end

  @doc """
  Adds synchronous search-entry deletion to `multi` for a complete folder subtree.
  """
  def delete_folder_tree(%Multi{} = multi, name, folder_id_or_builder) do
    Multi.run(multi, name, fn _repo, changes ->
      folder_id = resolve(folder_id_or_builder, changes)
      folder_id |> Tree.manifest() |> Tree.keys() |> Indexer.delete_many()
    end)
  end

  @doc """
  Reloads and synchronizes every searchable resource in a folder subtree.

  Returns summaries grouped by source type, or the first synchronization error.
  """
  def refresh_folder_tree(folder_id) do
    folder_id
    |> Tree.manifest()
    |> synchronize_manifest()
  end

  def source_type(resource_type), do: Map.fetch!(@source_types, resource_type)

  defp synchronize_manifest(manifest) do
    Enum.reduce_while(manifest, {:ok, %{}}, fn {source_type, ids}, {:ok, summaries} ->
      case SourceIndexer.sync_all(source_type, ids) do
        {:ok, summary} -> {:cont, {:ok, Map.put(summaries, source_type, summary)}}
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
  end

  defp resolve(builder, changes) when is_function(builder, 1), do: builder.(changes)
  defp resolve(value, _changes), do: value
end
