defmodule Operately.ProjectTemplates.Graph.Validator do
  alias Operately.ProjectTemplates.{Comment, Discussion, Milestone, Person, ProjectTemplate, ResourceNode, Task, TaskAssignment}
  alias Operately.ProjectTemplates.Resources

  def validate(%ProjectTemplate{} = template, opts \\ []) do
    with :ok <- validate_active(template, Keyword.get(opts, :require_active, true)),
         :ok <- validate_changeset(template, :template, &ProjectTemplate.changeset(&1, %{})),
         :ok <- validate_changesets(template.milestones, :milestone, &Milestone.changeset(&1, %{})),
         :ok <- validate_changesets(template.tasks, :task, &Task.changeset(&1, %{})),
         :ok <- validate_changesets(template.discussions, :discussion, &Discussion.changeset(&1, %{})),
         :ok <- validate_changesets(template.comments, :comment, &Comment.changeset(&1, %{})),
         :ok <- validate_changesets(template.people, :person, &Person.changeset(&1, %{})),
         :ok <- validate_changesets(template.task_assignments, :task_assignment, &TaskAssignment.changeset(&1, %{})),
         :ok <- validate_task_containers(template),
         :ok <- validate_task_status_references(template),
         :ok <- validate_assignment_references(template),
         :ok <- Resources.validate(template.resource_nodes),
         :ok <- validate_comment_references(template) do
      :ok
    end
  end

  defp validate_active(%ProjectTemplate{archived_at: archived_at}, true)
       when not is_nil(archived_at),
       do: {:error, :template_not_active}

  defp validate_active(_template, _require_active), do: :ok

  defp validate_changesets(resources, type, changeset_fun) do
    Enum.reduce_while(resources, :ok, fn resource, :ok ->
      case validate_changeset(resource, type, changeset_fun) do
        :ok -> {:cont, :ok}
        error -> {:halt, error}
      end
    end)
  end

  defp validate_changeset(resource, type, changeset_fun) do
    changeset = changeset_fun.(resource)
    if changeset.valid?, do: :ok, else: {:error, {:invalid_child, type, changeset}}
  end

  defp validate_task_containers(template) do
    milestone_ids = MapSet.new(template.milestones, & &1.id)

    if Enum.all?(template.tasks, &valid_task_container?(&1, milestone_ids)) do
      :ok
    else
      {:error, {:invalid_template, :foreign_milestone}}
    end
  end

  defp valid_task_container?(%Task{project_template_milestone_id: nil}, _milestone_ids), do: true
  defp valid_task_container?(task, milestone_ids), do: MapSet.member?(milestone_ids, task.project_template_milestone_id)

  defp validate_task_status_references(template) do
    status_ids = MapSet.new(template.task_statuses, & &1.id)

    if Enum.all?(template.tasks, &(&1.task_status && MapSet.member?(status_ids, &1.task_status.id))) do
      :ok
    else
      {:error, {:invalid_template, :unknown_task_status}}
    end
  end

  defp validate_assignment_references(template) do
    task_ids = MapSet.new(template.tasks, & &1.id)
    person_ids = MapSet.new(template.people, & &1.id)
    assignment_keys = Enum.map(template.task_assignments, &{&1.project_template_task_id, &1.project_template_person_id})

    cond do
      not Enum.all?(template.task_assignments, &valid_assignment_reference?(&1, template.id, task_ids, person_ids)) ->
        {:error, {:invalid_template, :foreign_assignment_reference}}

      MapSet.size(MapSet.new(assignment_keys)) != length(assignment_keys) ->
        {:error, {:invalid_template, :duplicate_assignment}}

      true ->
        :ok
    end
  end

  defp valid_assignment_reference?(assignment, template_id, task_ids, person_ids) do
    assignment.project_template_id == template_id and
      MapSet.member?(task_ids, assignment.project_template_task_id) and
      MapSet.member?(person_ids, assignment.project_template_person_id)
  end

  defp validate_comment_references(template) do
    parent_ids = %{
      discussion: MapSet.new(template.discussions, & &1.id),
      document: resource_ids(template.resource_nodes, :document),
      file: resource_ids(template.resource_nodes, :file),
      link: resource_ids(template.resource_nodes, :link)
    }

    if Enum.all?(template.comments, &valid_comment_reference?(&1, template.id, parent_ids)) do
      :ok
    else
      {:error, {:invalid_template, :foreign_comment_parent}}
    end
  end

  defp resource_ids(nodes, type) do
    nodes
    |> Enum.filter(&(&1.type == type))
    |> MapSet.new(fn node -> resource(node, type).id end)
  end

  defp resource(%ResourceNode{} = node, type), do: Map.get(node, type)

  defp valid_comment_reference?(comment, template_id, parent_ids) do
    comment.project_template_id == template_id and
      Map.has_key?(parent_ids, comment.parent_type) and
      MapSet.member?(Map.fetch!(parent_ids, comment.parent_type), comment.parent_id)
  end
end
