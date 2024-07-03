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

    field :is_member, :boolean, virtual: true # populated by an after_query hook

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

  #
  # After Query Hooks
  #
  def load_is_member(group, person) do
    is_member = Operately.Groups.is_member?(group, person)
    
    %{group | is_member: is_member}
  end
end
