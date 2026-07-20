defmodule Operately.Data.Change109BackfillFolderNamesFromNodes do
  @moduledoc """
  Copies folder titles from resource_nodes.name into resource_folders.name.

  Idempotent: only updates folders where name is NULL and the node still has a name.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Folder, Node}

  def run do
    from(f in Folder,
      join: n in Node,
      on: f.node_id == n.id,
      where: n.type == "folder" and is_nil(f.name) and not is_nil(n.name),
      update: [set: [name: n.name]]
    )
    |> Repo.update_all([])
  end

  defmodule Folder do
    use Operately.Schema

    schema "resource_folders" do
      field :node_id, :binary_id
      field :name, :string
    end
  end

  defmodule Node do
    use Operately.Schema

    schema "resource_nodes" do
      field :name, :string
      field :type, :string
    end
  end
end
