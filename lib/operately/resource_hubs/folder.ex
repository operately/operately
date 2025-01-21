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

  #
  # After load hooks
  #

  def set_children_count(nodes) when is_list(nodes) do
    folder_ids =
      nodes
      |> Enum.filter(&(&1.type == :folder))
      |> Enum.map(&(&1.folder.id))

    counts =
      from(n in Operately.ResourceHubs.Node,
        left_join: document in assoc(n, :document),
        where: n.parent_folder_id in ^folder_ids,
        where: n.type != :document or document.state != :draft,
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

  def find_path_to_folder(folder = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(folder.id, "resource_folders")

    Map.put(folder, :path_to_folder, path)
  end

  def load_comments_count(folder = %__MODULE__{}) do
    nodes = Operately.ResourceHubs.Node.load_comments_count(folder.child_nodes)
    Map.put(folder, :child_nodes, nodes)
  end

  def load_potential_subscribers(folder = %__MODULE__{}) do
    folder = Repo.preload(folder, space: :members)

    subscribers = Operately.Notifications.Subscriber.from_space_members(folder.space.members)
    Map.put(folder, :potential_subscribers, subscribers)
  end

  def set_permissions(folder = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(folder.request_info.access_level)
    Map.put(folder, :permissions, perms)
  end
end
