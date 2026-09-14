defmodule Operately.ResourceHubs.Drafts do
  @moduledoc "Lists an author's drafts in the live folder tree of an authorized hub."

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.{Folder, Node}

  def list(hub, author) do
    paths = folder_paths(hub.id)

    from(n in Node,
      where: n.resource_hub_id == ^hub.id and is_nil(n.deleted_at)
    )
    |> Node.preload_content(author)
    |> where([document: d], d.state == :draft and d.author_id == ^author.id and is_nil(d.deleted_at))
    |> order_by([document: d], desc: d.updated_at, asc: d.id)
    |> Repo.all()
    |> Enum.filter(&(is_nil(&1.parent_folder_id) or Map.has_key?(paths, &1.parent_folder_id)))
    |> Enum.map(&%{&1 | path_to_node: Map.get(paths, &1.parent_folder_id, [])})
  end

  defp folder_paths(hub_id) do
    tree = reachable_folders(hub_id)

    folders =
      from(f in Folder, join: path in "draft_folder_paths", on: path.id == f.id, join: n in assoc(f, :node), preload: [node: n], select: {f, type(path.path, {:array, :binary_id})})
      |> recursive_ctes(true)
      |> with_cte("draft_folder_paths", as: ^tree)
      |> Repo.all()

    by_id = Map.new(folders, fn {folder, _path} -> {folder.id, folder} end)
    Map.new(folders, fn {folder, path} -> {folder.id, Enum.map(path, &Map.fetch!(by_id, &1))} end)
  end

  # Walks live folders from the hub's root, building ordered ID paths and avoiding cycles.
  # Folders beneath deleted or missing ancestors are never reached.
  defp reachable_folders(hub_id) do
    folders =
      from(f in Folder,
        join: n in assoc(f, :node),
        where: n.resource_hub_id == ^hub_id and n.type == :folder,
        where: is_nil(f.deleted_at) and is_nil(n.deleted_at)
      )

    roots =
      from([f, n] in folders,
        where: is_nil(n.parent_folder_id),
        select: %{id: f.id, path: fragment("ARRAY[?]::uuid[]", f.id)}
      )

    children =
      from([f, n] in folders,
        join: parent in "draft_folder_paths",
        on: parent.id == n.parent_folder_id,
        where: fragment("NOT (? = ANY(?))", f.id, parent.path),
        select: %{id: f.id, path: fragment("array_append(?, ?)", parent.path, f.id)}
      )

    union_all(roots, ^children)
  end
end
