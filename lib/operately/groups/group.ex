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
    |> cast(attrs, [:company_id, :name, :mission, :deleted_at])
    |> validate_required([:company_id, :name, :mission ])
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

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

  def load_unread_notifications(space = %__MODULE__{}, person) do
    actions = [
      "space_members_added",
    ]

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action in ^actions and a.content["space_id"] == ^space.id,
        where: n.person_id == ^person.id and not n.read,
        select: n
      )
      |> Repo.all()

    Map.put(space, :notifications, notifications)
  end

  def preload_access_levels(group) do
    context = Operately.Access.get_context!(group_id: group.id)
    access_levels = Operately.Access.AccessLevels.load(context.id, group.company_id, group.id)

    Map.put(group, :access_levels, access_levels)
  end

  def preload_members_access_level(space = %__MODULE__{}) do
    subquery = from(b in Operately.Access.Binding,
      join: c in assoc(b, :context),
      where: c.group_id == ^space.id,
      select: b
    )

    Repo.preload(space, [members: [access_group: [bindings: subquery]]])
  end

  def set_potential_subscribers(space = %__MODULE__{}) do
    subscribers = Operately.Notifications.Subscriber.from_space_members(space.members)
    Map.put(space, :potential_subscribers, subscribers)
  end

  def preload_permissions(space = %__MODULE__{}) do
    Map.put(space, :permissions, Operately.Groups.Permissions.calculate_permissions(space.request_info.access_level))
  end
end
