defmodule Operately.Goals.Goal do
  use Operately.Schema

  import Ecto.Changeset
  import Operately.SoftDelete.Schema

  schema "goals" do
    field :name, :string

    field :company_id, :binary_id
    field :group_id, :binary_id

    field :champion_id, :binary_id
    field :reviewer_id, :binary_id
    field :creator_id, :binary_id

    field :timeframe, :string
    field :next_update_scheduled_at, :utc_datetime

    timestamps()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [:name, :company_id, :group_id, :champion_id, :reviewer_id, :creator_id, :timeframe])
    |> validate_required([:name, :company_id, :group_id, :champion_id, :reviewer_id, :creator_id, :timeframe])
  end
end
