defmodule Operately.ResourceHubs.Folder do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_folders" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id

    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :child_nodes, Operately.ResourceHubs.Node, foreign_key: :parent_folder_id

    field :description, :map

    # populated with after load hooks
    field :permissions, :any, virtual: true
    field :path_to_folder, :any, virtual: true

    timestamps()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(folder, attrs) do
    folder
    |> cast(attrs, [:node_id, :description])
    |> validate_required([:node_id])
  end

  #
  # After load hooks
  #

  def find_path_to_folder(folder = %__MODULE__{}) do
    q = """
      WITH RECURSIVE folder_hierarchy AS (
        SELECT f.id, n.parent_folder_id, n.name
        FROM resource_folders f
        JOIN resource_nodes n ON f.node_id = n.id
        WHERE f.id = $1

        UNION ALL

        SELECT f.id, n.parent_folder_id, n.name
        FROM resource_folders f
        JOIN resource_nodes n ON f.node_id = n.id
        JOIN folder_hierarchy fh ON f.id = fh.parent_folder_id

      )
      SELECT id, name FROM folder_hierarchy WHERE id != $1;
    """
    {:ok, folder_id} = Ecto.UUID.dump(folder.id)
    {:ok, %{rows: rows}} = Operately.Repo.query(q, [folder_id])

    path =
      rows
      |> Enum.reverse()
      |> Enum.map(fn [id, name] ->
        {:ok, str_id} = Ecto.UUID.cast(id)
        %__MODULE__{id: str_id, node: %{name: name}}
      end)

    Map.put(folder, :path_to_folder, path)
  end
end
