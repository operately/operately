defmodule Operately.ResourceHubs.Folder do
  def __api_typename__, do: "resource_hub_folder"

  use Operately.Schema
  use Operately.Repo.Getter

  import Ecto.Query

  alias Operately.Repo.Getter.Profile
  alias Operately.ResourceHubs.Parent

  schema "resource_folders" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :project, through: [:node, :resource_hub, :project]
    has_one :goal, through: [:node, :resource_hub, :goal]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :space_access_context, through: [:node, :resource_hub, :space, :access_context]
    has_one :project_access_context, through: [:node, :resource_hub, :project, :access_context]
    has_one :goal_access_context, through: [:node, :resource_hub, :goal, :access_context]
    has_many :child_nodes, Operately.ResourceHubs.Node, foreign_key: :parent_folder_id

    field :name, :string

    # populated with after load hooks
    field :access_context, :any, virtual: true
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
    |> cast(attrs, [:node_id, :name])
    |> validate_required([:node_id, :name])
  end

  def getter_profile(:default) do
    %Profile{
      scope: &Parent.scope_node_children/1,
      access_contexts: [:space_access_context, :project_access_context, :goal_access_context]
    }
  end

  #
  # After load hooks
  #

  def set_children_count(nodes) when is_list(nodes) do
    folder_ids =
      nodes
      |> Enum.filter(&(&1.type == :folder))
      |> Enum.map(& &1.folder.id)

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
    folder = Parent.preload_child_resource_hub(folder, people: true)
    subscribers = Parent.potential_subscribers(folder.resource_hub)
    Map.put(folder, :potential_subscribers, subscribers)
  end

  def set_permissions(folder = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.ResourceHubs.Permissions.calculate(folder.request_info.access_level, company_read_only: company_read_only)
    Map.put(folder, :permissions, perms)
  end
end
