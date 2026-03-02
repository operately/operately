defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.UpdateDueDate do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/update_due_date"

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
      due_date: date(7)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    refute Map.has_key?(response, :error)
  end

  defp date(days) do
    %{
      date: Date.utc_today() |> Date.add(days) |> Date.to_iso8601(),
      date_type: "day",
      value: "date"
    }
  end
end
