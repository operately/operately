defmodule Operately.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :owner, Operately.People.Person, foreign_key: :owner_id
    belongs_to :objective, Operately.Okrs.Objective, foreign_key: :objective_id

    field :description, :string
    field :name, :string

    field :started_at, :utc_datetime
    field :deadline, :utc_datetime

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :description, :group_id, :started_at, :deadline, :owner_id, :objective_id])
    |> validate_required([:name])
  end
end
