defmodule Operately.Projects.Contributor do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_contributors" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id

    field :responsibility, :string

    timestamps()
  end

  @doc false
  def changeset(contributor, attrs) do
    contributor
    |> cast(attrs, [:responsibility, :project_id, :person_id])
    |> validate_required([:responsibility])
  end
end
