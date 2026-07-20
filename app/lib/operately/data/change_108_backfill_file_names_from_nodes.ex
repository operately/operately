defmodule Operately.Data.Change108BackfillFileNamesFromNodes do
  @moduledoc """
  Copies file titles from resource_nodes.name into resource_files.name.

  Idempotent: only updates files where name is NULL and the node still has a name.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{File, Node}

  def run do
    from(f in File,
      join: n in Node,
      on: f.node_id == n.id,
      where: n.type == "file" and is_nil(f.name) and not is_nil(n.name),
      update: [set: [name: n.name]]
    )
    |> Repo.update_all([])
  end

  defmodule File do
    use Operately.Schema

    schema "resource_files" do
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
