defmodule Operately.ResourceHubs.ResourceHub do
  use Operately.Schema

  import Operately.Repo.RequestInfo, only: [request_info: 0]

  alias Operately.ResourceHubs.{Getter, Parent}

  schema "resource_hubs" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

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
    |> validate_project_or_space()
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

  defp validate_project_or_space(changeset) do
    project_id = Ecto.Changeset.get_field(changeset, :project_id)
    space_id = Ecto.Changeset.get_field(changeset, :space_id)

    case {project_id, space_id} do
      {nil, nil} ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "either project_id or space_id must be present")
        |> Ecto.Changeset.add_error(:space_id, "either project_id or space_id must be present")

      {nil, _space_id} ->
        changeset

      {_project_id, nil} ->
        changeset

      {_project_id, _space_id} ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "cannot have both project_id and space_id")
        |> Ecto.Changeset.add_error(:space_id, "cannot have both project_id and space_id")
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
