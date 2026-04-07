defmodule OperatelyEmail.DigestParent do
  def for_task(task) do
    task = Operately.Repo.preload(task, [:project, :space])

    case Operately.Tasks.Task.task_type(task) do
      "project" ->
        %{id: task.project.id, type: :project, name: task.project.name}

      "space" ->
        %{id: task.space.id, type: :space, name: task.space.name}

      type ->
        raise "Unsupported task type for digest parent: #{inspect(type)}"
    end
  end

  def for_milestone(milestone) do
    milestone = Operately.Repo.preload(milestone, :project)

    %{
      id: milestone.project.id,
      type: :project,
      name: milestone.project.name
    }
  end
end
