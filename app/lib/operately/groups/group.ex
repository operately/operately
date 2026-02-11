defmodule Operately.Groups.Group do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo

  schema "groups" do
    belongs_to :company, Operately.Companies.Company

    has_many :memberships, Operately.Groups.Member, foreign_key: :group_id
    has_many :members, through: [:memberships, :person]
    has_one :access_context, Operately.Access.Context, foreign_key: :group_id

    field :name, :string
    field :mission, :string

    has_many :tasks, Operately.Tasks.Task, foreign_key: :space_id
    embeds_one :tools, Operately.Groups.SpaceTools, on_replace: :delete
    embeds_many :task_statuses, Operately.Tasks.Status, on_replace: :delete
    field :tasks_kanban_state, :map, default: Operately.Tasks.KanbanState.initialize()

    # populated by after load hooks
    field :is_member, :boolean, virtual: true
    field :access_levels, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :permissions, :any, virtual: true

    timestamps()
    soft_delete()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:company_id, :name, :mission, :deleted_at, :tasks_kanban_state])
    |> cast_embed(:tools)
    |> cast_embed(:task_statuses)
    |> put_default_tools()
    |> put_default_task_statuses()
    |> validate_required([:company_id, :name, :mission])
  end

  defp put_default_tools(%Ecto.Changeset{data: %__MODULE__{id: nil}} = changeset) do
    case Ecto.Changeset.get_field(changeset, :tools) do
      nil -> Ecto.Changeset.put_embed(changeset, :tools, Operately.Groups.SpaceTools.default_settings())
      _ -> changeset
    end
  end

  defp put_default_tools(changeset), do: changeset

  defp put_default_task_statuses(%Ecto.Changeset{data: %__MODULE__{id: nil}} = changeset) do
    # Only set defaults for new spaces, and only if task_statuses is empty or not provided
    case Ecto.Changeset.get_field(changeset, :task_statuses) do
      [] -> Ecto.Changeset.put_embed(changeset, :task_statuses, Operately.Tasks.Status.default_task_statuses())
      nil -> Ecto.Changeset.put_embed(changeset, :task_statuses, Operately.Tasks.Status.default_task_statuses())
      _ -> changeset
    end
  end

  defp put_default_task_statuses(changeset), do: changeset

  def task_status_values(space = %__MODULE__{}) do
    space.task_statuses
    |> Elixir.List.wrap()
    |> Enum.map(& &1.value)
    |> Enum.filter(& &1)
    |> Enum.map(&to_string/1)
  end

  def get_default_task_status(space = %__MODULE__{}) do
    statuses = space.task_statuses

    Enum.find(statuses, fn s -> s.color == :gray end) ||
      Enum.find(statuses, fn s -> s.color == :blue end) ||
      List.first(statuses)
  end

  #
  # Scopes
  #

  import Ecto.Query
  alias Operately.Access.Filters

  def scope_company(query, company_id) do
    from g in query, where: g.company_id == ^company_id
  end

  #
  # After Query Hooks
  #

  def load_is_member(group, person) do
    is_member = Operately.Groups.is_member?(group, person)

    %{group | is_member: is_member}
  end

  def preload_access_levels(group) do
    context = Operately.Access.get_context!(group_id: group.id)
    access_levels = Operately.Access.AccessLevels.load(context.id, group.company_id, group.id)

    Map.put(group, :access_levels, access_levels)
  end

  def preload_members_access_level(space = %__MODULE__{}) do
    subquery =
      from(b in Operately.Access.Binding,
        join: c in assoc(b, :context),
        where: c.group_id == ^space.id,
        select: b
      )

    Repo.preload(space, members: [access_group: [bindings: subquery]])
  end

  def set_potential_subscribers(space = %__MODULE__{}) do
    subscribers = Operately.Notifications.Subscriber.from_space_members(space.members)
    Map.put(space, :potential_subscribers, subscribers)
  end

  def preload_permissions(space = %__MODULE__{}) do
    Map.put(space, :permissions, Operately.Groups.Permissions.calculate_permissions(space.request_info.access_level))
  end

  def search(person, query, access_level \\ nil)
  def search(person, query, nil), do: search(person, query, :view_access)

  def search(person, query, access_level) do
    from(s in __MODULE__)
    |> where([s], s.company_id == ^person.company_id)
    |> where([s], ilike(s.name, ^"%#{query}%"))
    |> Filters.filter_by_access(person.id, access_level)
    |> order_by([s], asc: s.name)
    |> Operately.Repo.all()
  end

  def count_by_access_level(person, access_level) do
    from(s in __MODULE__)
    |> where([s], s.company_id == ^person.company_id)
    |> Filters.filter_by_access(person.id, access_level)
    |> Operately.Repo.aggregate(:count)
  end
end
