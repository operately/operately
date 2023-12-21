defmodule Operately.Goals.Target do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "targets" do
    belongs_to :goal, Operately.Goals.Goal

    field :from, :float
    field :name, :string
    field :to, :float
    field :unit, :string
    field :index, :integer

    field :value, :float

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(target, attrs) do
    target
    |> cast(attrs, [:name, :from, :to, :unit, :goal_id, :index, :value])
    |> validate_required([:name, :from, :to, :unit, :goal_id, :index, :value])
  end
end
