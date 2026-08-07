defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.TaskAssignment do
  alias OperatelyWeb.Paths

  def serialize(assignment, level: :essential) do
    %{
      id: Paths.project_template_task_assignment_id(assignment),
      project_template_task_id: Paths.project_template_task_id(assignment.project_template_task_id),
      project_template_person_id: Paths.project_template_person_id(assignment.project_template_person_id)
    }
  end

  def serialize(assignment, level: :full), do: serialize(assignment, level: :essential)
end
