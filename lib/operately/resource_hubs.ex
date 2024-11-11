defmodule Operately.ResourceHubs do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.ResourceHubs.{ResourceHub, Folder, Node}

  def create_resource_hub(attrs \\ %{}) do
    %ResourceHub{}
    |> ResourceHub.changeset(attrs)
    |> Repo.insert()
  end

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
      where: n.folder_id == ^folder.id,
      select: f
    )
    |> Repo.all()
  end

  #
  # Folders
  #

  def create_folder(attrs \\ %{}) do
    %Folder{}
    |> Folder.changeset(attrs)
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
