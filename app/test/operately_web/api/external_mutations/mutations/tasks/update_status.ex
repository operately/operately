defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.UpdateStatus do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/update_status"

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
    %{
      task_id: Paths.task_id(ctx.task),
      type: "project",
      status: done_status(ctx.task)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.task.id == Paths.task_id(ctx.task)
    assert response.task.status.id == done_status(ctx.task).id
    refute Map.has_key?(response, :error)
  end

  defp done_status(task) do
    task
    |> Operately.Tasks.Task.available_statuses()
    |> Enum.find(&(&1.value == "done"))
    |> Map.from_struct()
    |> Map.update!(:color, &to_string/1)
  end
end
