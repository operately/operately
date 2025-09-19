defmodule Operately.ResourceHubs do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.ResourceHubs.{ResourceHub, Folder, Node, Document, File, Link}

  def list_resource_hubs(space) do
    from(r in ResourceHub, where: r.space_id == ^space.id)
    |> Repo.all()
  end

  defdelegate create_resource_hub(creator, space, attrs), to: Operately.Operations.ResourceHubCreating, as: :run

  #
  # Folders
  #

  def list_folders(resource_hub = %ResourceHub{}) do
    from(f in Folder,
      join: n in assoc(f, :node),
      preload: [node: n],
      where: n.resource_hub_id == ^resource_hub.id,
      select: f
    )
    |> Repo.all()
  end

  def list_folders(folder = %Folder{}) do
    from(f in Folder,
      join: n in assoc(f, :node),
      preload: [node: n],
      where: n.parent_folder_id == ^folder.id,
      select: f
    )
    |> Repo.all()
  end

  def create_folder(attrs \\ %{}) do
    %Folder{}
    |> Folder.changeset(attrs)
    |> Repo.insert()
  end

  #
  # Documents
  #

  def list_documents(resource_hub = %ResourceHub{}) do
    from(d in Document,
      join: n in assoc(d, :node),
      preload: [node: n],
      where: n.resource_hub_id == ^resource_hub.id,
      select: d
    )
    |> Repo.all()
  end

  def list_documents(folder = %Folder{}) do
    from(d in Document,
      join: n in assoc(d, :node),
      preload: [node: n],
      where: n.parent_folder_id == ^folder.id,
      select: d
    )
    |> Repo.all()
  end

  def create_document(attrs \\ %{}) do
    %Document{}
    |> Document.changeset(attrs)
    |> Repo.insert()
  end

  #
  # Files
  #

  def list_files(resource_hub = %ResourceHub{}) do
    from(f in File,
      join: n in assoc(f, :node),
      preload: [node: n],
      where: n.resource_hub_id == ^resource_hub.id,
      select: f
    )
    |> Repo.all()
  end

  def list_files(folder = %Folder{}) do
    from(f in File,
      join: n in assoc(f, :node),
      preload: [node: n],
      where: n.parent_folder_id == ^folder.id,
      select: f
    )
    |> Repo.all()
  end

  def create_file(attrs \\ %{}) do
    %File{}
    |> File.changeset(attrs)
    |> Repo.insert()
  end

  #
  # Links
  #

  def list_links(resource_hub = %ResourceHub{}) do
    from(l in Link,
      join: n in assoc(l, :node),
      preload: [node: n],
      where: n.resource_hub_id == ^resource_hub.id,
      select: l
    )
    |> Repo.all()
  end

  def list_links(folder = %Folder{}) do
    from(l in Link,
      join: n in assoc(l, :node),
      preload: [node: n],
      where: n.parent_folder_id == ^folder.id,
      select: l
    )
    |> Repo.all()
  end

  def create_link(attrs \\ %{}) do
    %Link{}
    |> Link.changeset(attrs)
    |> Repo.insert()
  end

  #
  # Nodes
  #

  def get_node!(id), do: Repo.get!(Node, id)

  def count_children(resource_hub = %ResourceHub{}) do
    from(n in Node, where: n.resource_hub_id == ^resource_hub.id)
    |> Repo.aggregate(:count, :id)
  end

  def count_children(folder = %Folder{}) do
    from(n in Node, where: n.parent_folder_id == ^folder.id)
    |> Repo.aggregate(:count, :id)
  end

  def create_node(attrs \\ %{}) do
    %Node{}
    |> Node.changeset(attrs)
    |> Repo.insert()
  end

  def update_node(%Node{} = node, attrs) do
    node
    |> Node.changeset(attrs)
    |> Repo.update()
  end
end
