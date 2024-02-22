defmodule Operately.Projects.CheckIn do
  use Operately.Schema

  schema "project_check_ins" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id

    field :status, :string
    field :description, :map

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:author_id, :project_id, :description, :status])
    |> validate_required([:author_id, :project_id, :description, :status])
  end
end
