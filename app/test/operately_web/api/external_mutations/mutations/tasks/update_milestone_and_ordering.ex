defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.UpdateMilestoneAndOrdering do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/update_milestone_and_ordering"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.add_project_milestone(:target_milestone, :project)
  end

  @impl true
  def inputs(ctx) do
    %{
      task_id: Paths.task_id(ctx.task),
      milestone_id: Paths.milestone_id(ctx.target_milestone),
      milestones_ordering_state: [
        %{
          milestone_id: Paths.milestone_id(ctx.milestone),
          ordering_state: []
        },
        %{
          milestone_id: Paths.milestone_id(ctx.target_milestone),
          ordering_state: [Paths.task_id(ctx.task)]
        }
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    refute Map.has_key?(response, :error)
  end
end
