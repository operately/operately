defmodule Operately.ResourceHubs do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.ResourceHubs.{ResourceHub, Folder, Node, Document}

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
  # Nodes
  #

  def create_node(attrs \\ %{}) do
    %Node{}
    |> Node.changeset(attrs)
    |> Repo.insert()
  end
end
