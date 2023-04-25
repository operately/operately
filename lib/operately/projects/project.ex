defmodule Operately.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id

    field :description, :string
    field :name, :string

    has_one :ownership, Operately.Ownerships.Ownership, foreign_key: :target, on_replace: :update
    has_one :owner, through: [:ownership, :person]

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :description, :group_id])
    |> cast_assoc(:ownership)
    |> validate_required([:name, :description])
  end
end
