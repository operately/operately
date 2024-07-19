defmodule Operately.Groups.Group do
  use Operately.Schema

  schema "groups" do
    belongs_to :company, Operately.Companies.Company

    has_many :memberships, Operately.Groups.Member, foreign_key: :group_id
    has_many :members, through: [:memberships, :person]
    has_one :access_context, Operately.Access.Context, foreign_key: :group_id

    field :name, :string
    field :mission, :string
    field :icon, :string, default: "IconPlanet"
    field :color, :string, default: "text-green-500"

    # populated by after load hooks
    field :is_member, :boolean, virtual: true
    field :access_levels, :any, virtual: true

    timestamps()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:company_id, :name, :mission, :icon, :color, :deleted_at])
    |> validate_required([:company_id, :name, :mission, :icon, :color])
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_company(query, company_id) do
    from g in query, where: g.company_id == ^company_id
  end

  def preload_members_access_level(query, space_id) do
    subquery = from(b in Operately.Access.Binding,
      join: c in assoc(b, :context),
      where: c.group_id == ^space_id,
      select: b
    )

    from(s in query,
      join: members in assoc(s, :memberships),
      join: person in assoc(members, :person),
      join: group in assoc(person, :access_group),
      where: s.id == ^space_id,
      preload: [memberships: {members, [person: {person, [access_group: {group, [bindings: ^subquery]}]}]}]
    )
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
end
