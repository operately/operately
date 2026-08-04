defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ProjectTemplate do
  alias Operately.Tasks.KanbanState
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(template, level: :essential) do
    %{
      id: Paths.project_template_id(template),
      name: template.name,
      description: template.description && Jason.encode!(template.description),
      duration_days: template.duration_days,
      space: Serializer.serialize(template.space),
      creator: Serializer.serialize(template.creator),
      archived_at: Serializer.serialize(template.archived_at),
      inserted_at: Serializer.serialize(template.inserted_at),
      updated_at: Serializer.serialize(template.updated_at),
      milestone_count: template.milestone_count,
      task_count: template.task_count
    }
  end

  def serialize(template, level: :full) do
    template
    |> serialize(level: :essential)
    |> Map.merge(%{
      task_statuses: Serializer.serialize(template.task_statuses),
      milestones_ordering_state: template.milestones_ordering_state,
      tasks_kanban_state: Serializer.serialize(%KanbanState{state: template.tasks_kanban_state}),
      milestones: Serializer.serialize(template.milestones, level: :full),
      tasks: Serializer.serialize(template.tasks, level: :full)
    })
  end
end
