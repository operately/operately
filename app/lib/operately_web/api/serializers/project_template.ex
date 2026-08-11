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
      task_count: template.task_count,
      inactive_people_summary: template.inactive_people_summary,
      inactive_discussion_count: template.inactive_discussion_count
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
      tasks: Serializer.serialize(template.tasks, level: :full),
      people: Serializer.serialize(template.people, level: :full),
      task_assignments: Serializer.serialize(template.task_assignments, level: :full),
      discussions: Serializer.serialize(template.discussions, level: :full),
      permissions: Serializer.serialize(template.permissions)
    })
  end
end
