defmodule Operately.ProjectTemplates.Person do
  def __api_typename__, do: "project_template_person"

  use Operately.Schema

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.{ProjectTemplate, TaskAssignment}

  @roles [:champion, :reviewer, :contributor]

  schema "project_template_people" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :person, Operately.People.Person

    has_many :task_assignments, TaskAssignment, foreign_key: :project_template_person_id

    field :role, Ecto.Enum, values: @roles, default: :contributor
    field :responsibility, :string
    field :access_level, :integer, default: 0

    timestamps()
  end

  def roles, do: @roles

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(person, attrs) do
    person
    |> cast(attrs, [:project_template_id, :person_id, :role, :responsibility, :access_level])
    |> validate_required([:project_template_id, :role, :access_level])
    |> validate_inclusion(:access_level, Binding.valid_access_levels(), message: "invalid access level")
  end
end
