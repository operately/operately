defmodule Operately.Data.Change106BackfillDocumentNamesFromNodes do
  @moduledoc """
  Copies document titles from resource_nodes.name into resource_documents.name.

  Idempotent: only updates documents where name is NULL and the node still has a name.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Document, Node}

  def run do
    from(d in Document,
      join: n in Node,
      on: d.node_id == n.id,
      where: n.type == "document" and is_nil(d.name) and not is_nil(n.name),
      update: [set: [name: n.name]]
    )
    |> Repo.update_all([])
  end

  defmodule Document do
    use Operately.Schema

    schema "resource_documents" do
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
