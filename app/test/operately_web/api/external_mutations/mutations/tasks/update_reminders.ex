defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.UpdateReminders do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "tasks/update_reminders"

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
      reminders: [
        %{type: "on_date", days: nil, date: "2026-06-03"}
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.task.id
    refute Map.has_key?(response, :error)
  end
end
