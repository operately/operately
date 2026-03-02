defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectMilestones.UpdateKanban do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_milestones/update_kanban"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
  end

  @impl true
  def inputs(ctx) do
    ctx = Factory.log_in_person(ctx, :creator)

    status_input =
      Enum.find(ctx.project.task_statuses || [], fn s -> s.value == "in_progress" end)
      |> then(fn status ->
        status
        |> Map.from_struct()
        |> Map.put(:color, to_string(status.color))
      end)

    kanban_state = %{
      pending: [],
      in_progress: [Paths.task_id(ctx.task)],
      done: [],
      canceled: []
    }

    %{
      milestone_id: Paths.milestone_id(ctx.milestone),
      task_id: Paths.task_id(ctx.task),
      status: status_input,
      kanban_state: Jason.encode!(kanban_state)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    assert response.task.status.value == "in_progress"
    refute Map.has_key?(response, :error)
  end
end
