defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.Milestone do
  alias Operately.Tasks.KanbanState
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(milestone, level: :essential) do
    %{
      id: Paths.project_template_milestone_id(milestone),
      project_template_id: Paths.project_template_id(milestone.project_template_id),
      title: milestone.title,
      description: milestone.description && Jason.encode!(milestone.description),
      due_offset_days: milestone.due_offset_days,
      tasks_kanban_state: Serializer.serialize(%KanbanState{state: milestone.tasks_kanban_state}),
      tasks_ordering_state: milestone.tasks_ordering_state,
      inserted_at: Serializer.serialize(milestone.inserted_at),
      updated_at: Serializer.serialize(milestone.updated_at)
    }
  end

  def serialize(milestone, level: :full), do: serialize(milestone, level: :essential)
end
