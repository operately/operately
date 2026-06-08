defmodule Operately.ResourceHubs.ResourceHub do
  use Operately.Schema
  use Operately.ResourceHubs.Getter, source: :hub

  schema "resource_hubs" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    has_one :access_context, Operately.Access.Context, foreign_key: :resource_hub_id
    has_many :nodes, Operately.ResourceHubs.Node, foreign_key: :resource_hub_id

    field :name, :string
    field :description, :map

    # populated by after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(resource_hub, attrs) do
    resource_hub
    |> cast(attrs, [:space_id, :project_id, :name, :description])
    |> validate_required([:name])
    |> validate_parent()
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(resource_hub = %__MODULE__{}) do
    resource_hub = Repo.preload(resource_hub, [:space, project: [contributors: :person]])

    subscribers =
      if resource_hub.project do
        Operately.Notifications.Subscriber.from_project_contributor(resource_hub.project.contributors)
      else
        resource_hub = Repo.preload(resource_hub, space: :members)
        Operately.Notifications.Subscriber.from_space_members(resource_hub.space.members)
      end

    Map.put(resource_hub, :potential_subscribers, subscribers)
  end

  def load_comments_count(resource_hubs) when is_list(resource_hubs) do
    Enum.map(resource_hubs, &load_comments_count/1)
  end

  def load_comments_count(resource_hub = %__MODULE__{}) do
    nodes = Operately.ResourceHubs.Node.load_comments_count(resource_hub.nodes)
    Map.put(resource_hub, :nodes, nodes)
  end

  def set_children_count(resource_hubs) when is_list(resource_hubs) do
    Enum.map(resource_hubs, &set_children_count/1)
  end

  def set_children_count(resource_hub = %__MODULE__{}) do
    nodes = Operately.ResourceHubs.Folder.set_children_count(resource_hub.nodes)
    Map.put(resource_hub, :nodes, nodes)
  end

  def set_permissions(resource_hub = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.ResourceHubs.Permissions.calculate(resource_hub.request_info.access_level, company_read_only: company_read_only)
    Map.put(resource_hub, :permissions, perms)
  end

  defp validate_parent(changeset) do
    space_id = get_field(changeset, :space_id)
    project_id = get_field(changeset, :project_id)

    case {space_id, project_id} do
      {nil, nil} -> add_error(changeset, :base, "resource hub must belong to a space or project")
      {_, nil} -> changeset
      {nil, _} -> changeset
      {_, _} -> add_error(changeset, :base, "resource hub cannot belong to both a space and project")
    end
  end
end
