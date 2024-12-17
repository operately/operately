defmodule Operately.ResourceHubs.Folder do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_folders" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :child_nodes, Operately.ResourceHubs.Node, foreign_key: :parent_folder_id

    # populated with after load hooks
    field :permissions, :any, virtual: true
    field :path_to_folder, :any, virtual: true
    field :children_count, :integer, virtual: true
    field :potential_subscribers, :any, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(folder, attrs) do
    folder
    |> cast(attrs, [:node_id])
    |> validate_required([:node_id])
  end

  def find_children_count(nodes) when is_list(nodes) do
    folder_ids =
      nodes
      |> Enum.filter(&(&1.type == :folder))
      |> Enum.map(&(&1.folder.id))

    counts =
      from(n in Operately.ResourceHubs.Node,
        where: n.parent_folder_id in ^folder_ids,
        group_by: n.parent_folder_id,
        select: {n.parent_folder_id, count(n.id)}
      )
      |> Repo.all()
      |> Enum.into(%{})

    Enum.map(nodes, fn n ->
      if n.type == :folder do
        count = Map.get(counts, n.folder.id, 0)
        folder = Map.put(n.folder, :children_count, count)
        Map.put(n, :folder, folder)
      else
        n
      end
    end)
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
        %__MODULE__{id: str_id, node: %{name: name, parent_folder_id: nil}}
      end)

    Map.put(folder, :path_to_folder, path)
  end

  def load_potential_subscribers(folder = %__MODULE__{}) do
    folder = Repo.preload(folder, space: :members)

    subscribers = Operately.Notifications.Subscriber.from_space_members(folder.space.members)
    Map.put(folder, :potential_subscribers, subscribers)
  end

  def set_children_count(folder = %__MODULE__{}) do
    nodes = Operately.ResourceHubs.Folder.find_children_count(folder.child_nodes)
    Map.put(folder, :child_nodes, nodes)
  end

  def set_permissions(folder = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(folder.request_info.access_level)
    Map.put(folder, :permissions, perms)
  end
end
