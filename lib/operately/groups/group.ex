defmodule Operately.Groups.Group do
  use Operately.Schema

  schema "groups" do
    has_many :members, Operately.Groups.Member, foreign_key: :group_id

    field :company_id, :binary_id
    field :name, :string
    field :mission, :string
    field :icon, :string, default: "IconPlanet"
    field :color, :string, default: "text-green-500"

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
end
