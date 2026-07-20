defmodule Operately.Data.Change107BackfillLinkNamesFromNodes do
  @moduledoc """
  Copies link titles from resource_nodes.name into resource_links.name.

  Idempotent: only updates links where name is NULL and the node still has a name.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Link, Node}

  def run do
    from(l in Link,
      join: n in Node,
      on: l.node_id == n.id,
      where: n.type == "link" and is_nil(l.name) and not is_nil(n.name),
      update: [set: [name: n.name]]
    )
    |> Repo.update_all([])
  end

  defmodule Link do
    use Operately.Schema

    schema "resource_links" do
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
