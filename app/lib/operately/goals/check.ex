defmodule Operately.Goals.Check do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "goal_checks" do
    belongs_to(:goal, Operately.Goals.Goal)
    belongs_to(:creator, Operately.People.Person, foreign_key: :creator_id)

    field(:name, :string)
    field(:completed, :boolean, default: false)
    field(:index, :integer)

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(target, attrs) do
    target
    |> cast(attrs, [:goal_id, :creator_id, :name, :completed, :index])
    |> validate_required([:name, :goal_id, :creator_id, :index])
  end
end
