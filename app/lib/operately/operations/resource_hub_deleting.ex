defmodule Operately.Operations.ResourceHubDeleting do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.{Document, File, Link, Node}

  def run(author, hub) do
    Multi.new()
    |> Multi.run(:space, fn repo, _ -> Locking.lock_for_update(repo, %Group{id: hub.space_id}) end)
    |> Multi.run(:hub, fn repo, _ -> Locking.lock_for_update(repo, hub) end)
    |> Multi.run(:not_default, fn _, %{space: space, hub: current} ->
      if space.default_resource_hub_id == current.id, do: {:error, :default_hub}, else: {:ok, :allowed}
    end)
    |> Multi.run(:empty, fn repo, %{hub: current} -> ensure_empty(repo, current) end)
    |> Multi.run(:removed_content, fn repo, %{hub: current} -> delete_removed_content(repo, current) end)
    |> Activities.insert_sync(author.id, :resource_hub_deleted, fn %{space: space, hub: current} ->
      %{company_id: space.company_id, space_id: space.id, resource_hub_id: current.id, name: current.name}
    end)
    |> Multi.delete(:deleted_hub, fn %{hub: current} -> current end)
    |> Repo.transaction()
    |> normalize_result()
  end

  defp ensure_empty(repo, hub) do
    # Every live subtree has a top-level node. Deleted folders hide their descendants.
    if repo.exists?(from n in Node, where: n.resource_hub_id == ^hub.id and is_nil(n.parent_folder_id)) do
      {:error, :not_empty}
    else
      {:ok, :empty}
    end
  end

  # Temporary cleanup while content deletion uses soft deletes. Deleting the hub
  # cascades to all remaining child records through foreign keys; comments,
  # reactions, and search entries need explicit cleanup because they lack those keys.
  # Remove this step once content deletion permanently removes children and their
  # associated records, so an empty hub has no remaining content to clean up.
  defp delete_removed_content(repo, hub) do
    resource_ids =
      Enum.flat_map([Document, File, Link], fn schema ->
        repo.all(from(r in schema, join: n in assoc(r, :node), where: n.resource_hub_id == ^hub.id, select: r.id), with_deleted: true)
      end)

    thread_ids = repo.all(from t in Operately.Comments.InlineThread, where: t.resource_id in ^resource_ids, select: t.id)
    {_, comment_ids} = Operately.Updates.delete_comments(resource_ids ++ thread_ids)
    Operately.Updates.delete_reactions(resource_ids ++ thread_ids ++ comment_ids)
    repo.delete_all(from e in Operately.Search.Entry, where: e.resource_hub_id == ^hub.id)

    {:ok, :deleted}
  end

  defp normalize_result({:ok, %{deleted_hub: hub}}), do: {:ok, hub}
  defp normalize_result({:error, _step, error, _changes}), do: {:error, error}
end
