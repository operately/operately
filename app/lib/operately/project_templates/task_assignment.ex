defmodule Operately.ProjectTemplates.TaskAssignment do
  def __api_typename__, do: "project_template_task_assignment"

  use Operately.Schema

  alias Operately.ProjectTemplates.{Person, ProjectTemplate, Task}

  schema "project_template_task_assignments" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :project_template_task, Task
    belongs_to :project_template_person, Person

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(assignment, attrs) do
    assignment
    |> cast(attrs, [:project_template_id, :project_template_task_id, :project_template_person_id])
    |> validate_required([:project_template_id, :project_template_task_id, :project_template_person_id])
  end
end
