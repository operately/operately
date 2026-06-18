defmodule Operately.ResourceHubs.ResourceHub do
  use Operately.Schema

  import Operately.Repo.RequestInfo, only: [request_info: 0]

  alias Operately.ResourceHubs.{Getter, Parent}

  schema "resource_hubs" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :goal, Operately.Goals.Goal

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
    |> cast(attrs, [:space_id, :project_id, :goal_id, :name, :description])
    |> validate_required([:name])
    |> validate_parent()
  end

  def get(requester, args) do
    Getter.get(__MODULE__, requester, args, :hub)
  end

  def get!(requester, args) do
    case get(requester, args) do
      {:ok, resource} -> resource
      {:error, :not_found} -> raise Ecto.NoResultsError, queryable: __MODULE__
      {:error, reason} -> raise "Failed to get #{__MODULE__}: #{inspect(reason)}"
    end
  end

  defp validate_parent(changeset) do
    project_id = Ecto.Changeset.get_field(changeset, :project_id)
    space_id = Ecto.Changeset.get_field(changeset, :space_id)
    goal_id = Ecto.Changeset.get_field(changeset, :goal_id)

    case Enum.count([project_id, space_id, goal_id], &(!is_nil(&1))) do
      0 ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "exactly one of project_id, space_id, or goal_id must be present")
        |> Ecto.Changeset.add_error(:space_id, "exactly one of project_id, space_id, or goal_id must be present")
        |> Ecto.Changeset.add_error(:goal_id, "exactly one of project_id, space_id, or goal_id must be present")

      1 ->
        changeset

      _ ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "only one of project_id, space_id, or goal_id can be present")
        |> Ecto.Changeset.add_error(:space_id, "only one of project_id, space_id, or goal_id can be present")
        |> Ecto.Changeset.add_error(:goal_id, "only one of project_id, space_id, or goal_id can be present")
    end
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(resource_hub = %__MODULE__{}) do
    subscribers = Parent.potential_subscribers(resource_hub)
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
end
