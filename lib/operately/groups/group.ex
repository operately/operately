defmodule Operately.Groups.Group do
  use Operately.Schema

  schema "groups" do
    has_many :members, Operately.Groups.Member, foreign_key: :group_id

    field :name, :string
    field :mission, :string
    field :icon, :string, default: "IconPlanet"
    field :color, :string, default: "text-green-500"

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:name, :mission, :icon, :color])
    |> validate_required([:name, :mission, :icon, :color])
  end
end
