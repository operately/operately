defmodule Operately.Goals.Goal do
  use Operately.Schema

  import Ecto.Changeset
  import Operately.SoftDelete.Schema

  schema "goals" do
    field :name, :string
    field :group_id, :binary_id

    timestamps()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [:name, :group_id])
    |> validate_required([:name, :group_id])
  end
end
